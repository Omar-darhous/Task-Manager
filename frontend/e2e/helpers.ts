import { type Page, type APIRequestContext, expect } from '@playwright/test'

export interface TestUser {
  name: string
  email: string
  password: string
}

export function generateTestUser(prefix = 'e2e'): TestUser {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 100000)
  return {
    name: `User ${prefix} ${random}`,
    email: `${prefix}-${timestamp}-${random}@taskflow-test.com`,
    password: 'SecureTestPassword123!',
  }
}

export async function registerUser(page: Page, user: TestUser): Promise<string> {
  await page.goto('/register')

  // If currently showing login form, switch to register
  const createAccountBtn = page.locator('.auth-link-button:has-text("Create an account")')
  if (await createAccountBtn.isVisible()) {
    await createAccountBtn.click()
  }

  await expect(page.locator('#register-name')).toBeVisible({ timeout: 10000 })
  await page.locator('#register-name').fill(user.name)
  await page.locator('#register-email').fill(user.email)
  await page.locator('#register-password').fill(user.password)
  await page.locator('#register-confirm-password').fill(user.password)

  await page.locator('button[type="submit"]').click()

  // Wait for main dashboard topbar to appear
  await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 15000 })

  const token = await page.evaluate(() => localStorage.getItem('taskflow_auth_token')) || ''
  return token
}

export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')

  // If currently showing register form, switch to login
  const signInBtn = page.locator('.auth-link-button:has-text("Sign in")')
  if (await signInBtn.isVisible()) {
    await signInBtn.click()
  }

  await expect(page.locator('#auth-email')).toBeVisible({ timeout: 10000 })
  await page.locator('#auth-email').fill(email)
  await page.locator('#auth-password').fill(password)

  await page.locator('button[type="submit"]').click()

  // Wait for main dashboard to appear
  await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 15000 })
}

export async function logoutUser(page: Page): Promise<void> {
  // Open user avatar dropdown
  await page.locator('.user-avatar-btn').click()
  await expect(page.locator('.logout-item')).toBeVisible()

  // Click sign out
  await page.locator('.logout-item').click()

  // Wait for auth card to reappear
  await expect(page.locator('.auth-card')).toBeVisible({ timeout: 10000 })
}

export async function apiRegister(
  request: APIRequestContext,
  user: TestUser
): Promise<{ token: string; user: { id: string; name: string; email: string } }> {
  const res = await request.post('http://localhost:5000/api/auth/register', {
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
    },
  })
  expect(res.status()).toBe(201)
  const body = await res.json()
  return {
    token: body.data.token,
    user: body.data.user,
  }
}

export async function cleanupUserData(
  request: APIRequestContext,
  token: string
): Promise<void> {
  try {
    // Delete all tasks
    const tasksRes = await request.get('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (tasksRes.status() === 200) {
      const data = await tasksRes.json()
      if (Array.isArray(data.data)) {
        for (const task of data.data) {
          await request.delete(`http://localhost:5000/api/tasks/${task._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        }
      }
    }

    // Delete custom categories
    const catsRes = await request.get('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (catsRes.status() === 200) {
      const catData = await catsRes.json()
      if (Array.isArray(catData.data)) {
        for (const cat of catData.data) {
          if (cat.name.toLowerCase() !== 'general') {
            await request.delete(`http://localhost:5000/api/categories/${cat._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error during test cleanup:', err)
  }
}
