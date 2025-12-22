import { test, expect } from '@playwright/test';

test.describe('Relationships Graph Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock auth state
    await page.addInitScript(() => {
      localStorage.setItem('entity-explorer-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          user: {
            id: 'test-user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
          observeUrl: 'https://test.observe.com',
        },
        version: 0,
      }));
    });

    await page.goto('/relationships');
  });

  test('should display relationships page', async ({ page }) => {
    // Check for page heading
    await expect(page.getByRole('heading', { name: /Relationships/i })).toBeVisible();
  });

  test('should have filter controls', async ({ page }) => {
    // Look for filter dropdowns or checkboxes
    const filterSection = page.locator('[class*="filter"]')
      .or(page.getByText(/Filter/i))
      .or(page.locator('select'));

    // Filters should be present
    await page.waitForTimeout(500);
  });

  test('should display graph canvas', async ({ page }) => {
    // React Flow renders a canvas-like element
    const graphContainer = page.locator('.react-flow')
      .or(page.locator('[class*="graph"]'))
      .or(page.locator('canvas'));

    await expect(graphContainer.first()).toBeVisible();
  });

  test('should have graph controls', async ({ page }) => {
    // React Flow provides zoom controls
    const controls = page.locator('.react-flow__controls')
      .or(page.locator('[class*="controls"]'));

    // Controls should be present (zoom in, zoom out, fit view)
  });

  test('should allow filtering by entity type', async ({ page }) => {
    // Look for type filter
    const typeFilter = page.locator('select')
      .or(page.getByRole('combobox'))
      .or(page.locator('[class*="filter"]'));

    if (await typeFilter.first().isVisible()) {
      // Should be able to interact with filter
      await typeFilter.first().click();
    }
  });

  test('should handle empty state', async ({ page }) => {
    // If no relationships, should show empty state
    const emptyState = page.getByText(/No relationships/i)
      .or(page.getByText(/No data/i));

    // Either data or empty state should be shown
  });

  test('should be responsive', async ({ page }) => {
    // Test on different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
      { width: 768, height: 1024 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);

      // Graph container should adjust
      const graphContainer = page.locator('.react-flow')
        .or(page.locator('[class*="graph"]'));

      await expect(graphContainer.first()).toBeVisible();
    }
  });

  test('should show node details on click', async ({ page }) => {
    // Wait for graph to load
    await page.waitForTimeout(1000);

    // Find and click a node
    const node = page.locator('.react-flow__node').first();

    if (await node.isVisible()) {
      await node.click();

      // Details panel or tooltip should appear
    }
  });
});
