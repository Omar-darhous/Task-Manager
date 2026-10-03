import app from '../src/app.js'
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { validateEnvironment } from '../src/config/environment.js'
import { sanitizeLogData } from '../src/utils/logger.js'
import type { Server } from 'http'
import mongoose from 'mongoose'

const TEST_PORT = 5097
const BASE_URL = `http://localhost:${TEST_PORT}/api`

async function runPhase13Tests() {
  console.log('--- STARTING PHASE 13 PRODUCTION READINESS & HEALTH TEST SUITE ---')

  let server: Server | null = null

  try {
    // Connect DB & start test server
    await connectDatabase()
    server = app.listen(TEST_PORT)
    console.log(`Test server running on port ${TEST_PORT}`)

    // 1. Health check test
    console.log('\n[1/10] Testing GET /api/health ...')
    const healthRes = await fetch(`${BASE_URL}/health`)
    const healthData = (await healthRes.json()) as {
      status?: string
      version?: string
      environment?: string
      uptime?: number
      database?: { status?: string }
    }
    console.log('Health status:', healthRes.status, 'Response:', JSON.stringify(healthData))
    if (healthRes.status !== 200 || healthData.status !== 'ok') {
      throw new Error(`Expected status 200 and status 'ok', got ${healthRes.status}`)
    }
    if (!healthData.version || typeof healthData.uptime !== 'number') {
      throw new Error('Health check missing version or uptime')
    }
    if (healthData.database?.status !== 'connected') {
      throw new Error(`Expected database status 'connected', got ${healthData.database?.status}`)
    }

    // 2. Readiness check test (healthy)
    console.log('\n[2/10] Testing GET /api/health/readiness (DB connected) ...')
    const readinessRes = await fetch(`${BASE_URL}/health/readiness`)
    const readinessData = (await readinessRes.json()) as {
      status?: string
      database?: string
      version?: string
    }
    console.log('Readiness status:', readinessRes.status, 'Response:', JSON.stringify(readinessData))
    if (readinessRes.status !== 200 || readinessData.status !== 'ready') {
      throw new Error(`Expected status 200 and status 'ready', got ${readinessRes.status}`)
    }
    if (readinessData.database !== 'connected') {
      throw new Error(`Expected database 'connected', got ${readinessData.database}`)
    }

    // 3. Liveness check test
    console.log('\n[3/10] Testing GET /api/health/liveness ...')
    const livenessRes = await fetch(`${BASE_URL}/health/liveness`)
    const livenessData = (await livenessRes.json()) as {
      status?: string
      uptime?: number
      version?: string
    }
    console.log('Liveness status:', livenessRes.status, 'Response:', JSON.stringify(livenessData))
    if (livenessRes.status !== 200 || livenessData.status !== 'ok') {
      throw new Error(`Expected status 200 and status 'ok', got ${livenessRes.status}`)
    }
    if (typeof livenessData.uptime !== 'number') {
      throw new Error('Liveness response missing uptime')
    }

    // 4. Clean JSON 404 test on unknown API route
    console.log('\n[4/10] Testing GET /api/unknown-route-for-testing ...')
    const notFoundRes = await fetch(`${BASE_URL}/unknown-route-for-testing`)
    const notFoundData = (await notFoundRes.json()) as {
      success?: boolean
      error?: { code?: string; message?: string }
    }
    console.log('404 status:', notFoundRes.status, 'Response:', JSON.stringify(notFoundData))
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 for unknown route, got ${notFoundRes.status}`)
    }
    if (notFoundData.success !== false || notFoundData.error?.code !== 'NOT_FOUND') {
      throw new Error('Expected structured 404 error with code NOT_FOUND')
    }

    // 5. Structured error format test on validation error
    console.log('\n[5/10] Testing POST /api/auth/register validation failure format ...')
    const badRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    })
    const badRegData = (await badRegRes.json()) as {
      success?: boolean
      error?: { code?: string; message?: string; errors?: unknown[] }
    }
    console.log('Validation status:', badRegRes.status, 'Error code:', badRegData.error?.code)
    if (badRegRes.status !== 400 || badRegData.error?.code !== 'VALIDATION_ERROR') {
      throw new Error('Expected 400 with VALIDATION_ERROR code')
    }
    if (!Array.isArray(badRegData.error?.errors) || badRegData.error.errors.length === 0) {
      throw new Error('Expected validation error details array')
    }

    // 6. Security headers check (Helmet)
    console.log('\n[6/10] Testing Security Headers (Helmet) ...')
    const xContentType = healthRes.headers.get('x-content-type-options')
    const xFrameOptions = healthRes.headers.get('x-frame-options')
    console.log('X-Content-Type-Options:', xContentType, 'X-Frame-Options:', xFrameOptions)
    if (xContentType !== 'nosniff') {
      throw new Error('Expected X-Content-Type-Options: nosniff')
    }

    // 7. Structured logger & sensitive data sanitization check
    console.log('\n[7/10] Testing Structured Logger Sanitization ...')
    const rawSensitiveData = {
      password: 'SuperSecretPassword123!',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature',
      nested: {
        authorization: 'Bearer secret_token',
        connectionString: 'mongodb+srv://adminUser:pAssWord123@cluster.mongodb.net/db',
        safeField: 'Hello World',
      },
    }
    const sanitized = sanitizeLogData(rawSensitiveData) as typeof rawSensitiveData
    console.log('Sanitized output:', JSON.stringify(sanitized))
    if (sanitized.password !== '[REDACTED]') {
      throw new Error('Password was not redacted')
    }
    if (sanitized.token !== '[REDACTED]') {
      throw new Error('Token was not redacted')
    }
    if (sanitized.nested.authorization !== '[REDACTED]') {
      throw new Error('Authorization was not redacted')
    }
    if (sanitized.nested.connectionString.includes('pAssWord123')) {
      throw new Error('MongoDB password was not masked')
    }
    if (sanitized.nested.safeField !== 'Hello World') {
      throw new Error('Safe field was improperly altered')
    }

    // 8. Production environment configuration validation: missing MONGODB_URI
    console.log('\n[8/10] Testing Environment Validation (Production Missing MONGODB_URI) ...')
    const prodMissingDb = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '5000',
      JWT_SECRET: 'a_very_long_secure_production_secret_key_12345',
      CLIENT_URL: 'https://app.taskflow.com',
      // MONGODB_URI missing
    })
    console.log('Prod missing DB validation success:', prodMissingDb.success)
    if (prodMissingDb.success || !prodMissingDb.errors?.MONGODB_URI) {
      throw new Error('Validation should fail when MONGODB_URI is missing in production')
    }

    // 9. Production environment configuration validation: weak/placeholder JWT_SECRET
    console.log('\n[9/10] Testing Environment Validation (Production Weak JWT_SECRET) ...')
    const prodWeakSecret = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '5000',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/db',
      CLIENT_URL: 'https://app.taskflow.com',
      JWT_SECRET: 'short_secret',
    })
    console.log('Prod weak secret validation success:', prodWeakSecret.success)
    if (prodWeakSecret.success || !prodWeakSecret.errors?.JWT_SECRET) {
      throw new Error('Validation should fail when JWT_SECRET is too short in production')
    }

    // 10. Valid production environment configuration
    console.log('\n[10/10] Testing Valid Production Environment Configuration ...')
    const validProd = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '5000',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/db',
      CLIENT_URL: 'https://app.taskflow.com',
      JWT_SECRET: 'a_very_long_secure_production_secret_key_1234567890',
    })
    console.log('Valid prod validation success:', validProd.success)
    if (!validProd.success) {
      throw new Error(`Expected valid prod config to pass: ${JSON.stringify(validProd.errors)}`)
    }

    console.log('\n=============================================')
    console.log('>>> ALL 10 PHASE 13 READINESS TESTS PASSED! <<<')
    console.log('=============================================\n')
  } finally {
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve())
      })
    }
    await disconnectDatabase()
  }
}

void runPhase13Tests()
