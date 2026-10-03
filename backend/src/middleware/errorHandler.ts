import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import mongoose from 'mongoose'
import { AppError } from '../utils/appError.js'
import { env } from '../config/environment.js'
import { logger } from '../utils/logger.js'

function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
      return 'CONFLICT'
    case 422:
      return 'UNPROCESSABLE_ENTITY'
    case 429:
      return 'TOO_MANY_REQUESTS'
    case 500:
    default:
      return 'INTERNAL_SERVER_ERROR'
  }
}

export const notFoundHandler = (req: Request, res: Response): void => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`
  res.status(404).json({
    success: false,
    message,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  })
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = 500
  let errorCode = 'INTERNAL_SERVER_ERROR'
  let message = 'Internal server error'
  let errors: unknown[] | undefined

  if (err instanceof AppError) {
    statusCode = err.statusCode
    errorCode = getErrorCodeFromStatus(err.statusCode)
    message = err.message
    errors = err.errors
  } else if (err instanceof ZodError) {
    statusCode = 400
    errorCode = 'VALIDATION_ERROR'
    message = 'Validation failed'
    errors = err.errors.map((issue) => ({
      field: issue.path.slice(1).join('.'),
      message: issue.message,
    }))
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    errorCode = 'INVALID_FORMAT'
    message = `Invalid format for field '${err.path}'`
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    errorCode = 'VALIDATION_ERROR'
    message = 'Database validation error'
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
  } else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  ) {
    statusCode = 409
    errorCode = 'DUPLICATE_RESOURCE'
    message = 'Duplicate key error: A resource with that unique field already exists'
  } else if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: unknown }).status === 400
  ) {
    statusCode = 400
    errorCode = 'MALFORMED_JSON'
    message = 'Malformed JSON body in request'
  } else if (err instanceof Error) {
    statusCode = 500
    errorCode = 'INTERNAL_SERVER_ERROR'
    const isProduction = env.NODE_ENV === 'production'
    message = isProduction ? 'An unexpected error occurred.' : err.message
    logger.error('Unhandled server error:', {
      message: err.message,
      stack: isProduction ? undefined : err.stack,
    })
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    message,
    error: {
      code: errorCode,
      message,
      ...(errors && errors.length > 0 ? { errors } : {}),
      ...(env.NODE_ENV !== 'production' && err instanceof Error && err.stack
        ? { stack: err.stack }
        : {}),
    },
  }

  if (errors && errors.length > 0) {
    responseBody.errors = errors
  }

  res.status(statusCode).json(responseBody)
}
