import { api } from './apiClient'
import type { CreateTodoInput, Priority, TaskCategory, Todo, UpdateTodoInput } from '../types/todo'

export interface BackendTaskDoc {
  _id: string
  title: string
  completed: boolean
  priority?: Priority
  category?: string
  dueDate?: string | null
  userId: string
  createdAt?: string
  updatedAt?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  count?: number
}

export function mapBackendTaskToTodo(doc: BackendTaskDoc): Todo {
  let dueDate: string | undefined = undefined
  if (doc.dueDate) {
    // Keep YYYY-MM-DD for date-picker and filter compatibility
    dueDate = doc.dueDate.split('T')[0]
  }

  return {
    id: doc._id,
    todo: doc.title,
    completed: doc.completed,
    userId: doc.userId,
    priority: doc.priority || 'medium',
    category: (doc.category || 'General') as TaskCategory,
    dueDate,
    createdAt: doc.createdAt,
  }
}

/**
 * Fetches all tasks owned by the authenticated user from the backend
 */
export async function fetchTodos(): Promise<Todo[]> {
  const response = await api.get<ApiResponse<BackendTaskDoc[]>>('/tasks')
  if (!response.data || !Array.isArray(response.data)) {
    return []
  }
  return response.data.map(mapBackendTaskToTodo)
}

/**
 * Creates a new task bound to the authenticated user on the backend
 */
export async function addTodo(input: string | CreateTodoInput): Promise<Todo> {
  const title = typeof input === 'string' ? input.trim() : input.todo.trim()
  const priority = typeof input === 'object' && input.priority ? input.priority : 'medium'
  const category = typeof input === 'object' && input.category ? input.category : 'General'

  let dueDate: string | null = null
  if (typeof input === 'object' && input.dueDate && input.dueDate.trim() !== '') {
    const parsed = new Date(input.dueDate)
    dueDate = !isNaN(parsed.getTime()) ? parsed.toISOString() : null
  }

  const payload = {
    title,
    priority,
    category,
    dueDate,
  }

  const response = await api.post<ApiResponse<BackendTaskDoc>>('/tasks', payload)
  return mapBackendTaskToTodo(response.data)
}

/**
 * Updates a task owned by the authenticated user
 */
export async function updateTodo(id: string | number, updates: UpdateTodoInput): Promise<Todo> {
  const payload: Record<string, unknown> = {}

  if (updates.todo !== undefined) {
    payload.title = updates.todo
  }
  if (updates.completed !== undefined) {
    payload.completed = updates.completed
  }
  if (updates.priority !== undefined) {
    payload.priority = updates.priority
  }
  if (updates.category !== undefined) {
    payload.category = updates.category
  }
  if (updates.dueDate !== undefined) {
    if (updates.dueDate && updates.dueDate.trim() !== '') {
      const parsed = new Date(updates.dueDate)
      payload.dueDate = !isNaN(parsed.getTime()) ? parsed.toISOString() : null
    } else {
      payload.dueDate = null
    }
  }

  const response = await api.patch<ApiResponse<BackendTaskDoc>>(`/tasks/${id}`, payload)
  return mapBackendTaskToTodo(response.data)
}

/**
 * Deletes a task owned by the authenticated user
 */
export async function deleteTodo(id: string | number): Promise<void> {
  await api.delete(`/tasks/${id}`)
}

/**
 * Clears all completed tasks for the current user
 */
export async function clearCompleted(): Promise<void> {
  const todos = await fetchTodos()
  const completedTasks = todos.filter((t) => t.completed)
  await Promise.all(completedTasks.map((t) => deleteTodo(t.id)))
}

/**
 * Refreshes tasks directly from the MongoDB backend
 */
export async function resetFromApi(): Promise<Todo[]> {
  return fetchTodos()
}

/**
 * Performs bulk actions (complete, activate, delete) on multiple tasks
 */
export async function bulkTaskApi(
  ids: (string | number)[],
  action: 'complete' | 'activate' | 'delete'
): Promise<{ count: number }> {
  const stringIds = ids.map(String)
  const response = await api.patch<{ success: boolean; count: number; message: string }>('/tasks/bulk', {
    ids: stringIds,
    action,
  })
  return { count: response.count }
}

