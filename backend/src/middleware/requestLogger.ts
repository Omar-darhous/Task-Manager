import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

/**
 * Lightweight HTTP request logging middleware.
 * Records method, path, HTTP status, and duration in ms.
 * Quiets frequent polling on health endpoints to avoid log spam.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const durationMs = Number((end - start) / 1_000_000n)

    // Skip successful health check polling from regular logs to avoid noise
    const isHealthEndpoint = req.path.startsWith('/api/health')
    if (isHealthEndpoint && res.statusCode < 400) {
      return
    }

    const logMessage = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`

    if (res.statusCode >= 500) {
      logger.error(logMessage)
    } else if (res.statusCode >= 400) {
      logger.warn(logMessage)
    } else {
      logger.info(logMessage)
    }
  })

  next()
}
