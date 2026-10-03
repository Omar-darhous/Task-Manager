import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, cleanupUserData } from './helpers';

test.describe('11. Error Handling, Session Invalidation, and Security E2E', () => {
  let user: ReturnType<typeof generateTestUser>;
  let token: string;

  test.beforeEach(async ({ page }) => {
    user = generateTestUser();
    token = await registerUser(page, user);
  });

  test.afterEach(async ({ request }) => {
    if (token) {
      await cleanupUserData(request, token);
    }
  });

  test('Section 25: XSS protection - HTML/script tags in task title are escaped and rendered as text', async ({ page }) => {
    let alertFired = false;
    page.on('dialog', () => {
      alertFired = true;
    });

    const xssPayload = '<script>alert("xss")</script><img src="x" onerror="alert(1)" />';

    const input = page.locator('input.task-input-pro');
    await input.fill(xssPayload);
    await page.locator('button.task-form-submit').click();

    // Verify task row is rendered
    const taskRow = page.locator('.task-row').first();
    await expect(taskRow).toBeVisible();

    // Verify the raw script/img is rendered as innerText and not executed as active DOM script
    const titleEl = taskRow.locator('.task-title');
    await expect(titleEl).toHaveText(xssPayload);
    expect(alertFired).toBe(false);
  });

  test('Section 20: Session expiration / invalid JWT token evicts token and redirects to login', async ({ page }) => {
    // Corrupt the JWT token in localStorage
    await page.evaluate(() => {
      localStorage.setItem('taskflow_auth_token', 'malformed.or.expired.jwt.token');
    });

    // Reload the application
    await page.reload();

    // The frontend should catch 401 on /me or /tasks and redirect/render login
    await expect(page.locator('#auth-email')).toBeVisible({ timeout: 10000 });

    // Verify the invalid token was evicted or replaced
    const storedToken = await page.evaluate(() => localStorage.getItem('taskflow_auth_token'));
    expect(storedToken === null || storedToken === '').toBe(true);
  });

  test('Section 19: Error handling - Structured error format on 400, 401, and 404 API responses', async ({ request }) => {
    // 1. 401 Unauthorized for missing token
    const res401 = await request.get('http://localhost:5000/api/tasks');
    expect(res401.status()).toBe(401);
    const body401 = await res401.json();
    expect(body401.success).toBe(false);
    expect(body401.message).toBeDefined();

    // 2. 400 Bad Request for validation error (empty title)
    const res400 = await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: '' }
    });
    expect(res400.status()).toBe(400);
    const body400 = await res400.json();
    expect(body400.success).toBe(false);
    expect(body400.message).toBeDefined();

    // 3. 404 Not Found for non-existent endpoint
    const res404 = await request.get('http://localhost:5000/api/non-existent-endpoint-xyz', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res404.status()).toBe(404);
    const body404 = await res404.json();
    expect(body404.success).toBe(false);
  });
});
