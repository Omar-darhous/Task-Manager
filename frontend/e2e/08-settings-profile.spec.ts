import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, cleanupUserData, loginUser, logoutUser } from './helpers';

test.describe('8. Profile and Account Settings E2E', () => {
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

  test('Section 15: Profile update and persistence across reloads', async ({ page }) => {
    // Navigate to Settings
    await page.locator('.app-sidebar button.settings-item').click();
    await expect(page.locator('.settings-header .greeting-title')).toHaveText('Account Settings');

    // Verify current profile values loaded
    const nameInput = page.locator('#settings-name');
    const emailInput = page.locator('#settings-email');
    await expect(nameInput).toHaveValue(user.name);
    await expect(emailInput).toHaveValue(user.email);

    // Update name
    const updatedName = `${user.name} Updated`;
    await nameInput.fill(updatedName);
    await page.locator('form.settings-form button[type="submit"]:has-text("Save Changes")').click();

    // Verify success feedback
    await expect(page.locator('.settings-alert.alert-success')).toContainText('Profile updated successfully');

    // Reload page and navigate back to settings
    await page.reload();
    await page.locator('.app-sidebar button.settings-item').click();
    await expect(page.locator('#settings-name')).toHaveValue(updatedName);
  });

  test('Section 15: Password update lifecycle - validation errors, successful change, and re-login', async ({ page }) => {
    // Navigate to Settings
    await page.locator('.app-sidebar button.settings-item').click();

    const currPassInput = page.locator('#settings-curr-pass');
    const newPassInput = page.locator('#settings-new-pass');
    const confPassInput = page.locator('#settings-conf-pass');
    const updatePassBtn = page.locator('button[type="submit"]:has-text("Update Password")');

    // 1. Password mismatch validation: button disabled when passwords mismatch
    await currPassInput.fill(user.password);
    await newPassInput.fill('BrandNewPassword123!');
    await confPassInput.fill('MismatchedPassword123!');
    await expect(updatePassBtn).toBeDisabled();

    // 2. Short password validation (< 8 chars)
    await newPassInput.fill('short');
    await confPassInput.fill('short');
    await expect(updatePassBtn).toBeDisabled();

    // 3. Incorrect current password rejection
    const correctNewPassword = 'BrandNewPassword123!';
    await currPassInput.fill('WrongCurrentPassword999!');
    await newPassInput.fill(correctNewPassword);
    await confPassInput.fill(correctNewPassword);
    await expect(updatePassBtn).toBeEnabled();
    await updatePassBtn.click();

    // Verify error alert
    await expect(page.locator('.settings-alert.alert-error')).toBeVisible();

    // 4. Valid password change
    await currPassInput.fill(user.password);
    await newPassInput.fill(correctNewPassword);
    await confPassInput.fill(correctNewPassword);
    await updatePassBtn.click();

    // Verify success alert
    await expect(page.locator('.settings-alert.alert-success')).toContainText('Password updated successfully');

    // 5. Verify user can log in with new password
    await logoutUser(page);

    // Log in with the new password
    await loginUser(page, user.email, correctNewPassword);
    await expect(page.locator('.app-topbar')).toBeVisible();
  });
});
