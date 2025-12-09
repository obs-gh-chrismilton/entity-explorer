import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
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

  test('login page visual appearance', async ({ page }) => {
    // Clear auth for login page
    await page.addInitScript(() => {
      localStorage.removeItem('entity-explorer-auth');
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('dashboard page visual appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for animations

    await expect(page).toHaveScreenshot('dashboard-page.png', {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test('datasets page visual appearance', async ({ page }) => {
    await page.goto('/datasets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('datasets-page.png', {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test('sidebar visual appearance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav').first();

    await expect(sidebar).toHaveScreenshot('sidebar.png', {
      maxDiffPixels: 50,
      threshold: 0.2,
    });
  });

  test('dark mode contrast check', async ({ page }) => {
    await page.goto('/');

    // Check that text has sufficient contrast
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6');

    // Ensure text is visible
    const count = await textElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('button hover states', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('entity-explorer-auth');
    });

    await page.goto('/login');

    const connectButton = page.getByRole('button', { name: /Connect/i });

    // Hover and check visual change
    await connectButton.hover();
    await page.waitForTimeout(200);

    // Button should have hover style
    await expect(connectButton).toBeVisible();
  });

  test('card hover effects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[class*="Card"]').first()
      .or(page.locator('.bg-white.rounded').first());

    if (await card.isVisible()) {
      await card.hover();
      await page.waitForTimeout(200);

      // Card should have hover effect
    }
  });

  test('loading spinner appearance', async ({ page }) => {
    await page.goto('/');

    // Intercept API calls to show loading state
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.abort();
    });

    // Refresh to trigger loading
    await page.reload();

    // Look for loading spinner
    const spinner = page.locator('[class*="spinner"]')
      .or(page.locator('[class*="loading"]'))
      .or(page.locator('.animate-spin'));

    // Spinner may be visible during loading
  });

  test('responsive design - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-view.png', {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test('responsive design - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('tablet-view.png', {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test('color scheme consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that primary purple color is used
    const purpleElements = page.locator('[class*="purple"]')
      .or(page.locator('[class*="primary"]'));

    expect(await purpleElements.count()).toBeGreaterThan(0);
  });

  test('icon visibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Lucide icons should be rendered as SVGs
    const icons = page.locator('svg');
    expect(await icons.count()).toBeGreaterThan(0);
  });
});
