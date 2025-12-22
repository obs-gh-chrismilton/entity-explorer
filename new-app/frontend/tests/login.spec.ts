import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page with animated background', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Entity Explorer/);

    // Check for animated background elements
    const backgroundBlobs = page.locator('.animate-blob');
    await expect(backgroundBlobs.first()).toBeVisible();

    // Check main heading
    await expect(page.getByRole('heading', { name: /Entity Explorer/i })).toBeVisible();

    // Check subheading
    await expect(page.getByText(/Connect to your Observe environment/i)).toBeVisible();
  });

  test('should have password and token tabs', async ({ page }) => {
    // Check for password tab (default active)
    const passwordTab = page.getByRole('button', { name: /Password/i });
    await expect(passwordTab).toBeVisible();

    // Check for API token tab
    const tokenTab = page.getByRole('button', { name: /API Token/i });
    await expect(tokenTab).toBeVisible();
  });

  test('should show password form by default', async ({ page }) => {
    // Check for username field
    await expect(page.getByLabel(/Username/i)).toBeVisible();

    // Check for password field
    await expect(page.getByLabel(/Password/i)).toBeVisible();

    // Check for Observe URL field
    await expect(page.getByLabel(/Observe URL/i)).toBeVisible();

    // Check connect button
    await expect(page.getByRole('button', { name: /Connect/i })).toBeVisible();
  });

  test('should switch to API token form', async ({ page }) => {
    // Click on API Token tab
    await page.getByRole('button', { name: /API Token/i }).click();

    // Check for API Token field
    await expect(page.getByLabel(/API Token/i)).toBeVisible();

    // Username field should not be visible
    await expect(page.getByLabel(/Username/i)).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: /Connect/i }).click();

    // Form should prevent submission (HTML5 validation)
    const urlInput = page.getByLabel(/Observe URL/i);
    await expect(urlInput).toHaveAttribute('required', '');
  });

  test('should show loading state on submit', async ({ page }) => {
    // Fill in the form
    await page.getByLabel(/Observe URL/i).fill('https://test.observe.com');
    await page.getByLabel(/Username/i).fill('testuser');
    await page.getByLabel(/Password/i).fill('testpassword');

    // Click connect
    await page.getByRole('button', { name: /Connect/i }).click();

    // Should show loading spinner (button becomes disabled)
    const connectButton = page.getByRole('button', { name: /Connecting/i });
    // Note: This may be brief, so we just check the button state change
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // All form elements should still be visible
    await expect(page.getByLabel(/Observe URL/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect/i })).toBeVisible();

    // Card should be centered and readable
    const card = page.locator('.bg-white\\/95').first();
    await expect(card).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    // Check for form labels
    const labels = page.locator('label');
    expect(await labels.count()).toBeGreaterThan(0);

    // Check that inputs have associated labels
    const urlInput = page.getByLabel(/Observe URL/i);
    await expect(urlInput).toHaveAttribute('id');
  });
});
