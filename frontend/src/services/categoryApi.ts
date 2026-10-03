import { api } from './apiClient'

export interface BackendCategory {
  _id: string
  name: string
  userId: string
  createdAt?: string
  updatedAt?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  count?: number
  data: T
}

/**
 * Fetches all categories belonging to the current user
 */
export async function fetchCategoriesApi(): Promise<BackendCategory[]> {
  const response = await api.get<ApiResponse<BackendCategory[]>>('/categories')
  return response.data || []
}

/**
 * Creates a new category for the current user
 */
export async function createCategoryApi(name: string): Promise<BackendCategory> {
  const response = await api.post<ApiResponse<BackendCategory>>('/categories', { name })
  return response.data
}

/**
 * Renames a category for the current user
 */
export async function updateCategoryApi(id: string, name: string): Promise<BackendCategory> {
  const response = await api.patch<ApiResponse<BackendCategory>>(`/categories/${id}`, { name })
  return response.data
}

/**
 * Deletes a category for the current user (reassigning tasks to General on the backend)
 */
export async function deleteCategoryApi(id: string): Promise<void> {
  await api.delete(`/categories/${id}`)
}
