import type { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'
import { AppError } from '../utils/appError.js'

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.register(req.body)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required')
    }

    const user = await authService.getCurrentUser(req.user.userId)
    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}
