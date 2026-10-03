import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, cleanupUserData } from './helpers';

test.describe('UI Fix — Category Dropdown, Branding Dot, & TopBar Title Verification', () => {
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

  test('Verify TopBar Title is "All Tasks" and subtitle is not present', async ({ page }) => {
    // 1. TopBar title verification
    const topBarTitle = page.locator('header.app-topbar .topbar-title');
    await expect(topBarTitle).toBeVisible();
    await expect(topBarTitle).toHaveText('All Tasks');

    // 2. TopBar subtitle verification (must NOT show "All your tasks")
    const topBarSubtitle = page.locator('header.app-topbar .topbar-subtitle');
    await expect(topBarSubtitle).toHaveCount(0);

    // 3. Sidebar Tasks navigation remains "Tasks"
    const navTasksItem = page.locator('.app-sidebar .nav-item:has-text("Tasks")');
    await expect(navTasksItem).toBeVisible();
  });

  test('Verify TaskFlow decorative dot is removed from sidebar branding', async ({ page }) => {
    const brandDot = page.locator('.app-sidebar .sidebar-brand .brand-dot');
    await expect(brandDot).toHaveCount(0);

    const brandLogo = page.locator('.app-sidebar .sidebar-brand .brand-logo');
    await expect(brandLogo).toHaveCount(0);

    const brandTitle = page.locator('.app-sidebar .sidebar-brand .brand-title');
    await expect(brandTitle).toHaveText('TaskFlow');

    const brandSubtitle = page.locator('.app-sidebar .sidebar-brand .brand-subtitle');
    await expect(brandSubtitle).toHaveText('Plan. Focus. Finish.');
  });

  test('12-step category dropdown verification', async ({ page }) => {
    const categorySelect = page.locator('select[aria-label="Select category"]');
    await expect(categorySelect).toBeVisible();

    // 1-5. Verify General, Personal, Work, Study, Finance appear in Add Task dropdown
    const options = await categorySelect.locator('option').allInnerTexts();
    expect(options).toContain('General');
    expect(options).toContain('Personal');
    expect(options).toContain('Work');
    expect(options).toContain('Study');
    expect(options).toContain('Finance');

    // 6. Create a new custom category
    await page.locator('button.btn-add-category').click();
    const catInput = page.locator('input.sidebar-add-cat-input');
    await expect(catInput).toBeVisible();
    await catInput.fill('DesignOps');
    await page.locator('form.sidebar-add-cat-inline button[aria-label="Add category"]').click();

    // 7. Confirm it immediately appears in Add Task dropdown without page refresh
    await expect(categorySelect.locator('option[value="DesignOps"]')).toHaveCount(1);

    // 8. Select the custom category
    await categorySelect.selectOption('DesignOps');

    // 9. Create a task
    await page.locator('input.task-input-pro').fill('Setup UI Design System');
    await page.locator('button.task-form-submit').click();

    // 10. Confirm the task displays the selected category
    const createdTask = page.locator('.task-row:has-text("Setup UI Design System")');
    await expect(createdTask).toBeVisible();
    await expect(createdTask.locator('.meta-category')).toHaveText('DesignOps');

    // 11. Rename a category and verify the dropdown updates
    const catRow = page.locator('.app-sidebar .category-nav-wrapper:has-text("DesignOps")');
    await catRow.hover();
    await page.locator('button[aria-label="Rename DesignOps"]').click({ force: true });
    const renameInput = page.locator('.app-sidebar input.sidebar-add-cat-input');
    await renameInput.fill('DesignSystem');
    await page.locator('button[aria-label="Save rename"]').click();

    // Verify dropdown reflects new name
    await expect(categorySelect.locator('option[value="DesignSystem"]')).toHaveCount(1);
    await expect(categorySelect.locator('option[value="DesignOps"]')).toHaveCount(0);

    // 12. Delete custom category and verify it disappears
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    const renamedCatRow = page.locator('.app-sidebar .category-nav-wrapper:has-text("DesignSystem")');
    await renamedCatRow.hover();
    await page.locator('button[aria-label="Delete DesignSystem"]').click({ force: true });

    // Verify it disappears from dropdown
    await expect(categorySelect.locator('option[value="DesignSystem"]')).toHaveCount(0);
    // General still remains
    await expect(categorySelect.locator('option[value="General"]')).toHaveCount(1);
  });
});
