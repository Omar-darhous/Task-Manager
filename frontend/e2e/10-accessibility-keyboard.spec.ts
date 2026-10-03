import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, cleanupUserData } from './helpers';

test.describe('10. Accessibility and Keyboard Navigation E2E', () => {
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

  test('Section 18: Keyboard shortcuts: "/" focuses search, "Escape" clears search', async ({ page }) => {
    // Press '/' key from anywhere
    await page.keyboard.press('/');
    const searchInput = page.locator('input.search-input');
    await expect(searchInput).toBeFocused();

    // Type query
    await searchInput.fill('Important meeting');
    await expect(searchInput).toHaveValue('Important meeting');

    // Press Escape to clear
    await page.keyboard.press('Escape');
    await expect(searchInput).toHaveValue('');
  });

  test('Section 18: Task options menu opens with Enter/Space and closes with Escape', async ({ page }) => {
    // Create a task
    await page.locator('input.task-input-pro').fill('Keyboard accessible task');
    await page.locator('button.task-form-submit').click();

    const taskRow = page.locator('.task-row:has-text("Keyboard accessible task")');
    await expect(taskRow).toBeVisible();

    const menuTrigger = taskRow.locator('.btn-menu-trigger');
    await menuTrigger.focus();
    await expect(menuTrigger).toBeFocused();

    // Open menu using Enter
    await page.keyboard.press('Enter');
    const contextMenu = page.locator('.task-context-menu');
    await expect(contextMenu).toBeVisible();

    // Close menu with Escape
    await page.keyboard.press('Escape');
    await expect(contextMenu).not.toBeVisible();
  });

  test('Section 18: ARIA attributes and accessible naming audit on interactive elements', async ({ page }) => {
    // 1. Sidebar collapse toggle accessible name
    const collapseToggle = page.locator('button.btn-collapse-toggle');
    await expect(collapseToggle).toHaveAttribute('aria-label', /Collapse sidebar|Expand sidebar/);

    // 2. Search input has accessible label or placeholder
    const searchInput = page.locator('input.search-input');
    await expect(searchInput).toHaveAttribute('placeholder', 'Search tasks...');

    // 3. Theme toggle has accessible name
    const themeToggle = page.locator('button.topbar-action-btn[aria-label*="Switch to"]');
    await expect(themeToggle).toHaveAttribute('aria-label', /Switch to (light|dark) mode/);

    // 4. Form inputs have labels / aria-labels
    const taskInput = page.locator('input.task-input-pro');
    await expect(taskInput).toHaveAttribute('aria-label', 'New task title');

    const catSelect = page.locator('select[aria-label="Select category"]');
    await expect(catSelect).toBeVisible();

    const priSelect = page.locator('select[aria-label="Select priority"]');
    await expect(priSelect).toBeVisible();

    const dateInput = page.locator('input[aria-label="Due date"]');
    await expect(dateInput).toBeVisible();

    // 5. Semantic landmark regions exist
    await expect(page.locator('aside.app-sidebar')).toHaveAttribute('aria-label', 'Application navigation');
    await expect(page.locator('header.app-topbar')).toBeVisible();
    await expect(page.locator('main.app-main-content')).toBeVisible();
  });

  test('Section 18: Tab keyboard navigation focuses sequential form controls', async ({ page }) => {
    const taskInput = page.locator('input.task-input-pro');
    await expect(taskInput).toBeEnabled();
    await taskInput.click();
    await expect(taskInput).toBeFocused();

    // Tab to category select
    await page.keyboard.press('Tab');
    const catSelect = page.locator('select[aria-label="Select category"]');
    await expect(catSelect).toBeFocused();

    // Tab to priority select
    await page.keyboard.press('Tab');
    const priSelect = page.locator('select[aria-label="Select priority"]');
    await expect(priSelect).toBeFocused();

    // Tab to due date input
    await page.keyboard.press('Tab');
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeFocused();
  });
});
