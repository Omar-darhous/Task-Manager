import { test, expect } from '@playwright/test'
import { generateTestUser, loginUser, logoutUser } from './helpers'

test.describe('1. Authentication E2E Lifecycle', () => {
  const testUser = generateTestUser('auth')

  test('TEST A — Registration: valid test user registration succeeds and loads dashboard', async ({ page }) => {
    await page.goto('/register')

    // If currently showing login form, switch to register
    const createAccountBtn = page.locator('.auth-link-button:has-text("Create an account")')
    if (await createAccountBtn.isVisible()) {
      await createAccountBtn.click()
    }

    await expect(page.locator('.auth-title')).toHaveText('Create your account')

    // Fill valid registration fields
    await page.locator('#register-name').fill(testUser.name)
    await page.locator('#register-email').fill(testUser.email)
    await page.locator('#register-password').fill(testUser.password)
    await page.locator('#register-confirm-password').fill(testUser.password)

    // Submit form
    await page.locator('button[type="submit"]').click()

    // Verify authenticated dashboard appears
    await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.app-sidebar')).toBeVisible()

    // Verify user avatar reflects user initials
    const avatar = page.locator('.user-avatar')
    await expect(avatar).toBeVisible()
    const avatarText = await avatar.innerText()
    expect(avatarText.trim().length).toBeGreaterThanOrEqual(1)
  })

  test('TEST B — Invalid Registration: validation errors and duplicate email rejection', async ({ page }) => {
    await page.goto('/register')

    // Switch to register view if on login
    const createAccountBtn = page.locator('.auth-link-button:has-text("Create an account")')
    if (await createAccountBtn.isVisible()) {
      await createAccountBtn.click()
    }

    await expect(page.locator('.auth-title')).toHaveText('Create your account')

    // 1. Submit empty form
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.auth-field-error').first()).toBeVisible()

    // 2. Short password (< 8 chars)
    await page.locator('#register-name').fill('Test User')
    await page.locator('#register-email').fill('valid-email@example.com')
    await page.locator('#register-password').fill('short')
    await page.locator('#register-confirm-password').fill('short')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Password must be at least 8 characters long')).toBeVisible()

    // 3. Password mismatch
    await page.locator('#register-password').fill('SecurePassword123!')
    await page.locator('#register-confirm-password').fill('MismatchPassword123!')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Passwords do not match')).toBeVisible()

    // 4. Duplicate email registration (using previously registered testUser)
    await page.locator('#register-name').fill('Clone User')
    await page.locator('#register-email').fill(testUser.email)
    await page.locator('#register-password').fill(testUser.password)
    await page.locator('#register-confirm-password').fill(testUser.password)
    await page.locator('button[type="submit"]').click()

    // Expect server error alert
    await expect(page.locator('.auth-alert-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.app-topbar')).not.toBeVisible()
  })

  test('TEST C — Login: valid credentials authenticate and load dashboard', async ({ page }) => {
    await loginUser(page, testUser.email, testUser.password)
    await expect(page.locator('.app-topbar')).toBeVisible()
    await expect(page.locator('.app-sidebar')).toBeVisible()
  })

  test('TEST D — Invalid Login: wrong credentials rejected with error', async ({ page }) => {
    await page.goto('/')

    const signInBtn = page.locator('button:has-text("Sign in")')
    if (await signInBtn.isVisible()) {
      await signInBtn.click()
    }

    // Non-existent email or wrong password
    await page.locator('#auth-email').fill(testUser.email)
    await page.locator('#auth-password').fill('WrongPassword999!')
    await page.locator('button[type="submit"]:has-text("Sign in")').click()

    await expect(page.locator('.auth-alert-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.app-topbar')).not.toBeVisible()
  })

  test('TEST E — Logout: clears session and protects routes', async ({ page }) => {
    // Login first
    await loginUser(page, testUser.email, testUser.password)

    // Logout
    await logoutUser(page)

    // Verify navigating to protected route or refreshing redirects back to login
    await page.goto('/settings')
    await expect(page.locator('.auth-card')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.app-topbar')).not.toBeVisible()
  })

  test('TEST F — Session Persistence: user remains logged in across page reload', async ({ page }) => {
    await loginUser(page, testUser.email, testUser.password)
    await expect(page.locator('.app-topbar')).toBeVisible()

    // Reload the page
    await page.reload()

    // Verify user remains logged in
    await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.auth-card')).not.toBeVisible()
  })
})
