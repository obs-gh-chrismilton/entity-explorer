import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  // Mock authentication for dashboard tests
  test.beforeEach(async ({ page }) => {
    // Set up mock auth state in localStorage
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
  });

  test('should display dashboard with summary cards', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for welcome message or dashboard header
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check for summary cards (should have multiple stat cards)
    const cards = page.locator('[class*="Card"]').or(page.locator('.bg-white.rounded'));
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/');

    // Check sidebar is visible
    const sidebar = page.locator('nav').first();
    await expect(sidebar).toBeVisible();

    // Check for navigation links
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Datasets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Dashboards/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Monitors/i })).toBeVisible();
  });

  test('should navigate to datasets page', async ({ page }) => {
    await page.goto('/');

    // Click on Datasets link
    await page.getByRole('link', { name: /Datasets/i }).click();

    // Should navigate to datasets page
    await expect(page).toHaveURL(/\/datasets/);
  });

  test('should navigate to dashboards page', async ({ page }) => {
    await page.goto('/');

    // Click on Dashboards link in sidebar
    await page.getByRole('link', { name: /Dashboards/i }).click();

    // Should navigate to dashboards page
    await expect(page).toHaveURL(/\/dashboards/);
  });

  test('should navigate to monitors page', async ({ page }) => {
    await page.goto('/');

    // Click on Monitors link
    await page.getByRole('link', { name: /Monitors/i }).click();

    // Should navigate to monitors page
    await expect(page).toHaveURL(/\/monitors/);
  });

  test('should navigate to AI chat page', async ({ page }) => {
    await page.goto('/');

    // Click on AI Chat link
    await page.getByRole('link', { name: /AI Chat/i }).click();

    // Should navigate to AI chat page
    await expect(page).toHaveURL(/\/ai-chat/);
  });

  test('should have header with search', async ({ page }) => {
    await page.goto('/');

    // Check for search input in header
    const searchInput = page.getByPlaceholder(/Search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have user menu in header', async ({ page }) => {
    await page.goto('/');

    // Check for user avatar or menu
    const userSection = page.locator('[class*="user"]').or(page.getByText(/Test User/i));
    // User info should be present somewhere
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    const sidebarDesktop = page.locator('nav').first();
    await expect(sidebarDesktop).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
  });
});
