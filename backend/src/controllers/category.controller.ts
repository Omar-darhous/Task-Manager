import type { Request, Response, NextFunction } from 'express'
import { categoryService } from '../services/category.service.js'
import { AppError } from '../utils/appError.js'

function getAuthenticatedUserId(req: Request): string {
  if (!req.user || !req.user.userId) {
    throw AppError.unauthorized('Authentication required')
  }
  return req.user.userId
}

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const categories = await categoryService.getCategories(userId)
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const category = await categoryService.createCategory(req.body, userId)
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    })
  } catch (error) {
    next(error)
  }
}

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const { id } = req.params as { id: string }
    const category = await categoryService.updateCategory(id, req.body, userId)
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const { id } = req.params as { id: string }
    await categoryService.deleteCategory(id, userId)
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
