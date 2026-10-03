import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, cleanupUserData } from './helpers';

test.describe('6. Today View, Calendar, and Upcoming Deadlines E2E', () => {
  let user: ReturnType<typeof generateTestUser>;
  let token: string;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayYMD = `${yyyy}-${mm}-${dd}`;

  // Helper to compute date offset in ISO format
  const getOffsetDateISO = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  };

  test.beforeEach(async ({ page }) => {
    user = generateTestUser();
    token = await registerUser(page, user);
  });

  test.afterEach(async ({ request }) => {
    if (token) {
      await cleanupUserData(request, token);
    }
  });

  test('Section 10: Today View partitions overdue, today, and completed, excluding undated/tomorrow', async ({ page, request }) => {
    const pastDate = getOffsetDateISO(-2);
    const todayISO = getOffsetDateISO(0);
    const tomorrowDate = getOffsetDateISO(1);

    // Create 5 test tasks via backend API using valid title & dueDate format
    // 1. Overdue task
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Overdue Task E2E', dueDate: pastDate, priority: 'high' }
    });
    // 2. Task due today
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Due Today Task E2E', dueDate: todayISO, priority: 'medium' }
    });
    // 3. Task due tomorrow
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Due Tomorrow Task E2E', dueDate: tomorrowDate, priority: 'low' }
    });
    // 4. Undated task
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Undated Task E2E', priority: 'medium' }
    });
    // 5. Completed task due today
    const res = await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Completed Today Task E2E', dueDate: todayISO }
    });
    const json = await res.json();
    const completedTaskId = json.data._id;
    // Mark as completed
    await request.patch(`http://localhost:5000/api/tasks/${completedTaskId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { completed: true }
    });

    // Reload page to reflect seeded tasks
    await page.reload();
    await expect(page.locator('.task-row')).toHaveCount(5);

    // Navigate to Today view via sidebar
    await page.locator('.app-sidebar .nav-item:has-text("Today")').click();
    await expect(page.locator('.workspace-header .greeting-title')).toHaveText('Today');

    // Verify sections present: Overdue, Due Today, Completed
    const overdueSection = page.locator('.today-section.overdue-section');
    await expect(overdueSection).toBeVisible();
    await expect(overdueSection.locator('.task-row')).toContainText(['Overdue Task E2E']);

    const dueTodaySection = page.locator('section.today-section:has(#today-scheduled-heading)');
    await expect(dueTodaySection).toBeVisible();
    await expect(dueTodaySection.locator('.task-row')).toContainText(['Due Today Task E2E']);

    const completedSection = page.locator('.today-section.completed-section');
    await expect(completedSection).toBeVisible();
    await expect(completedSection.locator('.task-row')).toContainText(['Completed Today Task E2E']);

    // Verify undated and tomorrow tasks are NOT in Today view
    await expect(page.locator('.task-row:has-text("Due Tomorrow Task E2E")')).toHaveCount(0);
    await expect(page.locator('.task-row:has-text("Undated Task E2E")')).toHaveCount(0);

    // Create a new task directly inside Today view without picking a due date
    const input = page.locator('input.task-input-pro');
    await input.fill('Created inside Today view');
    await page.locator('button.task-form-submit').click();

    // Verify it automatically gets scheduled for Today and appears in Due Today section
    await expect(page.locator('.today-section:has(#today-scheduled-heading) .task-row:has-text("Created inside Today view")')).toBeVisible();
  });

  test('Section 11: Calendar View month navigation, date selection, and day tasks', async ({ page, request }) => {
    // Create a task due on today's date
    const todayISO = getOffsetDateISO(0);
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Calendar Target Task', dueDate: todayISO, priority: 'high' }
    });

    await page.reload();

    // Navigate to Calendar via sidebar
    await page.locator('.app-sidebar .nav-item:has-text("Calendar")').click();
    await expect(page.locator('.workspace-header .greeting-title')).toHaveText('Calendar');

    // Calendar board should be visible
    const calBoard = page.locator('.cal-view-board');
    await expect(calBoard).toBeVisible();

    const monthHeader = calBoard.locator('.cal-view-month');
    const currentMonthText = await monthHeader.innerText();

    // Navigate to next month in calendar board
    await calBoard.locator('button[aria-label="Next month"]').click();
    const nextMonthText = await monthHeader.innerText();
    expect(nextMonthText).not.toEqual(currentMonthText);

    // Navigate to previous month
    await calBoard.locator('button[aria-label="Previous month"]').click();
    await expect(monthHeader).toHaveText(currentMonthText);

    // Test Today button
    await calBoard.locator('button[aria-label="Next month"]').click();
    await calBoard.locator('button[aria-label="Go to today"]').click();
    await expect(monthHeader).toHaveText(currentMonthText);

    // Verify task indicator exists for today's cell in the grid
    const todayCell = calBoard.locator(`button.cal-view-day-cell[aria-label*="${todayYMD}"]`);
    await expect(todayCell).toBeVisible();

    // Click on today's cell
    await todayCell.click();

    // Verify the Day Tasks panel shows the scheduled task
    const dayTasks = page.locator('.cal-view-day-tasks');
    await expect(dayTasks).toContainText('Calendar Target Task');

    // Test toggling complete from within calendar view
    const taskCheckbox = dayTasks.locator('.task-row:has-text("Calendar Target Task") button.task-checkbox-btn');
    await taskCheckbox.click();
    await expect(dayTasks.locator('.task-row:has-text("Calendar Target Task")')).toHaveClass(/completed/);
  });

  test('Section 12: Upcoming Tasks widget in RightPanel', async ({ page, request }) => {
    const yesterdayISO = getOffsetDateISO(-1);
    const tomorrowISO = getOffsetDateISO(1);
    const future2ISO = getOffsetDateISO(3);

    // Create overdue, today, future, and undated tasks
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Upcoming Overdue', dueDate: yesterdayISO }
    });
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Upcoming Tomorrow', dueDate: tomorrowISO }
    });
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Upcoming Future', dueDate: future2ISO }
    });
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Upcoming Undated No Date' }
    });

    await page.reload();

    // Right panel Upcoming widget
    const upcomingWidget = page.locator('.upcoming-widget');
    await expect(upcomingWidget).toBeVisible();

    // Check overdue banner
    const overdueBanner = upcomingWidget.locator('.overdue-banner-compact');
    await expect(overdueBanner).toContainText('1 overdue task need attention');

    // Check upcoming items list: Tomorrow should appear before Future
    const items = upcomingWidget.locator('.upcoming-item .upcoming-title');
    await expect(items).toContainText(['Upcoming Tomorrow', 'Upcoming Future']);

    // Undated tasks should NOT appear in upcoming list
    await expect(upcomingWidget).not.toContainText('Upcoming Undated No Date');
  });
});
