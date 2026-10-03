import { api } from './apiClient'
import type { User } from '../auth/auth.types'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface UpdateProfileInput {
  name?: string
  email?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/**
 * Retrieves the current authenticated user's profile
 */
export async function getProfileApi(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/users/me')
  return response.data
}

/**
 * Updates the current user's profile name and/or email
 */
export async function updateProfileApi(data: UpdateProfileInput): Promise<User> {
  const response = await api.patch<ApiResponse<User>>('/users/me', data)
  return response.data
}

/**
 * Updates the user's password
 */
export async function changePasswordApi(data: ChangePasswordInput): Promise<{ message: string }> {
  const response = await api.patch<ApiResponse<null>>('/users/me/password', data)
  return { message: response.message || 'Password updated successfully' }
}
