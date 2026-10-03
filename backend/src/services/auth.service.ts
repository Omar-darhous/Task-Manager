import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { User, type IUser } from '../models/user.model.js'
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js'
import { AppError } from '../utils/appError.js'
import { signJwt } from '../utils/jwt.js'

export interface SafeUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export interface AuthResult {
  user: SafeUser
  token: string
}

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

export class AuthService {
  /**
   * Registers a new user with hashed password and generates a JWT
   */
  async register(data: RegisterInput): Promise<AuthResult> {
    const normalizedEmail = data.email.trim().toLowerCase()

    const existingUser = await User.findOne({ email: normalizedEmail }).exec()
    if (existingUser) {
      throw AppError.conflict('An account with this email address already exists')
    }

    const saltRounds = 12
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    const user = new User({
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    })

    await user.save()

    const token = signJwt({
      userId: user._id.toString(),
      role: user.role,
    })

    return {
      user: formatSafeUser(user),
      token,
    }
  }

  /**
   * Validates user credentials and returns safe user data with a signed JWT.
   * Throws a generic unauthorized error on invalid email or password.
   */
  async login(data: LoginInput): Promise<AuthResult> {
    const normalizedEmail = data.email.trim().toLowerCase()

    const user = await User.findOne({ email: normalizedEmail })
      .select('+passwordHash')
      .exec()

    // Constant-time mitigation: compare against dummy hash if user not found
    const dummyHash = '$2a$12$e80yq9gP8ZzP42aZ4Rj80.pU/t/b8qF6j4tI6t2f8rCg6n5K2v3Oa'
    const hashToCompare = user ? user.passwordHash : dummyHash
    const isPasswordValid = await bcrypt.compare(data.password, hashToCompare)

    if (!user || !isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password')
    }

    const token = signJwt({
      userId: user._id.toString(),
      role: user.role,
    })

    return {
      user: formatSafeUser(user),
      token,
    }
  }

  /**
   * Retrieves safe user info by user ID
   */
  async getCurrentUser(userId: string): Promise<SafeUser> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw AppError.badRequest(`Invalid user ID: ${userId}`)
    }

    const user = await User.findById(userId).exec()
    if (!user) {
      throw AppError.notFound('User not found')
    }

    return formatSafeUser(user)
  }
}

export const authService = new AuthService()
