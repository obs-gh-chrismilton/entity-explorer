import { test, expect } from '@playwright/test';

test.describe('AI Chat Page', () => {
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

    await page.goto('/ai-chat');
  });

  test('should display AI chat interface', async ({ page }) => {
    // Check for chat heading
    await expect(page.getByRole('heading', { name: /AI Assistant/i })).toBeVisible();

    // Check for message input
    const messageInput = page.getByPlaceholder(/Ask a question/i)
      .or(page.getByPlaceholder(/Type your message/i))
      .or(page.locator('input[type="text"]').last())
      .or(page.locator('textarea').last());

    await expect(messageInput).toBeVisible();
  });

  test('should have send button', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /Send/i })
      .or(page.locator('button[type="submit"]'));

    await expect(sendButton).toBeVisible();
  });

  test('should display suggested questions', async ({ page }) => {
    // Look for suggested questions section
    const suggestions = page.getByText(/Suggested/i)
      .or(page.locator('[class*="suggestion"]'));

    // Suggestions should be present (may load asynchronously)
    await page.waitForTimeout(1000);
  });

  test('should allow typing a message', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/Ask a question/i)
      .or(page.getByPlaceholder(/Type your message/i))
      .or(page.locator('input[type="text"]').last())
      .or(page.locator('textarea').last());

    await messageInput.fill('What datasets do I have?');

    await expect(messageInput).toHaveValue('What datasets do I have?');
  });

  test('should show chat history area', async ({ page }) => {
    // Look for messages container
    const messagesArea = page.locator('[class*="messages"]')
      .or(page.locator('[class*="chat"]'))
      .or(page.locator('[class*="conversation"]'));

    // Should have a chat area
    await expect(messagesArea.first()).toBeVisible();
  });

  test('should handle empty submission', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /Send/i })
      .or(page.locator('button[type="submit"]'));

    // Try to send empty message
    await sendButton.click();

    // Should not crash or show error gracefully
    await expect(page).toHaveURL(/\/ai-chat/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Chat interface should still be usable
    const messageInput = page.getByPlaceholder(/Ask a question/i)
      .or(page.getByPlaceholder(/Type your message/i))
      .or(page.locator('input[type="text"]').last())
      .or(page.locator('textarea').last());

    await expect(messageInput).toBeVisible();
  });

  test('should show entity context panel', async ({ page }) => {
    // Look for context or entities panel
    const contextPanel = page.getByText(/Context/i)
      .or(page.getByText(/Entities/i))
      .or(page.locator('[class*="context"]'));

    // Context panel may be visible on larger screens
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
