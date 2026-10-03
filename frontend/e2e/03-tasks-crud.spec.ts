import { test, expect } from '@playwright/test'
import { generateTestUser, apiRegister, loginUser, cleanupUserData } from './helpers'

test.describe('3. Task Management & CRUD Operations E2E', () => {
  test.describe.configure({ mode: 'serial' })

  const user = generateTestUser('crud')
  let userToken = ''

  const defaultTaskTitle = `Default Task ${Date.now()}`
  const highPriorityTaskTitle = `High Priority Task ${Date.now()}`
  const customCatTaskTitle = `Work Project Task ${Date.now()}`
  const datedTaskTitle = `Scheduled Task ${Date.now()}`
  const longTaskTitle = `A very long comprehensive task title designed to validate word wrap and layout integrity without overflowing containers ${Date.now()}`

  test.beforeAll(async ({ request }) => {
    const reg = await apiRegister(request, user)
    userToken = reg.token
    expect(userToken).toBeTruthy()

    // Create Work category for the test user so it is available in dropdown
    await request.post('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { name: 'Work' },
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginUser(page, user.email, user.password)
    await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 15000 })
  })

  test('Create tasks with various attributes', async ({ page }) => {
    // 1. Create task with default values
    await page.locator('input.task-input-pro').fill(defaultTaskTitle)
    await page.locator('button.task-form-submit').click()
    await expect(page.locator(`.task-title:has-text("${defaultTaskTitle}")`)).toBeVisible({ timeout: 10000 })

    // 2. Create task with High priority
    await page.locator('input.task-input-pro').fill(highPriorityTaskTitle)
    await page.locator('select[aria-label="Select priority"]').selectOption('high')
    await page.locator('button.task-form-submit').click()
    const highTask = page.locator(`.task-row:has-text("${highPriorityTaskTitle}")`)
    await expect(highTask).toBeVisible({ timeout: 10000 })
    await expect(highTask.locator('.priority-high')).toBeVisible()

    // 3. Create task with category (Work)
    await page.locator('input.task-input-pro').fill(customCatTaskTitle)
    await page.locator('select[aria-label="Select category"]').selectOption('Work')
    await page.locator('button.task-form-submit').click()
    const catTask = page.locator(`.task-row:has-text("${customCatTaskTitle}")`)
    await expect(catTask).toBeVisible({ timeout: 10000 })
    await expect(catTask.locator('.meta-category:has-text("Work")')).toBeVisible()

    // 4. Create task with Due Date
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    await page.locator('input.task-input-pro').fill(datedTaskTitle)
    await page.locator('input[type="date"]').fill(tomorrowStr)
    await page.locator('button.task-form-submit').click()
    const datedTask = page.locator(`.task-row:has-text("${datedTaskTitle}")`)
    await expect(datedTask).toBeVisible({ timeout: 10000 })
    await expect(datedTask.locator('.meta-due')).toBeVisible()

    // 5. Create task with Long Title
    await page.locator('input.task-input-pro').fill(longTaskTitle)
    await page.locator('button.task-form-submit').click()
    await expect(page.locator(`.task-title:has-text("${longTaskTitle}")`)).toBeVisible({ timeout: 10000 })
  })

  test('Edit task title via options menu', async ({ page }) => {
    const taskCard = page.locator(`.task-row:has-text("${defaultTaskTitle}")`)
    await expect(taskCard).toBeVisible()

    // Open options menu
    await taskCard.locator('.btn-menu-trigger').click()
    await page.locator('.menu-item:has-text("Edit")').click()

    // Edit input should appear
    const editInput = page.getByLabel('Edit task title')
    await expect(editInput).toBeVisible()

    const updatedTitle = `${defaultTaskTitle} - Edited`
    await editInput.fill(updatedTitle)
    await editInput.press('Enter')

    // Verify updated title is rendered
    await expect(page.locator(`.task-title:has-text("${updatedTitle}")`)).toBeVisible({ timeout: 10000 })
  })

  test('Duplicate task', async ({ page }) => {
    const taskCard = page.locator(`.task-row:has-text("${highPriorityTaskTitle}")`)
    await expect(taskCard).toBeVisible()

    // Open options menu
    await taskCard.locator('.btn-menu-trigger').click()
    await page.locator('.menu-item:has-text("Duplicate")').click()

    // Verify duplicate toast feedback
    await expect(page.locator('.toast-card:has-text("Duplicated")')).toBeVisible({ timeout: 7000 })

    // Verify two tasks with the same title exist
    const matchingTasks = page.locator(`.task-row:has-text("${highPriorityTaskTitle}")`)
    await expect(matchingTasks).toHaveCount(2, { timeout: 10000 })
  })

  test('Complete and Reactivate task', async ({ page }) => {
    const taskCard = page.locator(`.task-row:has-text("${datedTaskTitle}")`)
    await expect(taskCard).toBeVisible()

    // Click checkbox to complete
    const checkboxBtn = taskCard.locator('.task-checkbox-btn')
    await checkboxBtn.click()

    // Verify completed class
    await expect(taskCard.locator('.task-checkbox-btn.checked')).toBeVisible({ timeout: 10000 })

    // Switch to Completed/Done tab
    await page.locator('.filter-tab:has-text("Done")').click()
    await expect(page.locator(`.task-title:has-text("${datedTaskTitle}")`)).toBeVisible({ timeout: 10000 })

    // Reactivate task by unchecking
    const completedCard = page.locator(`.task-row:has-text("${datedTaskTitle}")`)
    await completedCard.locator('.task-checkbox-btn').click()

    // Task should disappear from Done view
    await expect(page.locator(`.task-row:has-text("${datedTaskTitle}")`)).not.toBeVisible({ timeout: 10000 })

    // Switch back to Active tab and verify it's back
    await page.locator('.filter-tab:has-text("Active")').click()
    await expect(page.locator(`.task-title:has-text("${datedTaskTitle}")`)).toBeVisible({ timeout: 10000 })

    // Return to All tab
    await page.locator('.filter-tab:has-text("All")').click()
  })

  test('Delete task', async ({ page }) => {
    const taskCard = page.locator(`.task-row:has-text("${customCatTaskTitle}")`)
    await expect(taskCard).toBeVisible()

    // Open options menu and click delete
    await taskCard.locator('.btn-menu-trigger').click()
    await page.locator('.menu-item:has-text("Delete")').click()

    // Verify task disappears from UI
    await expect(page.locator(`.task-title:has-text("${customCatTaskTitle}")`)).not.toBeVisible({ timeout: 10000 })

    // Verify toast notification appears
    await expect(page.locator('.toast-card')).toBeVisible()
  })

  test.afterAll(async ({ request }) => {
    if (userToken) await cleanupUserData(request, userToken)
  })
})
