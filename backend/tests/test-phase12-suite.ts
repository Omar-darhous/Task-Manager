import app from '../src/app.js'
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import type { Server } from 'http'

const TEST_PORT = 5098
const BASE_URL = `http://localhost:${TEST_PORT}/api`

async function runTests() {
  console.log('--- STARTING PHASE 12 TEST SUITE (Profile, Password, Bulk Tasks, Category Cascades) ---')

  await connectDatabase()
  const server: Server = app.listen(TEST_PORT)
  console.log(`Test server running on port ${TEST_PORT}`)

  const timestamp = Date.now()
  const emailA = `phase12_a_${timestamp}@taskflowtest.com`
  const emailB = `phase12_b_${timestamp}@taskflowtest.com`
  const emailC = `phase12_c_${timestamp}@taskflowtest.com`
  const passwordInitial = 'InitialPass123!'
  const passwordNew = 'NewSecurePass456!'

  let tokenA = ''
  let tokenB = ''
  let userAId = ''

  try {
    // 1. Health check
    console.log('\n[1/20] Testing GET /api/health ...')
    const healthRes = await fetch(`${BASE_URL}/health`)
    if (healthRes.status !== 200) throw new Error('Health check failed')

    // 2. Swagger docs check
    console.log('\n[2/20] Testing GET /api/docs/ ...')
    const docsRes = await fetch(`${BASE_URL}/docs/`)
    if (docsRes.status !== 200) throw new Error('Swagger docs check failed')

    // 3. Register User A & B
    console.log('\n[3/20] Registering User A and User B ...')
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alpha User', email: emailA, password: passwordInitial }),
    })
    const regDataA = (await regResA.json()) as { data: { token: string; user: { id: string } } }
    tokenA = regDataA.data.token
    userAId = regDataA.data.user.id

    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Beta User', email: emailB, password: passwordInitial }),
    })
    const regDataB = (await regResB.json()) as { data: { token: string } }
    tokenB = regDataB.data.token

    // 4. GET /api/users/me (User A)
    console.log('\n[4/20] Testing GET /api/users/me ...')
    const profileRes = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    const profileData = (await profileRes.json()) as { success: boolean; data: { name: string; email: string; passwordHash?: string } }
    console.log('GET profile status:', profileRes.status, 'Name:', profileData.data?.name)
    if (profileRes.status !== 200 || profileData.data.name !== 'Alpha User' || profileData.data.passwordHash) {
      throw new Error('GET /api/users/me failed or leaked passwordHash')
    }

    // 5. Unauthorized GET /api/users/me
    console.log('\n[5/20] Testing unauthorized GET /api/users/me ...')
    const unauthProfileRes = await fetch(`${BASE_URL}/users/me`)
    console.log('Unauth profile status:', unauthProfileRes.status)
    if (unauthProfileRes.status !== 401) throw new Error('Expected 401 for unauthenticated profile request')

    // 6. PATCH /api/users/me (Update name & email)
    console.log('\n[6/20] Testing PATCH /api/users/me (Update Name) ...')
    const updateNameRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: 'Alpha Updated' }),
    })
    const updateNameData = (await updateNameRes.json()) as { success: boolean; data: { name: string; email: string } }
    console.log('Update name status:', updateNameRes.status, 'New name:', updateNameData.data?.name)
    if (updateNameRes.status !== 200 || updateNameData.data.name !== 'Alpha Updated') {
      throw new Error('PATCH /api/users/me name update failed')
    }

    // 7. Duplicate email rejection
    console.log('\n[7/20] Testing duplicate email rejection on PATCH /api/users/me ...')
    const dupEmailRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ email: emailB }),
    })
    console.log('Duplicate email status:', dupEmailRes.status)
    if (dupEmailRes.status !== 409) throw new Error('Expected 409 on duplicate email update')

    // 8. Change password - wrong current password
    console.log('\n[8/20] Testing PATCH /api/users/me/password with wrong current password ...')
    const wrongPassRes = await fetch(`${BASE_URL}/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ currentPassword: 'WrongPassword!', newPassword: passwordNew }),
    })
    console.log('Wrong current password status:', wrongPassRes.status)
    if (wrongPassRes.status !== 401) throw new Error('Expected 401 for wrong current password')

    // 9. Change password - valid
    console.log('\n[9/20] Testing PATCH /api/users/me/password with valid credentials ...')
    const changePassRes = await fetch(`${BASE_URL}/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ currentPassword: passwordInitial, newPassword: passwordNew }),
    })
    console.log('Valid password change status:', changePassRes.status)
    if (changePassRes.status !== 200) throw new Error('Expected 200 for valid password change')

    // 10. Login with old password fails
    console.log('\n[10/20] Verifying login with old password fails ...')
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: passwordInitial }),
    })
    console.log('Old password login status:', oldLoginRes.status)
    if (oldLoginRes.status !== 401) throw new Error('Expected 401 logging in with old password')

    // 11. Login with new password succeeds
    console.log('\n[11/20] Verifying login with new password succeeds ...')
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: passwordNew }),
    })
    const newLoginData = (await newLoginRes.json()) as { success: boolean; data: { token: string } }
    console.log('New password login status:', newLoginRes.status)
    if (newLoginRes.status !== 200 || !newLoginData.data?.token) {
      throw new Error('Login with new password failed')
    }
    tokenA = newLoginData.data.token

    // 12. Create test tasks for User A
    console.log('\n[12/20] Creating multiple tasks for User A ...')
    const createdTaskIds: string[] = []
    for (let i = 1; i <= 3; i++) {
      const taskRes = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ title: `Bulk Task ${i}`, priority: 'medium', category: 'Work' }),
      })
      const taskData = (await taskRes.json()) as { data: { _id: string } }
      createdTaskIds.push(taskData.data._id)
    }
    console.log('Created tasks:', createdTaskIds)

    // 13. Bulk complete
    console.log('\n[13/20] Testing PATCH /api/tasks/bulk action: complete ...')
    const bulkCompleteRes = await fetch(`${BASE_URL}/tasks/bulk`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ ids: [createdTaskIds[0], createdTaskIds[1]], action: 'complete' }),
    })
    const bulkCompleteData = (await bulkCompleteRes.json()) as { success: boolean; count: number }
    console.log('Bulk complete status:', bulkCompleteRes.status, 'Affected count:', bulkCompleteData.count)
    if (bulkCompleteRes.status !== 200 || bulkCompleteData.count !== 2) {
      throw new Error(`Bulk complete failed. Expected count 2, got ${bulkCompleteData.count}`)
    }

    // 14. Bulk activate
    console.log('\n[14/20] Testing PATCH /api/tasks/bulk action: activate ...')
    const bulkActivateRes = await fetch(`${BASE_URL}/tasks/bulk`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ ids: [createdTaskIds[0]], action: 'activate' }),
    })
    const bulkActivateData = (await bulkActivateRes.json()) as { success: boolean; count: number }
    console.log('Bulk activate status:', bulkActivateRes.status, 'Affected count:', bulkActivateData.count)
    if (bulkActivateRes.status !== 200 || bulkActivateData.count !== 1) {
      throw new Error(`Bulk activate failed. Expected count 1, got ${bulkActivateData.count}`)
    }

    // 15. Cross-user bulk isolation (User B attempting to bulk modify User A tasks)
    console.log('\n[15/20] Testing cross-user bulk modification isolation ...')
    const crossBulkRes = await fetch(`${BASE_URL}/tasks/bulk`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ ids: createdTaskIds, action: 'delete' }),
    })
    const crossBulkData = (await crossBulkRes.json()) as { count: number }
    console.log('User B bulk delete User A tasks count:', crossBulkData.count)
    if (crossBulkData.count !== 0) {
      throw new Error('User B was able to modify/delete User A tasks in bulk!')
    }

    // 16. Bulk delete by owner
    console.log('\n[16/20] Testing PATCH /api/tasks/bulk action: delete by owner ...')
    const bulkDeleteRes = await fetch(`${BASE_URL}/tasks/bulk`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ ids: [createdTaskIds[0], createdTaskIds[1]], action: 'delete' }),
    })
    const bulkDeleteData = (await bulkDeleteRes.json()) as { count: number }
    console.log('Bulk delete count:', bulkDeleteData.count)
    if (bulkDeleteRes.status !== 200 || bulkDeleteData.count !== 2) {
      throw new Error('Bulk delete failed')
    }

    // 17. Category Management: Create category
    console.log('\n[17/20] Testing Category Creation ...')
    const catRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: 'ProjectX' }),
    })
    const catData = (await catRes.json()) as { data: { _id: string; name: string } }
    const catId = catData.data._id
    console.log('Created category ID:', catId, 'Name:', catData.data.name)
    if (catRes.status !== 201) throw new Error('Create category failed')

    // Create a task assigned to ProjectX
    const taskCatRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Task in ProjectX', category: 'ProjectX' }),
    })
    const taskCatData = (await taskCatRes.json()) as { data: { _id: string } }
    const taskInCatId = taskCatData.data._id

    // 18. Category Rename: cascades to tasks
    console.log('\n[18/20] Testing Category Rename & Task Cascade ...')
    const catRenameRes = await fetch(`${BASE_URL}/categories/${catId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: 'ProjectOmega' }),
    })
    console.log('Category rename status:', catRenameRes.status)
    if (catRenameRes.status !== 200) throw new Error('Category rename failed')

    // Check task category updated to ProjectOmega
    const taskAfterRenameRes = await fetch(`${BASE_URL}/tasks/${taskInCatId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    const taskAfterRename = (await taskAfterRenameRes.json()) as { data: { category: string } }
    console.log('Task category after rename:', taskAfterRename.data.category)
    if (taskAfterRename.data.category !== 'ProjectOmega') {
      throw new Error(`Expected task category to be ProjectOmega, got ${taskAfterRename.data.category}`)
    }

    // 19. Category Delete: reassigns tasks to General
    console.log('\n[19/20] Testing Category Delete & Task Reassignment to General ...')
    const catDeleteRes = await fetch(`${BASE_URL}/categories/${catId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    console.log('Category delete status:', catDeleteRes.status)
    if (catDeleteRes.status !== 200) throw new Error('Category delete failed')

    // Verify task category is now 'General'
    const taskAfterCatDeleteRes = await fetch(`${BASE_URL}/tasks/${taskInCatId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    const taskAfterCatDelete = (await taskAfterCatDeleteRes.json()) as { data: { category: string } }
    console.log('Task category after category deletion:', taskAfterCatDelete.data.category)
    if (taskAfterCatDelete.data.category !== 'General') {
      throw new Error(`Expected task category to safely fall back to 'General', got ${taskAfterCatDelete.data.category}`)
    }

    // 20. Clean up remaining test task
    console.log('\n[20/20] Cleaning up remaining tasks ...')
    await fetch(`${BASE_URL}/tasks/${taskInCatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    await fetch(`${BASE_URL}/tasks/${createdTaskIds[2]}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    })

    console.log('\n=============================================')
    console.log('>>> ALL 20 PHASE 12 BACKEND TESTS PASSED! <<<')
    console.log('=============================================\n')
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error)
    process.exitCode = 1
  } finally {
    server.close()
    await disconnectDatabase()
  }
}

runTests()
