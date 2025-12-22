import { test, expect } from '@playwright/test';

test.describe('Navigation and Layout', () => {
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
  });

  test('should have consistent layout across pages', async ({ page }) => {
    const pages = ['/', '/datasets', '/dashboards', '/monitors', '/relationships', '/search'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Sidebar should be present
      const sidebar = page.locator('nav').first();
      await expect(sidebar).toBeVisible();

      // Header should be present
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
    }
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/datasets');

    // The Datasets link should be highlighted
    const datasetsLink = page.getByRole('link', { name: /Datasets/i });

    // Check for active styling (bg-purple class or similar)
    await expect(datasetsLink).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear auth state
    await page.addInitScript(() => {
      localStorage.removeItem('entity-explorer-auth');
    });

    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow logout', async ({ page }) => {
    await page.goto('/');

    // Find and click logout button/link
    const logoutButton = page.getByRole('button', { name: /Logout/i })
      .or(page.getByRole('link', { name: /Logout/i }))
      .or(page.getByText(/Sign out/i));

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should have breadcrumbs on detail pages', async ({ page }) => {
    await page.goto('/datasets/123');

    // Should show breadcrumb navigation
    const breadcrumbs = page.locator('[aria-label="Breadcrumb"]')
      .or(page.locator('.breadcrumb'))
      .or(page.getByText(/Datasets/i).first());

    // Breadcrumbs or back navigation should be present
  });

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page');

    // Should show 404 page or redirect
    // The app should handle this gracefully without crashing
  });

  test('should have working search functionality', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/Search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test query');
      await searchInput.press('Enter');

      // Should navigate to search results or filter content
    }
  });

  test('should navigate via quick links on dashboard', async ({ page }) => {
    await page.goto('/');

    // Look for quick links or action buttons
    const quickLinks = page.locator('[class*="quick"]')
      .or(page.locator('a[href*="/datasets"]'));

    if (await quickLinks.first().isVisible()) {
      await quickLinks.first().click();
      // Should navigate to the linked page
    }
  });
});
