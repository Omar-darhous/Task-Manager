import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { User, type IUser } from '../models/user.model.js'
import type { SafeUser } from './auth.service.js'
import type { ChangePasswordInput, UpdateProfileInput } from '../schemas/user.schema.js'
import { AppError } from '../utils/appError.js'

function formatSafeUser(userDoc: IUser): SafeUser {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  }
}

export class UserService {
  /**
   * Retrieves current authenticated user profile
   */
  async getProfile(userId: string): Promise<SafeUser> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const user = await User.findById(userId).exec()
    if (!user) {
      throw AppError.notFound('User not found')
    }

    return formatSafeUser(user)
  }

  /**
   * Updates user profile (name and/or email). Enforces uniqueness and prevents tampering with protected fields.
   */
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<SafeUser> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)
    const updatePayload: Record<string, string> = {}

    if (data.name !== undefined) {
      updatePayload.name = data.name.trim()
    }

    if (data.email !== undefined) {
      const normalizedEmail = data.email.trim().toLowerCase()

      // Check if email already in use by another user
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userObjectId },
      }).exec()

      if (existing) {
        throw AppError.conflict('An account with this email address already exists')
      }

      updatePayload.email = normalizedEmail
    }

    const updatedUser = await User.findByIdAndUpdate(
      userObjectId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).exec()

    if (!updatedUser) {
      throw AppError.notFound('User not found')
    }

    return formatSafeUser(updatedUser)
  }

  /**
   * Updates user password after verifying existing password with bcrypt.
   */
  async changePassword(userId: string, data: ChangePasswordInput): Promise<{ message: string }> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.unauthorized('Invalid user ID')
    }

    const user = await User.findById(userId).select('+passwordHash').exec()
    if (!user) {
      throw AppError.notFound('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      throw AppError.unauthorized('Current password is incorrect')
    }

    // Hash new password using 12 salt rounds
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(data.newPassword, saltRounds)

    user.passwordHash = newPasswordHash
    await user.save()

    return { message: 'Password updated successfully' }
  }
}

export const userService = new UserService()
