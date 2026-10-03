import { test, expect } from '@playwright/test'
import { generateTestUser, apiRegister, loginUser, logoutUser, cleanupUserData } from './helpers'

test.describe('AUTHENTICATION & SESSION SECURITY AUDIT SUITE', () => {
  const BASE_URL = 'http://localhost:5000/api'

  // ==================================================
  // 1. ONE-DAY JWT EXPIRATION VERIFICATION
  // ==================================================
  test('1. JWT 1-day expiration: newly signed token has exp claim exactly 86400s after iat', async ({ request }) => {
    const user = generateTestUser('jwt-1d')
    const reg = await apiRegister(request, user)
    const token = reg.token
    expect(token).toBeTruthy()

    // Decode JWT payload (without printing secret or token)
    const parts = token.split('.')
    expect(parts.length).toBe(3)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as { iat: number; exp: number; userId: string; role: string }

    expect(payload.iat).toBeDefined()
    expect(payload.exp).toBeDefined()
    const lifetimeSeconds = payload.exp - payload.iat
    console.log(`JWT Lifetime verified: ${lifetimeSeconds} seconds (1 day = 86400s)`)
    expect(lifetimeSeconds).toBe(86400)

    if (token) await cleanupUserData(request, token)
  })

  // ==================================================
  // 2. PROTECTED ROUTE SECURITY & DEEP LINK NORMALIZATION
  // ==================================================
  test.describe('2 & 5. Protected Route & Deep Link Security (Unauthenticated Direct Navigation)', () => {
    const protectedRoutes = ['/', '/settings', '/calendar', '/today', '/completed']

    for (const route of protectedRoutes) {
      test(`Direct navigation to "${route}" without logging in normalizes to /login and hides protected content`, async ({ page }) => {
        // Ensure storage is completely clean
        await page.goto('/login')
        await page.evaluate(() => {
          localStorage.clear()
          sessionStorage.clear()
        })

        // Direct navigation to target route
        await page.goto(route)

        // 1. Protected content must NOT be rendered
        await expect(page.locator('.app-topbar')).not.toBeVisible()
        await expect(page.locator('.app-sidebar')).not.toBeVisible()
        await expect(page.locator('.dashboard-layout')).not.toBeVisible()
        await expect(page.locator('.task-list')).not.toBeVisible()
        await expect(page.locator('.account-settings-page')).not.toBeVisible()

        // 2. Login view must be rendered
        await expect(page.locator('#auth-email')).toBeVisible({ timeout: 10000 })
        await expect(page.locator('#auth-password')).toBeVisible()

        // 3. Browser URL must be normalized to /login
        const pathname = new URL(page.url()).pathname
        expect(pathname).toBe('/login')
      })
    }
  })

  // ==================================================
  // 3. AUTH STORAGE TEST (A - G)
  // ==================================================
  test.describe('3. Auth Storage Tests (Scenarios A through G)', () => {
    let testUserA: ReturnType<typeof generateTestUser>
    let testUserB: ReturnType<typeof generateTestUser>
    let tokenA = ''
    let tokenB = ''
    let taskIdA = ''

    test.beforeAll(async ({ request }) => {
      testUserA = generateTestUser('audit-a')
      testUserB = generateTestUser('audit-b')

      const regA = await apiRegister(request, testUserA)
      tokenA = regA.token

      const regB = await apiRegister(request, testUserB)
      tokenB = regB.token

      // Create a task for User A
      const taskRes = await request.post(`${BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${tokenA}` },
        data: { title: 'Audit Secret Task User A', priority: 'high', category: 'General' },
      })
      const taskBody = await taskRes.json()
      taskIdA = taskBody.data._id
    })

    test.afterAll(async ({ request }) => {
      if (tokenA) await cleanupUserData(request, tokenA)
      if (tokenB) await cleanupUserData(request, tokenB)
    })

    test('Scenario A — No token: Redirects to /login', async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await expect(page.locator('#auth-email')).toBeVisible()
      await expect(page.locator('.app-topbar')).not.toBeVisible()
      expect(new URL(page.url()).pathname).toBe('/login')
    })

    test('Scenario B — Valid token: Authenticated dashboard allowed', async ({ page }) => {
      await loginUser(page, testUserA.email, testUserA.password)
      await expect(page.locator('.app-topbar')).toBeVisible()
      await expect(page.locator('.app-sidebar')).toBeVisible()
    })

    test('Scenario C — Expired token: Session rejected and redirected to login', async ({ page }) => {
      // Craft an expired JWT structure (base64url payload with exp in the past)
      const expiredPayload = btoa(
        JSON.stringify({ userId: '660000000000000000000001', role: 'user', iat: 500, exp: 1000 })
      ).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${expiredPayload}.signature_mock`

      await page.goto('/')
      await page.evaluate((tok) => {
        localStorage.setItem('taskflow_auth_token', tok)
        localStorage.setItem('taskflow_auth_user', JSON.stringify({ id: '1', name: 'Expired', email: 'e@e.com', role: 'user' }))
      }, expiredToken)

      await page.reload()

      // initAuth should reject, clear localStorage, and render login
      await expect(page.locator('#auth-email')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.app-topbar')).not.toBeVisible()
      const storedToken = await page.evaluate(() => localStorage.getItem('taskflow_auth_token'))
      expect(storedToken).toBeNull()
      expect(new URL(page.url()).pathname).toBe('/login')
    })

    test('Scenario D — Corrupted token: Session rejected and redirected to login', async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.setItem('taskflow_auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted_payload.invalid_signature')
      })
      await page.reload()

      await expect(page.locator('#auth-email')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.app-topbar')).not.toBeVisible()
      const storedToken = await page.evaluate(() => localStorage.getItem('taskflow_auth_token'))
      expect(storedToken).toBeNull()
      expect(new URL(page.url()).pathname).toBe('/login')
    })

    test('Scenario E — Random string as token: Session rejected and redirected to login', async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.setItem('taskflow_auth_token', 'random_string_totally_not_a_jwt_9999999')
      })
      await page.reload()

      await expect(page.locator('#auth-email')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.app-topbar')).not.toBeVisible()
      const storedToken = await page.evaluate(() => localStorage.getItem('taskflow_auth_token'))
      expect(storedToken).toBeNull()
      expect(new URL(page.url()).pathname).toBe('/login')
    })

    test('Scenario F — Deleted token: Redirected to login', async ({ page }) => {
      await loginUser(page, testUserA.email, testUserA.password)
      await expect(page.locator('.app-topbar')).toBeVisible()

      // Delete token from localStorage
      await page.evaluate(() => {
        localStorage.removeItem('taskflow_auth_token')
      })

      // Reload
      await page.reload()
      await expect(page.locator('#auth-email')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.app-topbar')).not.toBeVisible()
      expect(new URL(page.url()).pathname).toBe('/login')
    })

    test('Scenario G — Token belonging to another user: Backend enforces ownership isolation', async ({ request }) => {
      // User B attempts to access User A's task with User B's token
      const accessRes = await request.get(`${BASE_URL}/tasks/${taskIdA}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      })
      expect(accessRes.status()).toBe(404)

      const patchRes = await request.patch(`${BASE_URL}/tasks/${taskIdA}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
        data: { title: 'Unauthorized Modification' },
      })
      expect(patchRes.status()).toBe(404)

      const delRes = await request.delete(`${BASE_URL}/tasks/${taskIdA}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      })
      expect(delRes.status()).toBe(404)
    })
  })

  // ==================================================
  // 4. DIRECT API SECURITY (Unauthenticated Endpoints)
  // ==================================================
  test.describe('4. Direct API Security', () => {
    test('Unauthenticated GET requests return 401', async ({ request }) => {
      const endpoints = ['/tasks', '/categories', '/users/me', '/auth/me']
      for (const ep of endpoints) {
        const res = await request.get(`${BASE_URL}${ep}`)
        expect(res.status()).toBe(401)
        const body = await res.json()
        expect(body.success).toBe(false)
      }
    })

    test('Unauthenticated PATCH and DELETE requests return 401', async ({ request }) => {
      const fakeId = '660000000000000000000001'

      const patchTask = await request.patch(`${BASE_URL}/tasks/${fakeId}`, {
        data: { title: 'hacked' },
      })
      expect(patchTask.status()).toBe(401)

      const delTask = await request.delete(`${BASE_URL}/tasks/${fakeId}`)
      expect(delTask.status()).toBe(401)

      const patchCat = await request.patch(`${BASE_URL}/categories/${fakeId}`, {
        data: { name: 'hacked' },
      })
      expect(patchCat.status()).toBe(401)

      const delCat = await request.delete(`${BASE_URL}/categories/${fakeId}`)
      expect(delCat.status()).toBe(401)
    })
  })

  // ==================================================
  // 6. LOGOUT SECURITY
  // ==================================================
  test.describe('6. Logout Security', () => {
    test('Logout clears storage, blocks access to / and /settings, rejects APIs with 401', async ({ page, request }) => {
      const user = generateTestUser('logout-test')
      await apiRegister(request, user)

      await loginUser(page, user.email, user.password)
      await expect(page.locator('.app-topbar')).toBeVisible()

      await logoutUser(page)

      const token = await page.evaluate(() => localStorage.getItem('taskflow_auth_token'))
      const storedUser = await page.evaluate(() => localStorage.getItem('taskflow_auth_user'))
      expect(token).toBeNull()
      expect(storedUser).toBeNull()

      await page.goto('/')
      await expect(page.locator('#auth-email')).toBeVisible()
      await expect(page.locator('.app-topbar')).not.toBeVisible()
      expect(new URL(page.url()).pathname).toBe('/login')

      await page.goto('/settings')
      await expect(page.locator('#auth-email')).toBeVisible()
      await expect(page.locator('.app-topbar')).not.toBeVisible()
      expect(new URL(page.url()).pathname).toBe('/login')

      const apiRes = await request.get(`${BASE_URL}/tasks`)
      expect(apiRes.status()).toBe(401)
    })
  })

  // ==================================================
  // 7. PAGE RELOAD TEST
  // ==================================================
  test.describe('7. Page Reload Test', () => {
    test('Session persists across page reload (F5)', async ({ page, request }) => {
      const user = generateTestUser('reload-test')
      await apiRegister(request, user)

      await loginUser(page, user.email, user.password)
      await expect(page.locator('.app-topbar')).toBeVisible()

      await page.reload()

      await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('#auth-email')).not.toBeVisible()
    })
  })

  // ==================================================
  // 8 & 9. GLOBAL 401 MID-SESSION E2E TEST
  // ==================================================
  test.describe('8 & 9. Global 401 Mid-Session API Handling', () => {
    test('Mid-session 401 error immediately clears auth, unmounts dashboard, and shows Login without reload', async ({ page, request }) => {
      const user = generateTestUser('mid-401')
      await apiRegister(request, user)

      await loginUser(page, user.email, user.password)
      await expect(page.locator('.app-topbar')).toBeVisible()

      // Corrupt token in localStorage while dashboard is active
      await page.evaluate(() => {
        localStorage.setItem('taskflow_auth_token', 'expired_invalid_token_during_active_session')
      })

      // Attempt an authenticated action (creating a task)
      await page.locator('input.task-input-pro').fill('Test 401 Eviction Task')
      await page.locator('button.task-form-submit').click()

      // The global 401 handler should immediately evict auth, set state to null, and show login
      await expect(page.locator('#auth-email')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.app-topbar')).not.toBeVisible()

      // Verify localStorage was cleared
      const storedToken = await page.evaluate(() => localStorage.getItem('taskflow_auth_token'))
      expect(storedToken).toBeNull()

      // URL should be normalized to /login
      expect(new URL(page.url()).pathname).toBe('/login')
    })
  })

  // ==================================================
  // 10. MULTI-TAB SYNCHRONIZATION E2E TEST
  // ==================================================
  test.describe('10. Multi-Tab Logout Synchronization Test', () => {
    test('Tab A logout immediately clears Tab B without requiring manual reload', async ({ browser, request }) => {
      const user = generateTestUser('multitab-sync')
      await apiRegister(request, user)

      const context = await browser.newContext({ baseURL: 'http://localhost:5173' })
      const pageA = await context.newPage()
      const pageB = await context.newPage()

      // Tab A logs in
      await loginUser(pageA, user.email, user.password)
      await expect(pageA.locator('.app-topbar')).toBeVisible()

      // Tab B opens application
      await pageB.goto('/')
      await expect(pageB.locator('.app-topbar')).toBeVisible()

      // Tab A logs out
      await logoutUser(pageA)
      await expect(pageA.locator('#auth-email')).toBeVisible()

      // Verify Tab B automatically logged out WITHOUT user reload
      await expect(pageB.locator('#auth-email')).toBeVisible({ timeout: 10000 })
      await expect(pageB.locator('.app-topbar')).not.toBeVisible()
      expect(new URL(pageB.url()).pathname).toBe('/login')

      // Verify shared storage is empty
      const tokenInB = await pageB.evaluate(() => localStorage.getItem('taskflow_auth_token'))
      expect(tokenInB).toBeNull()

      await context.close()
    })
  })

  // ==================================================
  // 11. AUTHENTICATED ROUTE NAVIGATION & RELOAD
  // ==================================================
  test.describe('11. Authenticated Route Navigation & Reload Persistence', () => {
    test('Authenticated user can navigate to and reload on /, /settings, /calendar, /today, /completed', async ({ page, request }) => {
      const user = generateTestUser('auth-nav')
      await apiRegister(request, user)

      await loginUser(page, user.email, user.password)
      await expect(page.locator('.app-topbar')).toBeVisible()

      const routes = [
        { path: '/today', check: () => page.locator('.topbar-title:has-text("Today")') },
        { path: '/calendar', check: () => page.locator('.topbar-title:has-text("Calendar")') },
        { path: '/completed', check: () => page.locator('.topbar-title:has-text("Completed")') },
        { path: '/settings', check: () => page.locator('.settings-header .greeting-title:has-text("Account Settings")') },
        { path: '/', check: () => page.locator('.app-topbar') },
      ]

      for (const r of routes) {
        await page.goto(r.path)
        await expect(r.check()).toBeVisible({ timeout: 10000 })
        await expect(page.locator('#auth-email')).not.toBeVisible()

        // Reload on this route
        await page.reload()
        await expect(r.check()).toBeVisible({ timeout: 10000 })
        await expect(page.locator('#auth-email')).not.toBeVisible()
        expect(new URL(page.url()).pathname).toBe(r.path)
      }
    })
  })

  // ==================================================
  // 12. BROWSER RESTART SIMULATION TEST
  // ==================================================
  test.describe('12. Browser Restart Simulation Test', () => {
    test('Session persists across browser context close/reopen with valid token, but rejects expired token', async ({ browser, request }) => {
      const user = generateTestUser('browser-restart')
      const reg = await apiRegister(request, user)
      const validToken = reg.token

      // Scenario A: Close and reopen browser within valid 1-day lifetime
      const contextA = await browser.newContext({ baseURL: 'http://localhost:5173' })
      const pageA = await contextA.newPage()
      await pageA.goto('/login')
      await pageA.evaluate(({ tok, u }) => {
        localStorage.setItem('taskflow_auth_token', tok)
        localStorage.setItem('taskflow_auth_user', JSON.stringify(u))
      }, { tok: validToken, u: reg.user })

      // Navigate to app (simulating browser reopen)
      await pageA.goto('/')
      await expect(pageA.locator('.app-topbar')).toBeVisible({ timeout: 10000 })
      await expect(pageA.locator('#auth-email')).not.toBeVisible()
      await contextA.close()

      // Scenario B: Reopen browser after JWT expiration
      const expiredPayload = btoa(
        JSON.stringify({ userId: reg.user.id, role: 'user', iat: 500, exp: 1000 })
      ).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${expiredPayload}.sig`

      const contextB = await browser.newContext({ baseURL: 'http://localhost:5173' })
      const pageB = await contextB.newPage()
      await pageB.goto('/login')
      await pageB.evaluate(({ tok, u }) => {
        localStorage.setItem('taskflow_auth_token', tok)
        localStorage.setItem('taskflow_auth_user', JSON.stringify(u))
      }, { tok: expiredToken, u: reg.user })

      await pageB.goto('/')
      await expect(pageB.locator('#auth-email')).toBeVisible({ timeout: 10000 })
      await expect(pageB.locator('.app-topbar')).not.toBeVisible()
      expect(new URL(pageB.url()).pathname).toBe('/login')
      await contextB.close()
    })
  })

  // ==================================================
  // 13. CACHE / STORAGE AUDIT
  // ==================================================
  test.describe('13. Cache & Storage Audit', () => {
    test('Audit localStorage, sessionStorage, and cookie keys', async ({ page, request }) => {
      const user = generateTestUser('storage-audit')
      await apiRegister(request, user)

      await loginUser(page, user.email, user.password)
      await expect(page.locator('.app-topbar')).toBeVisible()

      const storageAudit = await page.evaluate(() => {
        const localKeys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k) localKeys.push(k)
        }

        const sessionKeys: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i)
          if (k) sessionKeys.push(k)
        }

        return {
          localStorageKeys: localKeys,
          sessionStorageKeys: sessionKeys,
          cookies: document.cookie,
        }
      })

      expect(storageAudit.localStorageKeys).toContain('taskflow_auth_token')
      expect(storageAudit.localStorageKeys).toContain('taskflow_auth_user')
      expect(storageAudit.sessionStorageKeys.length).toBe(0)
    })
  })

  // ==================================================
  // 14. BACK/FORWARD CACHE TEST
  // ==================================================
  test.describe('14. Back/Forward Cache Test', () => {
    test('Back button after logout does not expose protected data and normalizes to /login', async ({ page, request }) => {
      const user = generateTestUser('bfcache-test')
      await apiRegister(request, user)

      await loginUser(page, user.email, user.password)
      await expect(page.locator('.app-topbar')).toBeVisible()

      // Navigate to settings while logged in to build history
      await page.locator('.app-sidebar button.settings-item').click()
      await expect(page.locator('.settings-header .greeting-title')).toHaveText('Account Settings')

      // Logout
      await logoutUser(page)
      await expect(page.locator('#auth-email')).toBeVisible()

      // Browser Back
      await page.goBack()

      // Protected content must not be accessible
      const isTopBarVisible = await page.locator('.app-topbar').isVisible()
      const isSettingsVisible = await page.locator('.settings-header .greeting-title').isVisible()
      expect(isTopBarVisible).toBe(false)
      expect(isSettingsVisible).toBe(false)

      // The user should see login page
      await expect(page.locator('#auth-email')).toBeVisible({ timeout: 5000 })
      expect(new URL(page.url()).pathname).toBe('/login')

      // Browser Forward
      await page.goForward()
      expect(await page.locator('.app-topbar').isVisible()).toBe(false)
      expect(await page.locator('.settings-header .greeting-title').isVisible()).toBe(false)
      await expect(page.locator('#auth-email')).toBeVisible()
      expect(new URL(page.url()).pathname).toBe('/login')
    })
  })
})
