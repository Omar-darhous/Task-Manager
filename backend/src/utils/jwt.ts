import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/environment.js'
import { AppError } from './appError.js'

export interface JwtUserPayload {
  userId: string
  role: 'user' | 'admin'
}

/**
 * Signs a JWT with the minimal user payload (userId, role)
 */
export function signJwt(payload: JwtUserPayload, options?: SignOptions): string {
  const signOptions: SignOptions = {
    expiresIn: (env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'],
    ...options,
  }

  return jwt.sign(payload, env.JWT_SECRET, signOptions)
}

/**
 * Verifies a JWT and returns the typed payload.
 * Throws an AppError.unauthorized if the token is expired or invalid.
 */
export function verifyJwt(token: string): JwtUserPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & JwtUserPayload

    if (!decoded || typeof decoded !== 'object' || !decoded.userId || !decoded.role) {
      throw AppError.unauthorized('Invalid authentication token payload')
    }

    return {
      userId: decoded.userId,
      role: decoded.role,
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Authentication token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw AppError.unauthorized('Invalid authentication token')
    }
    throw AppError.unauthorized('Authentication failed')
  }
}
