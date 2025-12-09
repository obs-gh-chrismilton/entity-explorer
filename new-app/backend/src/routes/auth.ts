// Authentication routes

import { Router, Request, Response } from 'express';
import { ObserveClient } from '../services/observe-client';

const router = Router();

// POST /api/auth/login - Login with username/password or API token
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { observeUrl, username, password, apiToken } = req.body;

    if (!observeUrl) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'observeUrl is required',
      });
      return;
    }

    // Validate that either username/password or apiToken is provided
    if (!apiToken && (!username || !password)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Either apiToken or username/password is required',
      });
      return;
    }

    let client: ObserveClient;
    let user;

    try {
      if (apiToken) {
        // Login with API token
        client = new ObserveClient(observeUrl, apiToken);
        user = await client.getCurrentUser();
      } else {
        // Login with username/password
        client = new ObserveClient(observeUrl, ''); // Temporary token
        user = await client.authenticate(username, password);
      }

      // Store authentication info in session
      req.session.observeToken = client.getToken();
      req.session.observeUrl = observeUrl;
      req.session.user = user;

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.error('Authentication error:', error);
      res.status(401).json({
        error: 'Authentication Failed',
        message: error.message || 'Invalid credentials',
      });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// POST /api/auth/logout - Logout and clear session
router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to logout',
      });
      return;
    }

    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

// GET /api/auth/status - Check authentication status
router.get('/status', (req: Request, res: Response): void => {
  if (req.session.user && req.session.observeToken) {
    res.json({
      authenticated: true,
      user: req.session.user,
      observeUrl: req.session.observeUrl,
    });
  } else {
    res.json({
      authenticated: false,
    });
  }
});

export default router;
