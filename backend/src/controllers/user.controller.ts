import type { Request, Response, NextFunction } from 'express'
import { userService } from '../services/user.service.js'
import { AppError } from '../utils/appError.js'

function getAuthenticatedUserId(req: Request): string {
  if (!req.user || !req.user.userId) {
    throw AppError.unauthorized('Authentication required')
  }
  return req.user.userId
}

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const user = await userService.getProfile(userId)
    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const updated = await userService.updateProfile(userId, req.body)
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const result = await userService.changePassword(userId, req.body)
    res.status(200).json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    next(error)
  }
}
