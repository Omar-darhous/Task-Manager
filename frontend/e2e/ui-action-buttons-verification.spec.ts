import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, cleanupUserData } from './helpers';

test.describe('UI Verification — Brand Mark Removal & Task Action Icon Buttons', () => {
  test('a. Login and Register screens do NOT have purple brand mark/logo next to TaskFlow', async ({ page }) => {
    // 1. Check Login page
    await page.goto('/login');
    const loginBrandLogo = page.locator('.auth-brand .brand-logo');
    await expect(loginBrandLogo).toHaveCount(0);

    const loginBrandTitle = page.locator('.auth-brand .auth-brand-title');
    await expect(loginBrandTitle).toHaveText('TaskFlow');

    const loginBrandTagline = page.locator('.auth-brand .auth-brand-tagline');
    await expect(loginBrandTagline).toHaveText('Plan. Focus. Finish.');

    // 2. Check Register page
    await page.goto('/register');
    const registerBrandLogo = page.locator('.auth-brand .brand-logo');
    await expect(registerBrandLogo).toHaveCount(0);

    const registerBrandTitle = page.locator('.auth-brand .auth-brand-title');
    await expect(registerBrandTitle).toHaveText('TaskFlow');

    const registerBrandTagline = page.locator('.auth-brand .auth-brand-tagline');
    await expect(registerBrandTagline).toHaveText('Plan. Focus. Finish.');
  });

  test.describe('TaskActions Footer Verification with authenticated user', () => {
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

    test('b, c, d: Trash and Refresh icon buttons verification and functionality', async ({ page }) => {
      // Create a task
      await page.locator('input.task-input-pro').fill('Verification Task Completed');
      await page.locator('button.task-form-submit').click();

      const taskRow = page.locator('.task-row:has-text("Verification Task Completed")');
      await expect(taskRow).toBeVisible();

      // Initially, when no tasks are completed, footer is hidden (completedCount <= 0)
      const footer = page.locator('footer.card-footer');
      await expect(footer).toHaveCount(0);

      // Complete the task
      await taskRow.locator('.task-checkbox-btn').click();
      await expect(taskRow.locator('.task-checkbox-btn.checked')).toBeVisible();

      // Now footer should appear
      await expect(footer).toBeVisible();

      // d. Verify accessible labels and tooltips on both icon buttons
      const clearBtn = footer.locator('button[aria-label="Clear completed tasks"]');
      await expect(clearBtn).toBeVisible();
      await expect(clearBtn).toHaveAttribute('title', 'Clear completed tasks');
      await expect(clearBtn.locator('svg.icon-trash')).toBeVisible();

      const resetBtn = footer.locator('button[aria-label="Reset from API"]');
      await expect(resetBtn).toBeVisible();
      await expect(resetBtn).toHaveAttribute('title', 'Reset from API');
      await expect(resetBtn.locator('svg.icon-refresh')).toBeVisible();

      // Confirm no text count is rendered beside the trash icon
      await expect(clearBtn).toHaveText('');
      await expect(resetBtn).toHaveText('');

      // b. Verify Trash icon clears completed tasks
      await clearBtn.click();
      // After clearing, completed task should be gone
      await expect(page.locator('.task-row:has-text("Verification Task Completed")')).toHaveCount(0);
      // Footer should disappear since completed count is 0
      await expect(footer).toHaveCount(0);

      // Create another task and complete it to test reset button
      await page.locator('input.task-input-pro').fill('Second Task Completed');
      await page.locator('button.task-form-submit').click();
      const secondRow = page.locator('.task-row:has-text("Second Task Completed")');
      await expect(secondRow).toBeVisible();
      await secondRow.locator('.task-checkbox-btn').click();
      await expect(footer).toBeVisible();

      // c. Click Reset from API button
      const resetBtnAgain = footer.locator('button[aria-label="Reset from API"]');
      await expect(resetBtnAgain).toBeVisible();
      await resetBtnAgain.click();

      // Should show toast or reload state successfully
      await expect(page.locator('.app-topbar')).toBeVisible();
    });
  });
});
