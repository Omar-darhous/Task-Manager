import { test, expect } from '@playwright/test'
import { generateTestUser, apiRegister, loginUser, logoutUser, cleanupUserData } from './helpers'

test.describe('2. Authorization & Data Ownership E2E', () => {
  test.describe.configure({ mode: 'serial' })

  const userA = generateTestUser('auth-a')
  const userB = generateTestUser('auth-b')

  let tokenA = ''
  let tokenB = ''
  let taskIdA = ''
  let taskIdB = ''
  let catIdA = ''
  let catIdB = ''

  const taskTitleA = `Task Alpha ${Date.now()}`
  const taskTitleB = `Task Beta ${Date.now()}`
  const catNameA = `CatAlpha${Date.now().toString().slice(-4)}`
  const catNameB = `CatBeta${Date.now().toString().slice(-4)}`

  test.beforeAll(async ({ request }) => {
    // 1. Register User A & create Task A, Category A
    const regA = await apiRegister(request, userA)
    tokenA = regA.token

    const taskResA = await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { title: taskTitleA, priority: 'high', category: 'General' },
    })
    expect(taskResA.status()).toBe(201)
    const taskDataA = await taskResA.json()
    taskIdA = taskDataA.data._id

    const catResA = await request.post('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { name: catNameA },
    })
    expect(catResA.status()).toBe(201)
    const catDataA = await catResA.json()
    catIdA = catDataA.data._id

    // 2. Register User B & create Task B, Category B
    const regB = await apiRegister(request, userB)
    tokenB = regB.token

    const taskResB = await request.post('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: { title: taskTitleB, priority: 'low', category: 'General' },
    })
    expect(taskResB.status()).toBe(201)
    const taskDataB = await taskResB.json()
    taskIdB = taskDataB.data._id

    const catResB = await request.post('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: { name: catNameB },
    })
    expect(catResB.status()).toBe(201)
    const catDataB = await catResB.json()
    catIdB = catDataB.data._id
  })

  test('UI Isolation: User B cannot see Task A or Category A in UI', async ({ page }) => {
    await loginUser(page, userB.email, userB.password)

    // Verify User B's own task is visible
    await expect(page.locator(`.task-title:has-text("${taskTitleB}")`)).toBeVisible({ timeout: 10000 })

    // Verify User A's task is NOT visible
    await expect(page.locator(`.task-title:has-text("${taskTitleA}")`)).not.toBeVisible()

    // Verify User B's category is visible in sidebar
    await expect(page.locator(`.nav-text:has-text("${catNameB}")`)).toBeVisible()

    // Verify User A's category is NOT visible in sidebar
    await expect(page.locator(`.nav-text:has-text("${catNameA}")`)).not.toBeVisible()

    await logoutUser(page)
  })

  test('UI Isolation: User A cannot see Task B or Category B in UI', async ({ page }) => {
    await loginUser(page, userA.email, userA.password)

    // Verify User A's own task is visible
    await expect(page.locator(`.task-title:has-text("${taskTitleA}")`)).toBeVisible({ timeout: 10000 })

    // Verify User B's task is NOT visible
    await expect(page.locator(`.task-title:has-text("${taskTitleB}")`)).not.toBeVisible()

    // Verify User A's category is visible in sidebar
    await expect(page.locator(`.nav-text:has-text("${catNameA}")`)).toBeVisible()

    // Verify User B's category is NOT visible in sidebar
    await expect(page.locator(`.nav-text:has-text("${catNameB}")`)).not.toBeVisible()

    await logoutUser(page)
  })

  test('API Enforcement: Cross-user Task & Category access is rejected with 404', async ({ request }) => {
    expect(tokenA).toBeTruthy()
    expect(tokenB).toBeTruthy()
    expect(taskIdA).toBeTruthy()
    expect(taskIdB).toBeTruthy()

    // 1. User A tries to GET Task B
    const getTaskB = await request.get(`http://localhost:5000/api/tasks/${taskIdB}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(getTaskB.status()).toBe(404)

    // 2. User A tries to PATCH Task B
    const patchTaskB = await request.patch(`http://localhost:5000/api/tasks/${taskIdB}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { title: 'Hacked title by User A' },
    })
    expect(patchTaskB.status()).toBe(404)

    // 3. User A tries to DELETE Task B
    const delTaskB = await request.delete(`http://localhost:5000/api/tasks/${taskIdB}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(delTaskB.status()).toBe(404)

    // 4. User B tries to PATCH Category A (rename)
    const patchCatA = await request.patch(`http://localhost:5000/api/categories/${catIdA}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: { name: 'Renamed by User B' },
    })
    expect(patchCatA.status()).toBe(404)

    // 5. User B tries to DELETE Category A
    const delCatA = await request.delete(`http://localhost:5000/api/categories/${catIdA}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    })
    expect(delCatA.status()).toBe(404)

    // 6. User A tries to DELETE Category B
    const delCatB = await request.delete(`http://localhost:5000/api/categories/${catIdB}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(delCatB.status()).toBe(404)
  })

  test('API Enforcement: Unauthenticated requests return 401', async ({ request }) => {
    const unauthTasks = await request.get('http://localhost:5000/api/tasks')
    expect(unauthTasks.status()).toBe(401)

    const unauthCats = await request.get('http://localhost:5000/api/categories')
    expect(unauthCats.status()).toBe(401)

    const unauthCreate = await request.post('http://localhost:5000/api/tasks', {
      data: { title: 'Unauth task' },
    })
    expect(unauthCreate.status()).toBe(401)
  })

  test.afterAll(async ({ request }) => {
    if (tokenA) await cleanupUserData(request, tokenA)
    if (tokenB) await cleanupUserData(request, tokenB)
  })
})
