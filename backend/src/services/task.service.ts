import { Task, type ITask } from '../models/task.model.js'
import type { BulkTaskInput, CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema.js'
import { AppError } from '../utils/appError.js'
import mongoose from 'mongoose'

export interface TaskFilterOptions {
  completed?: boolean
  priority?: string
  category?: string
}

export class TaskService {
  /**
   * Retrieves all tasks belonging strictly to the authenticated user
   */
  async getTasks(userId: string, filter: TaskFilterOptions = {}): Promise<ITask[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    }

    if (filter.completed !== undefined) {
      query.completed = filter.completed
    }
    if (filter.priority) {
      query.priority = filter.priority
    }
    if (filter.category) {
      query.category = filter.category
    }

    return Task.find(query).sort({ createdAt: -1 }).exec()
  }

  /**
   * Retrieves a single task by ID for the authenticated user only
   */
  async getTaskById(id: string, userId: string): Promise<ITask> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest(`Invalid task ID: ${id}`)
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec()

    if (!task) {
      throw AppError.notFound('Task not found')
    }

    return task
  }

  /**
   * Creates a new task bound to the authenticated user
   */
  async createTask(data: CreateTaskInput, userId: string): Promise<ITask> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const task = new Task({
      title: data.title,
      priority: data.priority,
      category: data.category,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      userId: new mongoose.Types.ObjectId(userId),
    })

    return task.save()
  }

  /**
   * Updates a task belonging to the authenticated user
   */
  async updateTask(id: string, data: UpdateTaskInput, userId: string): Promise<ITask> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest(`Invalid task ID: ${id}`)
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const updatePayload: Record<string, unknown> = {}
    if (data.title !== undefined) updatePayload.title = data.title
    if (data.completed !== undefined) updatePayload.completed = data.completed
    if (data.priority !== undefined) updatePayload.priority = data.priority
    if (data.category !== undefined) updatePayload.category = data.category
    if (data.dueDate !== undefined) {
      updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }

    const updated = await Task.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      updatePayload,
      {
        new: true,
        runValidators: true,
      }
    ).exec()

    if (!updated) {
      throw AppError.notFound('Task not found')
    }

    return updated
  }

  /**
   * Deletes a task belonging to the authenticated user
   */
  async deleteTask(id: string, userId: string): Promise<ITask> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest(`Invalid task ID: ${id}`)
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const deleted = await Task.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec()

    if (!deleted) {
      throw AppError.notFound('Task not found')
    }

    return deleted
  }

  /**
   * Performs bulk actions (complete, activate, delete) strictly on tasks owned by the authenticated user
   */
  async bulkTaskAction(
    userId: string,
    input: BulkTaskInput
  ): Promise<{ count: number }> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)
    const taskObjectIds = input.ids.map((id) => new mongoose.Types.ObjectId(id))

    if (input.action === 'delete') {
      const result = await Task.deleteMany({
        _id: { $in: taskObjectIds },
        userId: userObjectId,
      }).exec()
      return { count: result.deletedCount }
    }

    if (input.action === 'complete') {
      const result = await Task.updateMany(
        {
          _id: { $in: taskObjectIds },
          userId: userObjectId,
        },
        { $set: { completed: true } }
      ).exec()
      return { count: result.modifiedCount }
    }

    if (input.action === 'activate') {
      const result = await Task.updateMany(
        {
          _id: { $in: taskObjectIds },
          userId: userObjectId,
        },
        { $set: { completed: false } }
      ).exec()
      return { count: result.modifiedCount }
    }

    throw AppError.badRequest('Unsupported bulk action')
  }
}

export const taskService = new TaskService()
