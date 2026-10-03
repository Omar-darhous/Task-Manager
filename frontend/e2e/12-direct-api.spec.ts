import { test, expect } from '@playwright/test';
import { generateTestUser, cleanupUserData } from './helpers';

test.describe('12. Direct API Validation', () => {
  const BASE_URL = 'http://localhost:5000/api';
  const testUser = generateTestUser('api-direct');
  let token = '';
  let taskId = '';
  let categoryId = '';

  test.beforeAll(async ({ request }) => {
    // Register test user once for direct API suite
    const regRes = await request.post(`${BASE_URL}/auth/register`, {
      data: testUser,
    });
    expect(regRes.status()).toBe(201);
    const regBody = await regRes.json();
    token = regBody.data.token;
  });

  test.afterAll(async ({ request }) => {
    if (token) {
      await cleanupUserData(request, token);
    }
  });

  test('Auth APIs: Login and GET /me', async ({ request }) => {
    // 1. POST /api/auth/login
    const loginRes = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        email: testUser.email,
        password: testUser.password,
      },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);
    expect(loginBody.data.token).toBeDefined();

    // 2. GET /api/auth/me
    const meRes = await request.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes.status()).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.success).toBe(true);
    expect(meBody.data.email).toBe(testUser.email);
  });

  test('Categories APIs: POST, GET, PATCH, DELETE', async ({ request }) => {
    // 1. POST /api/categories
    const postRes = await request.post(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'DirectAPICat' },
    });
    expect(postRes.status()).toBe(201);
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
    expect(postBody.data.name).toBe('DirectAPICat');
    categoryId = postBody.data._id;

    // 2. GET /api/categories
    const getRes = await request.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.data.some((c: { name: string }) => c.name === 'DirectAPICat')).toBe(true);

    // 3. PATCH /api/categories/:id
    const patchRes = await request.patch(`${BASE_URL}/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'DirectAPICatRenamed' },
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.name).toBe('DirectAPICatRenamed');

    // 4. DELETE /api/categories/:id
    const delRes = await request.delete(`${BASE_URL}/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes.status()).toBe(200);
  });

  test('Tasks APIs: POST, GET, PATCH, Bulk PATCH, DELETE', async ({ request }) => {
    // 1. POST /api/tasks
    const postRes = await request.post(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Direct API Task 1',
        priority: 'high',
        category: 'General',
      },
    });
    expect(postRes.status()).toBe(201);
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
    expect(postBody.data.title).toBe('Direct API Task 1');
    taskId = postBody.data._id;

    // Create task 2 for bulk action
    const post2 = await request.post(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Direct API Task 2' },
    });
    const task2Id = (await post2.json()).data._id;

    // 2. GET /api/tasks
    const getRes = await request.get(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.count).toBeGreaterThanOrEqual(2);

    // 3. PATCH /api/tasks/:id
    const patchRes = await request.patch(`${BASE_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { completed: true, title: 'Direct API Task 1 Updated' },
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.completed).toBe(true);
    expect(patchBody.data.title).toBe('Direct API Task 1 Updated');

    // 4. PATCH /api/tasks/bulk (ids array)
    const bulkRes = await request.patch(`${BASE_URL}/tasks/bulk`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        ids: [taskId, task2Id],
        action: 'complete',
      },
    });
    expect(bulkRes.status()).toBe(200);
    const bulkBody = await bulkRes.json();
    expect(bulkBody.success).toBe(true);

    // 5. DELETE /api/tasks/:id
    const delRes1 = await request.delete(`${BASE_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes1.status()).toBe(200);

    const delRes2 = await request.delete(`${BASE_URL}/tasks/${task2Id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes2.status()).toBe(200);
  });

  test('Users APIs: GET /me, PATCH /me, PATCH /me/password', async ({ request }) => {
    // 1. GET /api/users/me
    const getMeRes = await request.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getMeRes.status()).toBe(200);
    const getMeBody = await getMeRes.json();
    expect(getMeBody.success).toBe(true);
    expect(getMeBody.data.email).toBe(testUser.email);

    // 2. PATCH /api/users/me (update profile)
    const patchMeRes = await request.patch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Direct API Updated Name' },
    });
    expect(patchMeRes.status()).toBe(200);
    const patchMeBody = await patchMeRes.json();
    expect(patchMeBody.data.name).toBe('Direct API Updated Name');

    // 3. PATCH /api/users/me/password
    const patchPassRes = await request.patch(`${BASE_URL}/users/me/password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        currentPassword: testUser.password,
        newPassword: 'BrandNewApiPassword123!',
      },
    });
    expect(patchPassRes.status()).toBe(200);
    const patchPassBody = await patchPassRes.json();
    expect(patchPassBody.success).toBe(true);
  });

  test('Health APIs: GET /health, /readiness, /liveness', async ({ request }) => {
    // 1. GET /api/health
    const healthRes = await request.get(`${BASE_URL}/health`);
    expect(healthRes.status()).toBe(200);
    const healthBody = await healthRes.json();
    expect(healthBody.success).toBe(true);
    expect(healthBody.status).toBe('ok');
    expect(healthBody.database.status).toBe('connected');

    // 2. GET /api/health/readiness
    const readyRes = await request.get(`${BASE_URL}/health/readiness`);
    expect(readyRes.status()).toBe(200);
    const readyBody = await readyRes.json();
    expect(readyBody.status).toBe('ready');

    // 3. GET /api/health/liveness
    const liveRes = await request.get(`${BASE_URL}/health/liveness`);
    expect(liveRes.status()).toBe(200);
    const liveBody = await liveRes.json();
    expect(liveBody.status).toBe('ok');
  });
});
