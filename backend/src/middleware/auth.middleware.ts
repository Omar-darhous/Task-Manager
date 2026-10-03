import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/appError.js'
import { verifyJwt, type JwtUserPayload } from '../utils/jwt.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload
    }
  }
}

/**
 * Middleware that validates the Authorization Bearer JWT header
 * and attaches the authenticated user to req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return next(AppError.unauthorized('Authentication token is required'))
  }

  const parts = authHeader.trim().split(/\s+/)
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next(
      AppError.unauthorized('Invalid authorization header format. Expected "Bearer <token>"')
    )
  }

  const token = parts[1]

  try {
    const payload = verifyJwt(token)
    req.user = payload
    next()
  } catch (error) {
    next(error)
  }
}
