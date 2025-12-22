// Main router combining all routes

import { Router } from 'express';
import authRoutes from './auth';
import entitiesRoutes from './entities';
import aiRoutes from './ai';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/entities', entitiesRoutes);
router.use('/ai', aiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Entity Explorer API',
    version: '1.0.0',
    description: 'API for exploring Observe entities and data relationships',
    endpoints: {
      auth: '/api/auth',
      entities: '/api/entities',
      ai: '/api/ai',
      health: '/api/health',
    },
  });
});

export default router;
