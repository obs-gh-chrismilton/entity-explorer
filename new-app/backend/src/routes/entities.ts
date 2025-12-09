// Entity routes for datasets, dashboards, monitors, and worksheets

import { Router, Request, Response } from 'express';
import { ObserveClient } from '../services/observe-client';
import { requireAuth } from '../middleware/auth';
import { cache } from '../services/cache';
import {
  ObsDataset,
  ObsDashboard,
  ObsMonitor,
  ObsWorksheet,
  ObsMetric,
  EnvironmentSummary,
} from '../types';

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

// GET /api/entities/summary - Get environment summary stats
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'summary');

    // Check cache
    let summary = cache.get<EnvironmentSummary>(cacheKey);

    if (!summary) {
      // Fetch all entities
      const [datasets, dashboards, monitors, worksheets, metrics] = await Promise.all([
        client.getAllDatasets(),
        client.getAllDashboards(),
        client.getAllMonitors(),
        client.getAllWorksheets(),
        client.getAllMetrics(),
      ]);

      // Get recently updated entities
      const allEntities = [
        ...datasets.map(d => ({ ...d, type: 'dataset' })),
        ...dashboards.map(d => ({ ...d, type: 'dashboard' })),
        ...monitors.map(m => ({ ...m, type: 'monitor' })),
        ...worksheets.map(w => ({ ...w, type: 'worksheet' })),
      ].filter(e => e.updatedDate);

      const recentlyUpdated = allEntities
        .sort((a, b) => new Date(b.updatedDate!).getTime() - new Date(a.updatedDate!).getTime())
        .slice(0, 10)
        .map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          updatedDate: e.updatedDate!,
        }));

      summary = {
        totalDatasets: datasets.length,
        totalDashboards: dashboards.length,
        totalMonitors: monitors.length,
        totalWorksheets: worksheets.length,
        totalMetrics: metrics.length,
        recentlyUpdated,
      };

      // Cache for 5 minutes
      cache.set(cacheKey, summary, 5 * 60 * 1000);
    }

    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/datasets - Get all datasets
router.get('/datasets', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'datasets');

    // Check cache
    let datasets = cache.get<ObsDataset[]>(cacheKey);

    if (!datasets) {
      datasets = await client.getAllDatasets();
      cache.set(cacheKey, datasets);
    }

    res.json(datasets);
  } catch (error: any) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/datasets/:id - Get dataset details
router.get('/datasets/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'datasets');

    let datasets = cache.get<ObsDataset[]>(cacheKey);

    if (!datasets) {
      datasets = await client.getAllDatasets();
      cache.set(cacheKey, datasets);
    }

    const dataset = datasets.find(d => d.id === req.params.id);

    if (!dataset) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Dataset not found',
      });
      return;
    }

    res.json(dataset);
  } catch (error: any) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/dashboards - Get all dashboards
router.get('/dashboards', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'dashboards');

    let dashboards = cache.get<ObsDashboard[]>(cacheKey);

    if (!dashboards) {
      dashboards = await client.getAllDashboards();
      cache.set(cacheKey, dashboards);
    }

    res.json(dashboards);
  } catch (error: any) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/dashboards/:id - Get dashboard details
router.get('/dashboards/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'dashboards');

    let dashboards = cache.get<ObsDashboard[]>(cacheKey);

    if (!dashboards) {
      dashboards = await client.getAllDashboards();
      cache.set(cacheKey, dashboards);
    }

    const dashboard = dashboards.find(d => d.id === req.params.id);

    if (!dashboard) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Dashboard not found',
      });
      return;
    }

    res.json(dashboard);
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/monitors - Get all monitors
router.get('/monitors', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'monitors');

    let monitors = cache.get<ObsMonitor[]>(cacheKey);

    if (!monitors) {
      monitors = await client.getAllMonitors();
      cache.set(cacheKey, monitors);
    }

    res.json(monitors);
  } catch (error: any) {
    console.error('Error fetching monitors:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/monitors/:id - Get monitor details
router.get('/monitors/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'monitors');

    let monitors = cache.get<ObsMonitor[]>(cacheKey);

    if (!monitors) {
      monitors = await client.getAllMonitors();
      cache.set(cacheKey, monitors);
    }

    const monitor = monitors.find(m => m.id === req.params.id);

    if (!monitor) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Monitor not found',
      });
      return;
    }

    res.json(monitor);
  } catch (error: any) {
    console.error('Error fetching monitor:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/worksheets - Get all worksheets
router.get('/worksheets', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'worksheets');

    let worksheets = cache.get<ObsWorksheet[]>(cacheKey);

    if (!worksheets) {
      worksheets = await client.getAllWorksheets();
      cache.set(cacheKey, worksheets);
    }

    res.json(worksheets);
  } catch (error: any) {
    console.error('Error fetching worksheets:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/worksheets/:id - Get worksheet details
router.get('/worksheets/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'worksheets');

    let worksheets = cache.get<ObsWorksheet[]>(cacheKey);

    if (!worksheets) {
      worksheets = await client.getAllWorksheets();
      cache.set(cacheKey, worksheets);
    }

    const worksheet = worksheets.find(w => w.id === req.params.id);

    if (!worksheet) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Worksheet not found',
      });
      return;
    }

    res.json(worksheet);
  } catch (error: any) {
    console.error('Error fetching worksheet:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/relationships - Get all relationships
router.get('/relationships', async (req: Request, res: Response): Promise<void> => {
  try {
    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';
    const cacheKey = getCacheKey(userId, 'relationships');

    let relationships = cache.get<any[]>(cacheKey);

    if (!relationships) {
      relationships = await client.getRelationships();
      cache.set(cacheKey, relationships);
    }

    res.json(relationships);
  } catch (error: any) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/entities/search - Search OPAL code
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "q" is required',
      });
      return;
    }

    const client = getObserveClient(req);
    const userId = req.session.user?.id || 'unknown';

    // Get all entities from cache or fetch
    const datasetsKey = getCacheKey(userId, 'datasets');
    const monitorsKey = getCacheKey(userId, 'monitors');
    const worksheetsKey = getCacheKey(userId, 'worksheets');

    let datasets = cache.get<ObsDataset[]>(datasetsKey);
    let monitors = cache.get<ObsMonitor[]>(monitorsKey);
    let worksheets = cache.get<ObsWorksheet[]>(worksheetsKey);

    if (!datasets || !monitors || !worksheets) {
      [datasets, monitors, worksheets] = await Promise.all([
        datasets || client.getAllDatasets(),
        monitors || client.getAllMonitors(),
        worksheets || client.getAllWorksheets(),
      ]);

      if (!cache.has(datasetsKey)) cache.set(datasetsKey, datasets);
      if (!cache.has(monitorsKey)) cache.set(monitorsKey, monitors);
      if (!cache.has(worksheetsKey)) cache.set(worksheetsKey, worksheets);
    }

    const query = q.toLowerCase();
    const results: any[] = [];

    // Search in datasets
    datasets.forEach(dataset => {
      let relevance = 0;
      const matches: string[] = [];

      if (dataset.name.toLowerCase().includes(query)) {
        relevance += 10;
        matches.push('name');
      }
      if (dataset.description?.toLowerCase().includes(query)) {
        relevance += 5;
        matches.push('description');
      }
      if (dataset.stages) {
        dataset.stages.forEach((stage, index) => {
          if (stage.pipeline.toLowerCase().includes(query)) {
            relevance += 3;
            matches.push(`stage ${index} pipeline`);
          }
        });
      }

      if (relevance > 0) {
        results.push({
          id: dataset.id,
          type: 'dataset',
          name: dataset.name,
          description: dataset.description,
          relevance,
          matches,
        });
      }
    });

    // Search in monitors
    monitors.forEach(monitor => {
      let relevance = 0;
      const matches: string[] = [];

      if (monitor.name.toLowerCase().includes(query)) {
        relevance += 10;
        matches.push('name');
      }
      if (monitor.description?.toLowerCase().includes(query)) {
        relevance += 5;
        matches.push('description');
      }
      if (monitor.stage?.pipeline.toLowerCase().includes(query)) {
        relevance += 3;
        matches.push('pipeline');
      }

      if (relevance > 0) {
        results.push({
          id: monitor.id,
          type: 'monitor',
          name: monitor.name,
          description: monitor.description,
          relevance,
          matches,
        });
      }
    });

    // Search in worksheets
    worksheets.forEach(worksheet => {
      let relevance = 0;
      const matches: string[] = [];

      if (worksheet.name.toLowerCase().includes(query)) {
        relevance += 10;
        matches.push('name');
      }
      if (worksheet.description?.toLowerCase().includes(query)) {
        relevance += 5;
        matches.push('description');
      }
      if (worksheet.stages) {
        worksheet.stages.forEach((stage, index) => {
          if (stage.pipeline.toLowerCase().includes(query)) {
            relevance += 3;
            matches.push(`stage ${index} pipeline`);
          }
        });
      }

      if (relevance > 0) {
        results.push({
          id: worksheet.id,
          type: 'worksheet',
          name: worksheet.name,
          description: worksheet.description,
          relevance,
          matches,
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    res.json({
      query: q,
      count: results.length,
      results: results.slice(0, 50), // Limit to top 50 results
    });
  } catch (error: any) {
    console.error('Error searching entities:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
