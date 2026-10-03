import type { Request, Response, NextFunction } from 'express'
import { taskService } from '../services/task.service.js'
import { AppError } from '../utils/appError.js'

function getAuthenticatedUserId(req: Request): string {
  if (!req.user || !req.user.userId) {
    throw AppError.unauthorized('Authentication required')
  }
  return req.user.userId
}

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const { completed, priority, category } = req.query
    const tasks = await taskService.getTasks(userId, {
      completed: completed !== undefined ? completed === 'true' : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      category: typeof category === 'string' ? category : undefined,
    })

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    })
  } catch (error) {
    next(error)
  }
}

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const { id } = req.params as { id: string }
    const task = await taskService.getTaskById(id, userId)
    res.status(200).json({
      success: true,
      data: task,
    })
  } catch (error) {
    next(error)
  }
}

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const task = await taskService.createTask(req.body, userId)
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    })
  } catch (error) {
    next(error)
  }
}

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const { id } = req.params as { id: string }
    const updated = await taskService.updateTask(id, req.body, userId)
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const { id } = req.params as { id: string }
    await taskService.deleteTask(id, userId)
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const bulkTaskAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req)
    const result = await taskService.bulkTaskAction(userId, req.body)
    res.status(200).json({
      success: true,
      count: result.count,
      message: `Bulk action '${req.body.action}' completed successfully on ${result.count} tasks`,
    })
  } catch (error) {
    next(error)
  }
}

