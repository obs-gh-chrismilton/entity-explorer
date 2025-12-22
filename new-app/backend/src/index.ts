// Main Express server entry point

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import dotenv from 'dotenv';
import router from './routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (important for sessions behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ============================================================================
// TEMPORARY TEST ENDPOINT - REMOVE AFTER TESTING GRAPHQL STRUCTURE
// ============================================================================
// This endpoint is placed BEFORE auth middleware to allow unauthenticated
// testing of GraphQL queries during development.
//
// ⚠️  WARNING: This endpoint exposes Observe data without authentication!
// ⚠️  MUST BE REMOVED before deploying to production!
//
// Usage: GET /api/test/graphql-structure?url=https://156247313073.observeinc.com&token=YOUR_TOKEN
// ============================================================================
app.get('/api/test/graphql-structure', async (req, res) => {
  try {
    const { url, token } = req.query;

    if (!url || !token) {
      return res.status(400).json({
        error: 'Missing required query params: url, token',
        example: '/api/test/graphql-structure?url=https://156247313073.observeinc.com&token=YOUR_TOKEN'
      });
    }

    const axios = require('axios');
    const baseUrl = String(url).replace(/\/$/, '');
    const tokenStr = String(token);

    // Extract customer ID from URL (e.g., https://156247313073.observeinc.com -> 156247313073)
    const urlMatch = baseUrl.match(/https?:\/\/(\d+)\.observe/);
    const customerId = urlMatch ? urlMatch[1] : null;

    // Simple test query to check authentication
    const testQuery = `
      query TestAuth {
        currentUser {
          id
          email
        }
      }
    `;

    // Try different auth header formats
    const authFormats = [
      {
        name: 'Bearer {customerId} {token}',
        header: customerId ? `Bearer ${customerId} ${tokenStr}` : null,
        skip: !customerId
      },
      {
        name: 'Bearer {token}',
        header: `Bearer ${tokenStr}`,
        skip: false
      },
      {
        name: '{customerId} {token}',
        header: customerId ? `${customerId} ${tokenStr}` : null,
        skip: !customerId
      },
      {
        name: '{token}',
        header: tokenStr,
        skip: false
      }
    ];

    const results = [];

    for (const format of authFormats) {
      if (format.skip) {
        results.push({
          format: format.name,
          skipped: true,
          reason: 'No customer ID available'
        });
        continue;
      }

      try {
        console.log(`\nTrying auth format: ${format.name}`);
        console.log(`Authorization header: ${format.header?.substring(0, 40)}...`);

        const response = await axios.post(
          `${baseUrl}/v1/meta`,
          {
            query: testQuery,
            variables: {}
          },
          {
            headers: {
              'Authorization': format.header,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        const hasData = response.data?.data?.currentUser;
        const hasErrors = response.data?.errors;

        results.push({
          format: format.name,
          success: hasData && !hasErrors,
          statusCode: response.status,
          hasData: !!hasData,
          hasErrors: !!hasErrors,
          currentUser: hasData ? response.data.data.currentUser : null,
          errors: hasErrors ? response.data.errors : null
        });

        console.log(`Result: ${hasData && !hasErrors ? 'SUCCESS' : 'FAILED'}`);
        if (hasData) {
          console.log(`User data: ${JSON.stringify(response.data.data.currentUser)}`);
        }
        if (hasErrors) {
          console.log(`Errors: ${JSON.stringify(response.data.errors)}`);
        }

      } catch (error: any) {
        results.push({
          format: format.name,
          success: false,
          statusCode: error.response?.status || null,
          error: error.message,
          errorDetails: error.response?.data || null
        });

        console.log(`Result: ERROR - ${error.message}`);
      }
    }

    // Find which format worked
    const workingFormat = results.find(r => r.success);

    res.json({
      tested: results.length,
      workingFormat: workingFormat?.format || 'None',
      results,
      summary: {
        customerId,
        baseUrl,
        recommendation: workingFormat
          ? `Use auth format: ${workingFormat.format}`
          : 'No working auth format found. Check token validity.'
      }
    });

  } catch (error: any) {
    console.error('Test endpoint error:', error.message);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});
// ============================================================================
// END TEMPORARY TEST ENDPOINT
// ============================================================================

// Session middleware
const sessionSecret = process.env.SESSION_SECRET || 'entity-explorer-secret-key-change-in-production';
const isProduction = process.env.NODE_ENV === 'production';

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // Require HTTPS in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'strict' : 'lax',
    },
    name: 'entity_explorer_sid',
  })
);

// Mount API routes
app.use('/api', router);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Entity Explorer API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      api: '/api',
      health: '/api/health',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   Entity Explorer Backend                            ║
║                                                       ║
║   Server running on port ${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   Frontend URL: ${corsOptions.origin}        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  // Warn if using default session secret
  if (sessionSecret === 'entity-explorer-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default session secret. Set SESSION_SECRET environment variable in production!');
  }

  // Warn if OpenAI API key is not set
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set. AI features will be disabled.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
