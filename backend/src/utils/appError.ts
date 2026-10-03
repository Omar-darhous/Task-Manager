export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly errors?: unknown[]

  constructor(message: string, statusCode = 500, errors?: unknown[]) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.errors = errors

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message: string, errors?: unknown[]): AppError {
    return new AppError(message, 400, errors)
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401)
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, 403)
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404)
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409)
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500)
  }
}
