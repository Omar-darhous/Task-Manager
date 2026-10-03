import { authStorage } from '../auth/auth.storage'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:5000/api'

export class ApiError extends Error {
  public statusCode: number
  public errors?: Array<{ field?: string; message: string }>

  constructor(message: string, statusCode: number, errors?: Array<{ field?: string; message: string }>) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

export type UnauthorizedHandler = () => void
let onUnauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorizedHandler = handler
}

function handleUnauthorizedSession(endpoint: string, responseData: unknown): void {
  const isAuthEndpoint =
    endpoint.endsWith('/auth/login') ||
    endpoint.endsWith('/auth/register') ||
    endpoint === '/auth/login' ||
    endpoint === '/auth/register'

  if (isAuthEndpoint) {
    return
  }

  // If changing password and current password was wrong, don't evict session
  if (endpoint.includes('/users/me/password')) {
    if (responseData && typeof responseData === 'object') {
      const errObj = responseData as { message?: string; error?: { message?: string } }
      const msg = errObj.error?.message || errObj.message
      if (msg && msg.toLowerCase().includes('current password')) {
        return
      }
    }
  }

  // Clear authentication storage immediately
  authStorage.clear()

  // Notify registered handler (e.g. AuthProvider)
  if (onUnauthorizedHandler) {
    try {
      onUnauthorizedHandler()
    } catch (err) {
      console.error('Error executing unauthorized handler:', err)
    }
  }

  // Dispatch custom event for cross-component notification
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('taskflow:unauthorized'))
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const token = authStorage.getToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError('Unable to connect to the server. Please check your network connection.', 0)
  }

  let responseData: unknown
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json()
    } catch {
      responseData = null
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorizedSession(endpoint, responseData)
    }
    let errorMessage = `Request failed with status ${response.status}`
    let errors: Array<{ field?: string; message: string }> | undefined

    if (responseData && typeof responseData === 'object') {
      const errObj = responseData as {
        message?: string
        error?: { code?: string; message?: string; errors?: Array<{ field?: string; message: string }> }
        errors?: Array<{ field?: string; message: string }>
      }
      if (errObj.error?.message) {
        errorMessage = errObj.error.message
      } else if (errObj.message) {
        errorMessage = errObj.message
      }

      if (Array.isArray(errObj.error?.errors)) {
        errors = errObj.error.errors
      } else if (Array.isArray(errObj.errors)) {
        errors = errObj.errors
      }
    } else {
      if (response.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.'
      } else if (response.status === 404) {
        errorMessage = 'The requested resource was not found.'
      } else if (response.status >= 500) {
        errorMessage = 'A server error occurred. Please try again later.'
      }
    }

    throw new ApiError(errorMessage, response.status, errors)
  }

  return responseData as T
}

export const api = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'GET' })
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },
  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },
  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'DELETE' })
  },
}
