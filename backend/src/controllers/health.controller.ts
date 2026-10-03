import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from '../config/environment.js'

let cachedAppVersion = '1.0.0'
try {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const pkgPath = path.resolve(currentDir, '../../package.json')
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string }
    if (pkg.version) cachedAppVersion = pkg.version
  }
} catch {
  // Use default if package.json cannot be read
}

export function getAppVersion(): string {
  return cachedAppVersion
}

export function getDatabaseState(): string {
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }
  return dbStatusMap[mongoose.connection.readyState] || 'unknown'
}

/**
 * General health check endpoint.
 * GET /api/health
 */
export const getHealth = (_req: Request, res: Response): void => {
  const dbState = getDatabaseState()
  const uptime = Math.floor(process.uptime())

  res.status(200).json({
    status: 'ok',
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: cachedAppVersion,
    uptime,
    database: {
      status: dbState,
    },
  })
}

/**
 * Readiness endpoint: indicates whether the app is ready to accept traffic.
 * Requires MongoDB connection to be established.
 * GET /api/health/readiness
 */
export const getReadiness = (_req: Request, res: Response): void => {
  const dbState = getDatabaseState()
  const isDbConnected = mongoose.connection.readyState === 1
  const uptime = Math.floor(process.uptime())

  if (!isDbConnected) {
    res.status(503).json({
      status: 'not_ready',
      database: dbState,
      message: 'Database connection is unavailable',
      version: cachedAppVersion,
      uptime,
      timestamp: new Date().toISOString(),
    })
    return
  }

  res.status(200).json({
    status: 'ready',
    database: dbState,
    version: cachedAppVersion,
    uptime,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Liveness endpoint: indicates whether the Node process is running.
 * Does not require external dependencies like database to be active.
 * GET /api/health/liveness
 */
export const getLiveness = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    version: cachedAppVersion,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  })
}
