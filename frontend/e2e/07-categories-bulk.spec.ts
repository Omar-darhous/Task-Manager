import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, cleanupUserData } from './helpers';

test.describe('7. Category Management and Bulk Operations E2E', () => {
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

  test('Section 13: Category Management - Create, Rename, Delete with Task Reassignment, and General immutability', async ({ page }) => {
    // 1. Create a custom category via sidebar
    await page.locator('button.btn-add-category').click();
    const catInput = page.locator('input.sidebar-add-cat-input');
    await expect(catInput).toBeVisible();
    await catInput.fill('FeatureLaunch');
    await page.locator('form.sidebar-add-cat-inline button[aria-label="Add category"]').click();

    // Verify appears in sidebar
    const customCatNav = page.locator('.app-sidebar .category-item:has-text("FeatureLaunch")');
    await expect(customCatNav).toBeVisible();

    // Verify General category cannot be deleted (no delete button for General)
    const generalDeleteBtn = page.locator('.app-sidebar li.category-nav-wrapper:has-text("General") button.btn-cat-delete');
    await expect(generalDeleteBtn).toHaveCount(0);

    // 2. Create a task assigned to FeatureLaunch
    await page.locator('input.task-input-pro').fill('Launch Documentation Task');
    await page.locator('select[aria-label="Select category"]').selectOption('FeatureLaunch');
    await page.locator('button.task-form-submit').click();
    await expect(page.locator('.task-row:has-text("Launch Documentation Task")')).toBeVisible();

    // Verify category count in sidebar updates to 1
    await expect(page.locator('.app-sidebar .category-nav-wrapper:has-text("FeatureLaunch") .category-count-badge')).toHaveText('1');

    // Filter by selecting the category in sidebar
    await customCatNav.click();
    await expect(page.locator('.workspace-header .greeting-title')).toHaveText('FeatureLaunch');
    await expect(page.locator('.task-row:has-text("Launch Documentation Task")')).toBeVisible();

    // Return to all tasks
    await page.locator('.app-sidebar .nav-item:has-text("Tasks")').click();

    // 3. Rename custom category via Sidebar inline edit
    const catRow = page.locator('.app-sidebar .category-nav-wrapper:has-text("FeatureLaunch")');
    await catRow.hover();
    await page.locator('button[aria-label="Rename FeatureLaunch"]').click({ force: true });
    const renameInput = page.locator('.app-sidebar input.sidebar-add-cat-input');
    await renameInput.fill('ReleaseV1');
    await page.locator('button[aria-label="Save rename"]').click();

    // Verify sidebar updates to ReleaseV1
    await expect(page.locator('.app-sidebar .category-item:has-text("ReleaseV1")')).toBeVisible();

    // Verify existing task using category reflects new category name
    await expect(page.locator('.task-row:has-text("Launch Documentation Task") .meta-category')).toHaveText('ReleaseV1');

    // 4. Test duplicate category name behavior
    await page.locator('button.btn-add-category').click();
    await catInput.fill('ReleaseV1');
    await page.locator('form.sidebar-add-cat-inline button[aria-label="Add category"]').click();
    // Toast error or warning should appear
    await expect(page.locator('.toast-card')).toContainText('Failed to create category');

    // 5. Delete category: verify associated tasks move to General
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    const releaseRow = page.locator('.app-sidebar .category-nav-wrapper:has-text("ReleaseV1")');
    await releaseRow.hover();
    await page.locator('button[aria-label="Delete ReleaseV1"]').click({ force: true });

    // Verify ReleaseV1 removed from sidebar
    await expect(page.locator('.app-sidebar .category-item:has-text("ReleaseV1")')).toHaveCount(0);

    // Verify task still exists and its category is now General
    const preservedTask = page.locator('.task-row:has-text("Launch Documentation Task")');
    await expect(preservedTask).toBeVisible();
    await expect(preservedTask.locator('.meta-category')).toHaveText('General');
  });

  test('Section 14: Bulk Operations - Multi-select, Select All Visible, Complete, Activate, Delete with Undo', async ({ page }) => {
    // Create 4 distinct tasks
    const taskTitles = [
      'Bulk Task 1 - Alpha',
      'Bulk Task 2 - Beta',
      'Bulk Task 3 - Gamma',
      'Bulk Task 4 - Delta',
    ];

    for (const title of taskTitles) {
      await page.locator('input.task-input-pro').fill(title);
      await page.locator('button.task-form-submit').click();
      await expect(page.locator(`.task-row:has-text("${title}")`)).toBeVisible();
    }

    // 1. Multi-select individual tasks via task checkboxes
    const selectBox1 = page.locator('.task-row:has-text("Bulk Task 1 - Alpha") input[type="checkbox"].task-select-checkbox');
    const selectBox2 = page.locator('.task-row:has-text("Bulk Task 2 - Beta") input[type="checkbox"].task-select-checkbox');
    await selectBox1.check();
    await selectBox2.check();

    // Verify Bulk Actions toolbar appears with count = 2
    const bulkToolbar = page.locator('.bulk-actions-toolbar');
    await expect(bulkToolbar).toBeVisible();
    await expect(bulkToolbar.locator('.bulk-badge')).toHaveText('2');

    // Deselect all using Clear / Deselect button
    await bulkToolbar.locator('button[aria-label="Clear task selection"]').click();
    await expect(bulkToolbar).toHaveCount(0);
    expect(await selectBox1.isChecked()).toBe(false);

    // 2. Select All Visible tasks
    const selectAllCheckbox = page.locator('input[aria-label="Select all visible tasks"]');
    await selectAllCheckbox.check();
    await expect(bulkToolbar).toBeVisible();
    await expect(bulkToolbar.locator('.bulk-badge')).toHaveText('4');

    // 3. Bulk Complete
    await bulkToolbar.locator('button[aria-label="Mark selected tasks as completed"]').click();
    // After bulk complete, tasks should have completed styling
    for (const title of taskTitles) {
      await expect(page.locator(`.task-row:has-text("${title}")`)).toHaveClass(/completed/);
    }

    // 4. Bulk Activate (mark them active again)
    await selectAllCheckbox.check();
    await expect(bulkToolbar.locator('.bulk-badge')).toHaveText('4');
    await bulkToolbar.locator('button[aria-label="Mark selected tasks as active"]').click();
    for (const title of taskTitles) {
      await expect(page.locator(`.task-row:has-text("${title}")`)).not.toHaveClass(/completed/);
    }

    // 5. Bulk Delete with Confirmation & Undo
    // Select first 2 tasks
    await selectBox1.check();
    await selectBox2.check();
    await expect(bulkToolbar.locator('.bulk-badge')).toHaveText('2');

    // Click delete -> shows confirmation
    await bulkToolbar.locator('button[aria-label="Delete selected tasks"]').click();
    const confirmDeleteBtn = bulkToolbar.locator('button.bulk-btn-delete:has-text("Confirm")');
    await expect(confirmDeleteBtn).toBeVisible();
    await confirmDeleteBtn.click();

    // Verify the 2 deleted tasks disappear, while 3 & 4 remain
    await expect(page.locator('.task-row:has-text("Bulk Task 1 - Alpha")')).toHaveCount(0);
    await expect(page.locator('.task-row:has-text("Bulk Task 2 - Beta")')).toHaveCount(0);
    await expect(page.locator('.task-row:has-text("Bulk Task 3 - Gamma")')).toBeVisible();
    await expect(page.locator('.task-row:has-text("Bulk Task 4 - Delta")')).toBeVisible();

    // Verify Toast Undo button restores the deleted tasks
    const undoBtn = page.locator('.toast-card button.toast-action-btn:has-text("Undo")');
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();

    // Verify restored
    await expect(page.locator('.task-row:has-text("Bulk Task 1 - Alpha")')).toBeVisible();
    await expect(page.locator('.task-row:has-text("Bulk Task 2 - Beta")')).toBeVisible();
  });
});
