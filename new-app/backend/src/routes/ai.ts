// AI routes for natural language interaction

import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai-service';
import { ObserveClient } from '../services/observe-client';
import { requireAuth } from '../middleware/auth';
import { cache } from '../services/cache';
import { AIMessage, ObsDataset, ObsDashboard, ObsMonitor, ObsWorksheet, ObsMetric, ObsRelationship } from '../types';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Helper function to get Observe client from session
function getObserveClient(req: Request): ObserveClient {
  if (!req.session.observeToken || !req.session.observeUrl) {
    throw new Error('Not authenticated');
  }
  return new ObserveClient(req.session.observeUrl, req.session.observeToken);
}

// Helper function to generate cache key
function getCacheKey(userId: string, key: string): string {
  return `${userId}:${key}`;
}

// POST /api/ai/chat - Chat with AI about the data
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'messages array is required',
      });
      return;
    }

    // Validate message format
    const validMessages = messages.every(
      (msg: any) =>
        msg.role &&
        msg.content &&
        ['user', 'assistant', 'system'].includes(msg.role)
    );

    if (!validMessages) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid message format. Each message must have role and content.',
      });
      return;
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'AI service is not configured. Please set OPENAI_API_KEY environment variable.',
      });
      return;
    }

    // Get Observe client and fetch context
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';

    // Get entities from cache or fetch
    const datasetsKey = getCacheKey(userId, 'datasets');
    const dashboardsKey = getCacheKey(userId, 'dashboards');
    const monitorsKey = getCacheKey(userId, 'monitors');
    const worksheetsKey = getCacheKey(userId, 'worksheets');
    const metricsKey = getCacheKey(userId, 'metrics');
    const relationshipsKey = getCacheKey(userId, 'relationships');

    let datasets = cache.get(datasetsKey);
    let dashboards = cache.get(dashboardsKey);
    let monitors = cache.get(monitorsKey);
    let worksheets = cache.get(worksheetsKey);
    let metrics = cache.get(metricsKey);
    let relationships = cache.get(relationshipsKey);

    // Fetch missing data
    const fetchPromises: Promise<any>[] = [];

    if (!datasets) {
      fetchPromises.push(
        client.getAllDatasets().then(data => {
          datasets = data;
          cache.set(datasetsKey, data);
        })
      );
    }
    if (!dashboards) {
      fetchPromises.push(
        client.getAllDashboards().then(data => {
          dashboards = data;
          cache.set(dashboardsKey, data);
        })
      );
    }
    if (!monitors) {
      fetchPromises.push(
        client.getAllMonitors().then(data => {
          monitors = data;
          cache.set(monitorsKey, data);
        })
      );
    }
    if (!worksheets) {
      fetchPromises.push(
        client.getAllWorksheets().then(data => {
          worksheets = data;
          cache.set(worksheetsKey, data);
        })
      );
    }
    if (!metrics) {
      fetchPromises.push(
        client.getAllMetrics().then(data => {
          metrics = data;
          cache.set(metricsKey, data);
        })
      );
    }
    if (!relationships) {
      fetchPromises.push(
        client.getRelationships().then(data => {
          relationships = data;
          cache.set(relationshipsKey, data);
        })
      );
    }

    await Promise.all(fetchPromises);

    // Initialize AI service and get response
    const aiService = new AIService(openaiApiKey);
    const response = await aiService.chat(messages as AIMessage[], {
      datasets: datasets as ObsDataset[] | undefined,
      dashboards: dashboards as ObsDashboard[] | undefined,
      monitors: monitors as ObsMonitor[] | undefined,
      worksheets: worksheets as ObsWorksheet[] | undefined,
      metrics: metrics as ObsMetric[] | undefined,
      relationships: relationships as ObsRelationship[] | undefined,
    });

    res.json(response);
  } catch (error: any) {
    console.error('AI chat error:', error);

    if (error.message.includes('AI service failed')) {
      res.status(503).json({
        error: 'AI Service Error',
        message: 'Failed to communicate with AI service. Please try again.',
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
});

// GET /api/ai/suggestions - Get suggested questions
router.get('/suggestions', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Return default suggestions without AI
      res.json({
        suggestions: [
          'What datasets are available in my environment?',
          'Show me all dashboards',
          'What monitors are configured?',
          'Help me understand the data lineage',
          'What was recently updated?',
        ],
      });
      return;
    }

    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'ai_suggestions');

    // Check cache (cache for 30 minutes)
    let suggestions = cache.get<string[]>(cacheKey);

    if (!suggestions) {
      // Get context data
      const datasetsKey = getCacheKey(userId, 'datasets');
      const dashboardsKey = getCacheKey(userId, 'dashboards');
      const monitorsKey = getCacheKey(userId, 'monitors');
      const worksheetsKey = getCacheKey(userId, 'worksheets');

      let datasets = cache.get(datasetsKey);
      let dashboards = cache.get(dashboardsKey);
      let monitors = cache.get(monitorsKey);
      let worksheets = cache.get(worksheetsKey);

      // Fetch missing data
      if (!datasets || !dashboards || !monitors || !worksheets) {
        [datasets, dashboards, monitors, worksheets] = await Promise.all([
          datasets || client.getAllDatasets(),
          dashboards || client.getAllDashboards(),
          monitors || client.getAllMonitors(),
          worksheets || client.getAllWorksheets(),
        ]);

        if (!cache.has(datasetsKey)) cache.set(datasetsKey, datasets);
        if (!cache.has(dashboardsKey)) cache.set(dashboardsKey, dashboards);
        if (!cache.has(monitorsKey)) cache.set(monitorsKey, monitors);
        if (!cache.has(worksheetsKey)) cache.set(worksheetsKey, worksheets);
      }

      // Generate suggestions
      const aiService = new AIService(openaiApiKey);
      suggestions = await aiService.generateSuggestions({
        datasets: datasets as ObsDataset[] | undefined,
        dashboards: dashboards as ObsDashboard[] | undefined,
        monitors: monitors as ObsMonitor[] | undefined,
        worksheets: worksheets as ObsWorksheet[] | undefined,
      });

      // Cache for 30 minutes
      cache.set(cacheKey, suggestions, 30 * 60 * 1000);
    }

    res.json({ suggestions });
  } catch (error: any) {
    console.error('Error generating suggestions:', error);

    // Fallback to default suggestions on error
    res.json({
      suggestions: [
        'What datasets are available in my environment?',
        'Show me all dashboards',
        'What monitors are configured?',
        'Help me understand the data lineage',
        'What was recently updated?',
      ],
    });
  }
});

export default router;
