import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, cleanupUserData } from './helpers';

test.describe('9. Theme and Responsive Layout E2E', () => {
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

  test('Section 16: Theme toggle between dark and light, with reload persistence', async ({ page }) => {
    // Check initial theme (default is dark or light depending on system, but data-theme is set)
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(['dark', 'light']).toContain(initialTheme);

    // Toggle theme
    const themeBtn = page.locator('button.topbar-action-btn[aria-label*="Switch to"]');
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();

    // Verify theme changed
    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const expectedToggled = initialTheme === 'dark' ? 'light' : 'dark';
    expect(toggledTheme).toBe(expectedToggled);

    // Reload page and verify theme persisted in localStorage
    await page.reload();
    const persistedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(persistedTheme).toBe(expectedToggled);
  });

  test('Section 17: Sidebar collapse and expand control retention (Regression Test)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    const sidebar = page.locator('.app-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).not.toHaveClass(/collapsed/);

    // Locate collapse button
    const collapseToggle = page.locator('button.btn-collapse-toggle');
    await expect(collapseToggle).toBeVisible();
    await expect(collapseToggle).toHaveAttribute('aria-label', 'Collapse sidebar');

    // Click collapse
    await collapseToggle.click();

    // Verify sidebar is now collapsed
    await expect(sidebar).toHaveClass(/collapsed/);

    // CRITICAL REGRESSION VERIFICATION: Collapse/expand toggle MUST remain visible and accessible
    await expect(collapseToggle).toBeVisible();
    await expect(collapseToggle).toHaveAttribute('aria-label', 'Expand sidebar');

    // Click expand
    await collapseToggle.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect(collapseToggle).toHaveAttribute('aria-label', 'Collapse sidebar');
  });

  const viewports = [
    { name: 'Mobile 390x844', width: 390, height: 844, isMobile: true },
    { name: 'Mobile 430x932', width: 430, height: 932, isMobile: true },
    { name: 'Tablet Portrait 768x1024', width: 768, height: 1024, isMobile: false },
    { name: 'Tablet Landscape 1024x768', width: 1024, height: 768, isMobile: false },
    { name: 'Laptop 1280x800', width: 1280, height: 800, isMobile: false },
    { name: 'Desktop 1440x900', width: 1440, height: 900, isMobile: false },
    { name: 'Full HD 1920x1080', width: 1920, height: 1080, isMobile: false },
  ];

  for (const vp of viewports) {
    test(`Section 17: Responsive Layout at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Verify app topbar is rendered
      await expect(page.locator('.app-topbar')).toBeVisible();

      // Verify task input is rendered and usable
      const taskInput = page.locator('input.task-input-pro');
      await expect(taskInput).toBeVisible();

      if (vp.isMobile) {
        // Mobile hamburger menu should be visible
        const hamburger = page.locator('button.mobile-menu-btn');
        await expect(hamburger).toBeVisible();

        // Open mobile sidebar drawer
        await hamburger.click();
        const sidebar = page.locator('.app-sidebar');
        await expect(sidebar).toHaveClass(/mobile-open/);
        await expect(page.locator('.sidebar-backdrop')).toBeVisible();

        // Close mobile drawer via close button or backdrop
        const mobileCloseBtn = page.locator('button.btn-close-mobile');
        await mobileCloseBtn.click();
        await expect(sidebar).not.toHaveClass(/mobile-open/);
        await expect(page.locator('.sidebar-backdrop')).toHaveCount(0);
      } else {
        // Desktop sidebar should be visible
        await expect(page.locator('.app-sidebar')).toBeVisible();
      }

      // Check horizontal scrollbar is not overflowing the viewport width
      const overflowInfo = await page.evaluate(() => {
        const wide = Array.from(document.querySelectorAll('*'))
          .filter((el) => (el as HTMLElement).offsetWidth > document.documentElement.clientWidth)
          .map((el) => `${el.tagName}.${el.className} (${(el as HTMLElement).offsetWidth}px)`);
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          wide,
        };
      });
      if (overflowInfo.scrollWidth > overflowInfo.clientWidth + 2) {
        console.log(`Viewport ${vp.name} overflow:`, overflowInfo);
      }
      expect(overflowInfo.scrollWidth).toBeLessThanOrEqual(overflowInfo.clientWidth + 2); // allow sub-pixel rounding
    });
  }
});
