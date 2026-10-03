import { Category, type ICategory } from '../models/category.model.js'
import { Task } from '../models/task.model.js'
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema.js'
import { AppError } from '../utils/appError.js'
import mongoose from 'mongoose'

export class CategoryService {
  /**
   * Retrieves all categories belonging strictly to the authenticated user
   */
  async getCategories(userId: string): Promise<ICategory[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    return Category.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ name: 1 })
      .exec()
  }

  /**
   * Creates a category for the authenticated user, enforcing unique category name per user
   */
  async createCategory(data: CreateCategoryInput, userId: string): Promise<ICategory> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const trimmedName = data.name.trim()
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const existing = await Category.findOne({
      name: trimmedName,
      userId: userObjectId,
    }).exec()

    if (existing) {
      throw AppError.conflict(`Category '${trimmedName}' already exists`)
    }

    const category = new Category({
      name: trimmedName,
      userId: userObjectId,
    })

    return category.save()
  }

  /**
   * Updates a category name for the owner, preventing duplicate names for the same user,
   * and updating any tasks that were tagged with the old category name.
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryInput,
    userId: string
  ): Promise<ICategory> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest(`Invalid category ID: ${id}`)
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const trimmedName = data.name.trim()
    const categoryObjectId = new mongoose.Types.ObjectId(id)
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const targetCategory = await Category.findOne({
      _id: categoryObjectId,
      userId: userObjectId,
    }).exec()

    if (!targetCategory) {
      throw AppError.notFound('Category not found')
    }

    // Check duplicate name for the same user (excluding current category)
    const duplicate = await Category.findOne({
      name: trimmedName,
      userId: userObjectId,
      _id: { $ne: categoryObjectId },
    }).exec()

    if (duplicate) {
      throw AppError.conflict(`Category '${trimmedName}' already exists`)
    }

    const oldName = targetCategory.name
    targetCategory.name = trimmedName
    const updated = await targetCategory.save()

    // Cascade update to tasks that used the old category name
    if (oldName !== trimmedName) {
      await Task.updateMany(
        { userId: userObjectId, category: oldName },
        { $set: { category: trimmedName } }
      ).exec()
    }

    return updated
  }

  /**
   * Deletes a category belonging strictly to the authenticated user.
   * Reassigns any affected tasks to the default 'General' category so references are never broken.
   */
  async deleteCategory(id: string, userId: string): Promise<ICategory> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest(`Invalid category ID: ${id}`)
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const categoryObjectId = new mongoose.Types.ObjectId(id)
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const targetCategory = await Category.findOne({
      _id: categoryObjectId,
      userId: userObjectId,
    }).exec()

    if (!targetCategory) {
      throw AppError.notFound('Category not found')
    }

    // If deleting category, reassign all tasks from this category to 'General'
    await Task.updateMany(
      { userId: userObjectId, category: targetCategory.name },
      { $set: { category: 'General' } }
    ).exec()

    await targetCategory.deleteOne()

    return targetCategory
  }
}

export const categoryService = new CategoryService()
