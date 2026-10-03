import app from '../src/app.js'
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import type { Server } from 'http'

const TEST_PORT = 5099
const BASE_URL = `http://localhost:${TEST_PORT}/api`

async function runTests() {
  console.log('--- STARTING PHASE 11 AUTHENTICATION & DATA OWNERSHIP TEST SUITE ---')

  await connectDatabase()
  const server: Server = app.listen(TEST_PORT)
  console.log(`Test server running on port ${TEST_PORT}`)

  const timestamp = Date.now()
  const emailA = `usera_${timestamp}@taskflowtest.com`
  const emailB = `userb_${timestamp}@taskflowtest.com`
  const passwordA = 'SecurePassword123!'
  const passwordB = 'SecurePassword456!'

  let tokenA = ''
  let tokenB = ''
  let taskIdA = ''
  let categoryIdA = ''

  try {
    // 1. Health check
    console.log('\n[1/19] Testing GET /api/health ...')
    const healthRes = await fetch(`${BASE_URL}/health`)
    const healthData = (await healthRes.json()) as { database?: { status?: string } }
    console.log('Health status:', healthRes.status, 'DB status:', healthData.database?.status)
    if (healthRes.status !== 200 || healthData.database?.status !== 'connected') {
      throw new Error('Health check failed')
    }

    // 2. Swagger docs check
    console.log('\n[2/19] Testing GET /api/docs/ ...')
    const docsRes = await fetch(`${BASE_URL}/docs/`)
    console.log('Docs status:', docsRes.status)
    if (docsRes.status !== 200) {
      throw new Error('Swagger docs check failed')
    }

    // 3. Register User A
    console.log('\n[3/19] Testing POST /api/auth/register (User A) ...')
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Alpha', email: emailA, password: passwordA }),
    })
    const regDataA = (await regResA.json()) as { data?: { token?: string; user?: { passwordHash?: string } } }
    console.log('Register User A status:', regResA.status, 'Has token:', Boolean(regDataA.data?.token))
    if (regResA.status !== 201 || !regDataA.data?.token || regDataA.data?.user?.passwordHash) {
      throw new Error('Register User A failed or leaked passwordHash')
    }
    tokenA = regDataA.data.token

    // 4. Duplicate email registration
    console.log('\n[4/19] Testing POST /api/auth/register (Duplicate Email) ...')
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Alpha Clone', email: emailA, password: passwordA }),
    })
    console.log('Duplicate register status:', dupRes.status)
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict, got ${dupRes.status}`)
    }

    // 5. Login User A with correct password
    console.log('\n[5/19] Testing POST /api/auth/login (Correct credentials) ...')
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: passwordA }),
    })
    const loginData = (await loginRes.json()) as { data?: { token?: string; user?: { passwordHash?: string } } }
    console.log('Login status:', loginRes.status, 'Has token:', Boolean(loginData.data?.token))
    if (loginRes.status !== 200 || !loginData.data?.token || loginData.data?.user?.passwordHash) {
      throw new Error('Login failed or leaked passwordHash')
    }

    // 6. Login with incorrect password
    console.log('\n[6/19] Testing POST /api/auth/login (Wrong password) ...')
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: 'WrongPassword999!' }),
    })
    console.log('Wrong password status:', wrongPassRes.status)
    if (wrongPassRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${wrongPassRes.status}`)
    }

    // 7. Login with unknown email
    console.log('\n[7/19] Testing POST /api/auth/login (Non-existent email) ...')
    const unknownEmailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user_xyz@test.com', password: passwordA }),
    })
    console.log('Unknown email status:', unknownEmailRes.status)
    if (unknownEmailRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${unknownEmailRes.status}`)
    }

    // 8. GET /api/auth/me with valid token
    console.log('\n[8/19] Testing GET /api/auth/me (Valid token) ...')
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    const meData = (await meRes.json()) as { data?: { email?: string; passwordHash?: string } }
    console.log('Me status:', meRes.status, 'Email:', meData.data?.email)
    if (meRes.status !== 200 || meData.data?.email !== emailA || meData.data?.passwordHash) {
      throw new Error('GET /me failed or leaked passwordHash')
    }

    // 9. GET /api/auth/me without token
    console.log('\n[9/19] Testing GET /api/auth/me (No token) ...')
    const meNoTokenRes = await fetch(`${BASE_URL}/auth/me`)
    console.log('No token status:', meNoTokenRes.status)
    if (meNoTokenRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${meNoTokenRes.status}`)
    }

    // 10. GET /api/auth/me with invalid token
    console.log('\n[10/19] Testing GET /api/auth/me (Invalid token) ...')
    const meInvalidTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' },
    })
    console.log('Invalid token status:', meInvalidTokenRes.status)
    if (meInvalidTokenRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${meInvalidTokenRes.status}`)
    }

    // 11. Create Task for User A
    console.log('\n[11/19] Testing POST /api/tasks (Create task for User A) ...')
    const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'User Alpha Secret Task',
        priority: 'high',
        category: 'Work',
      }),
    })
    const taskData = (await createTaskRes.json()) as { data?: { _id?: string } }
    console.log('Create task status:', createTaskRes.status, 'Task ID:', taskData.data?._id)
    if (createTaskRes.status !== 201 || !taskData.data?._id) {
      throw new Error('Create task failed')
    }
    taskIdA = taskData.data._id

    // 12. Get User A's tasks
    console.log('\n[12/19] Testing GET /api/tasks (User A tasks) ...')
    const getTasksRes = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    const userATasks = (await getTasksRes.json()) as { count: number; data: Array<{ _id: string }> }
    console.log('Get tasks count:', userATasks.count)
    if (getTasksRes.status !== 200 || !userATasks.data.some((t: { _id: string }) => t._id === taskIdA)) {
      throw new Error('Task not found in User A list')
    }

    // 13. Update User A's task
    console.log('\n[13/19] Testing PATCH /api/tasks/:id (Update own task) ...')
    const patchTaskRes = await fetch(`${BASE_URL}/tasks/${taskIdA}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ completed: true }),
    })
    const updatedTask = (await patchTaskRes.json()) as { data?: { completed?: boolean } }
    console.log('Patch task status:', patchTaskRes.status, 'Completed:', updatedTask.data?.completed)
    if (patchTaskRes.status !== 200 || updatedTask.data?.completed !== true) {
      throw new Error('Update task failed')
    }

    // 14. Register User B
    console.log('\n[14/19] Testing POST /api/auth/register (User B) ...')
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Beta', email: emailB, password: passwordB }),
    })
    const regDataB = (await regResB.json()) as { data: { token: string } }
    console.log('Register User B status:', regResB.status)
    tokenB = regDataB.data.token

    // 15. User B attempts to access User A's task (Ownership isolation)
    console.log('\n[15/19] Testing Cross-User Task Access (User B accessing User A task) ...')
    const bGetRes = await fetch(`${BASE_URL}/tasks/${taskIdA}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    })
    console.log('User B GET User A task status:', bGetRes.status)
    if (bGetRes.status !== 404) {
      throw new Error(`Expected 404 Not Found (resource isolation), got ${bGetRes.status}`)
    }

    const bPatchRes = await fetch(`${BASE_URL}/tasks/${taskIdA}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ title: 'Hacked task' }),
    })
    console.log('User B PATCH User A task status:', bPatchRes.status)
    if (bPatchRes.status !== 404) {
      throw new Error(`Expected 404 Not Found, got ${bPatchRes.status}`)
    }

    const bDeleteRes = await fetch(`${BASE_URL}/tasks/${taskIdA}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    })
    console.log('User B DELETE User A task status:', bDeleteRes.status)
    if (bDeleteRes.status !== 404) {
      throw new Error(`Expected 404 Not Found, got ${bDeleteRes.status}`)
    }

    // 16. Create category for User A
    console.log('\n[16/19] Testing POST /api/categories (User A category) ...')
    const createCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: `ProjectAlpha_${timestamp}` }),
    })
    const catData = (await createCatRes.json()) as { data?: { _id?: string } }
    console.log('Create category status:', createCatRes.status, 'Category ID:', catData.data?._id)
    if (createCatRes.status !== 201 || !catData.data?._id) {
      throw new Error('Create category failed')
    }
    categoryIdA = catData.data._id

    // 17. User B attempts to access User A's category
    console.log('\n[17/19] Testing Cross-User Category Access (User B updating User A category) ...')
    const bCatPatchRes = await fetch(`${BASE_URL}/categories/${categoryIdA}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ name: `HackedCat_${timestamp}` }),
    })
    console.log('User B PATCH User A category status:', bCatPatchRes.status)
    if (bCatPatchRes.status !== 404) {
      throw new Error(`Expected 404 Not Found, got ${bCatPatchRes.status}`)
    }

    // 18. Unauthenticated requests to /api/tasks and /api/categories are rejected
    console.log('\n[18/19] Testing Unauthenticated access to /api/tasks & /api/categories ...')
    const unauthTasksRes = await fetch(`${BASE_URL}/tasks`)
    const unauthCatsRes = await fetch(`${BASE_URL}/categories`)
    console.log('Unauth tasks status:', unauthTasksRes.status, 'Unauth categories status:', unauthCatsRes.status)
    if (unauthTasksRes.status !== 401 || unauthCatsRes.status !== 401) {
      throw new Error('Unauthenticated requests were not rejected with 401')
    }

    // 19. Cleanup: User A deletes own task and category
    console.log('\n[19/19] Testing Clean up: User A deletes own task & category ...')
    const delTaskRes = await fetch(`${BASE_URL}/tasks/${taskIdA}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    console.log('Delete own task status:', delTaskRes.status)
    if (delTaskRes.status !== 200) {
      throw new Error('Delete task failed')
    }

    const delCatRes = await fetch(`${BASE_URL}/categories/${categoryIdA}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    console.log('Delete own category status:', delCatRes.status)
    if (delCatRes.status !== 200) {
      throw new Error('Delete category failed')
    }

    console.log('\n=============================================')
    console.log('>>> ALL 19 AUTH & OWNERSHIP TESTS PASSED! <<<')
    console.log('=============================================\n')
  } finally {
    server.close()
    await disconnectDatabase()
  }
}

runTests().catch((err) => {
  console.error('\n*** TEST SUITE FAILED ***\n', err)
  process.exit(1)
})
