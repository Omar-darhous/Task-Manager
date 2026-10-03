import { test, expect } from '@playwright/test'
import { generateTestUser, apiRegister, loginUser, cleanupUserData } from './helpers'

test.describe('5. Search & Filter Testing E2E', () => {
  test.describe.configure({ mode: 'serial' })

  const user = generateTestUser('search')
  let userToken = ''

  const alphaTask = `Alpha Project Review ${Date.now()}`
  const betaTask = `Beta Budget Forecast ${Date.now()}`
  const gammaTask = `Gamma Client Presentation ${Date.now()}`

  test.beforeAll(async ({ request }) => {
    const reg = await apiRegister(request, user)
    userToken = reg.token

    // Create Work category
    await request.post('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { name: 'Work' },
    })

    // Seed tasks with different attributes
    // 1. Alpha: General, Active
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { title: alphaTask, category: 'General', priority: 'high' },
    })

    // 2. Beta: Work, Active
    await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { title: betaTask, category: 'Work', priority: 'medium' },
    })

    // 3. Gamma: Work, Completed
    const gammaRes = await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { title: gammaTask, category: 'Work', priority: 'low' },
    })
    const gammaData = await gammaRes.json()
    await request.patch(`http://localhost:5000/api/tasks/${gammaData.data._id}`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { completed: true },
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginUser(page, user.email, user.password)
    await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 15000 })
  })

  test('Global task search: partial title, case variation, clear and empty state', async ({ page }) => {
    const searchInput = page.locator('input.search-input')

    // 1. Partial match: "Alpha"
    await searchInput.fill('alpha')
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).not.toBeVisible()

    // 2. Case variation: "BUDGET"
    await searchInput.fill('BUDGET')
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).not.toBeVisible()

    // 3. No results
    await searchInput.fill('NonExistentKeywordXYZ')
    await expect(page.locator('.empty-state')).toBeVisible({ timeout: 7000 })
    await expect(page.locator('.empty-state')).toContainText('No tasks matching')

    // 4. Clear search via clear button
    const clearBtn = page.locator('button.btn-search-clear')
    await clearBtn.click()
    await expect(searchInput).toHaveValue('')
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).toBeVisible({ timeout: 7000 })
  })

  test('Keyboard shortcuts for search: "/" to focus, "Escape" to clear', async ({ page }) => {
    const searchInput = page.locator('input.search-input')

    // Press '/' on page
    await page.keyboard.press('/')
    await expect(searchInput).toBeFocused()

    // Type query
    await searchInput.fill('Forecast')
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).toBeVisible()

    // Press 'Escape' to clear
    await page.keyboard.press('Escape')
    await expect(searchInput).toHaveValue('')
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).toBeVisible()
  })

  test('Status filters: All, Active, and Done tabs', async ({ page }) => {
    // 1. Active tab: Alpha (Active) and Beta (Active) visible, Gamma (Done) hidden
    await page.locator('.filter-tab:has-text("Active")').click()
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${gammaTask}")`)).not.toBeVisible()

    // 2. Done tab: Gamma (Done) visible, Alpha & Beta hidden
    await page.locator('.filter-tab:has-text("Done")').click()
    await expect(page.locator(`.task-title:has-text("${gammaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).not.toBeVisible()
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).not.toBeVisible()

    // 3. All tab: All 3 visible
    await page.locator('.filter-tab:has-text("All")').click()
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${gammaTask}")`)).toBeVisible({ timeout: 7000 })
  })

  test('Category and combined filtering (Category + Status + Search)', async ({ page }) => {
    // 1. Filter by 'Work' category in sidebar
    await page.locator('.category-item:has-text("Work")').click()

    // Expect Beta (Work) and Gamma (Work) visible, Alpha (General) hidden
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${gammaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).not.toBeVisible()

    // 2. Combine with Status: Active
    await page.locator('.filter-tab:has-text("Active")').click()
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).toBeVisible({ timeout: 7000 })
    await expect(page.locator(`.task-title:has-text("${gammaTask}")`)).not.toBeVisible() // Gamma is Done

    // 3. Combine with Search query
    await page.locator('input.search-input').fill('Budget')
    await expect(page.locator(`.task-title:has-text("${betaTask}")`)).toBeVisible({ timeout: 7000 })

    // Search query that doesn't match Beta
    await page.locator('input.search-input').fill('Review')
    await expect(page.locator('.empty-state')).toBeVisible({ timeout: 7000 })

    // Clear filters
    await page.locator('button.btn-search-clear').click()
    await page.locator('button.clear-all-filters-btn').click()
    await expect(page.locator(`.task-title:has-text("${alphaTask}")`)).toBeVisible({ timeout: 7000 })
  })

  test.afterAll(async ({ request }) => {
    if (userToken) await cleanupUserData(request, userToken)
  })
})
