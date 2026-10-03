import { api } from '../services/apiClient'
import type { AuthPayload, LoginCredentials, RegisterCredentials, User } from './auth.types'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthPayload> {
  const response = await api.post<ApiResponse<AuthPayload>>('/auth/login', credentials)
  return response.data
}

export async function registerApi(credentials: RegisterCredentials): Promise<AuthPayload> {
  const response = await api.post<ApiResponse<AuthPayload>>('/auth/register', credentials)
  return response.data
}

export async function getMeApi(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me')
  return response.data
}
