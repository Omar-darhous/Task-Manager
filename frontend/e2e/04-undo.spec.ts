import { test, expect } from '@playwright/test'
import { generateTestUser, apiRegister, loginUser, cleanupUserData } from './helpers'

test.describe('4. Delete & Undo Operations E2E', () => {
  test.describe.configure({ mode: 'serial' })

  const user = generateTestUser('undo')
  let userToken = ''

  const undoTaskTitle = `Undo Task ${Date.now()}`
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  test.beforeAll(async ({ request }) => {
    const reg = await apiRegister(request, user)
    userToken = reg.token

    // Create Work category so it is available
    await request.post('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { name: 'Work' },
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginUser(page, user.email, user.password)
    await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 15000 })
  })

  test('Delete task and restore with Undo button', async ({ page }) => {
    // 1. Create a task with specific priority, category, and due date
    await page.locator('input.task-input-pro').fill(undoTaskTitle)
    await page.locator('select[aria-label="Select priority"]').selectOption('high')
    await page.locator('select[aria-label="Select category"]').selectOption('Work')
    await page.locator('input[type="date"]').fill(tomorrowStr)
    await page.locator('button.task-form-submit').click()

    const taskRow = page.locator(`.task-row:has-text("${undoTaskTitle}")`)
    await expect(taskRow).toBeVisible({ timeout: 10000 })

    // 2. Delete the task
    await taskRow.locator('.btn-menu-trigger').click()
    await page.locator('.menu-item:has-text("Delete")').click()

    // 3. Verify task disappears
    await expect(page.locator(`.task-title:has-text("${undoTaskTitle}")`)).not.toBeVisible({ timeout: 10000 })

    // 4. Verify Toast notification with "Undo" button
    const toastCard = page.locator('.toast-card')
    await expect(toastCard).toBeVisible()
    const undoBtn = toastCard.locator('button.toast-action-btn:has-text("Undo")')
    await expect(undoBtn).toBeVisible()

    // 5. Click Undo
    await undoBtn.click()

    // 6. Verify task is restored with all metadata preserved
    const restoredRow = page.locator(`.task-row:has-text("${undoTaskTitle}")`)
    await expect(restoredRow).toBeVisible({ timeout: 10000 })
    await expect(restoredRow.locator('.priority-high')).toBeVisible()
    await expect(restoredRow.locator('.meta-category:has-text("Work")')).toBeVisible()
    await expect(restoredRow.locator('.meta-due')).toBeVisible()
  })

  test('Multiple Undo safety: clicking Undo once dismisses toast without duplicate tasks', async ({ page }) => {
    const singleTaskTitle = `Single Task ${Date.now()}`
    await page.locator('input.task-input-pro').fill(singleTaskTitle)
    await page.locator('button.task-form-submit').click()
    const taskRow = page.locator(`.task-row:has-text("${singleTaskTitle}")`)
    await expect(taskRow).toBeVisible({ timeout: 10000 })

    // Delete
    await taskRow.locator('.btn-menu-trigger').click()
    await page.locator('.menu-item:has-text("Delete")').click()
    await expect(page.locator(`.task-title:has-text("${singleTaskTitle}")`)).not.toBeVisible({ timeout: 10000 })

    // Undo
    const toast = page.locator('.toast-card')
    await expect(toast).toBeVisible()
    const undoBtn = toast.locator('button.toast-action-btn:has-text("Undo")')
    await undoBtn.click()

    // Restored exactly once
    const matchingRows = page.locator(`.task-row:has-text("${singleTaskTitle}")`)
    await expect(matchingRows).toHaveCount(1, { timeout: 10000 })
  })

  test.afterAll(async ({ request }) => {
    if (userToken) await cleanupUserData(request, userToken)
  })
})
