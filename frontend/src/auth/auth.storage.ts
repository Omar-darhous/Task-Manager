import type { User } from './auth.types'

const TOKEN_KEY = 'taskflow_auth_token'
const USER_KEY = 'taskflow_auth_user'

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch (err) {
      console.error('Failed to save auth token to localStorage:', err)
    }
  },

  getUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (!raw) return null
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  },

  setUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (err) {
      console.error('Failed to save user info to localStorage:', err)
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch (err) {
      console.error('Failed to clear auth from localStorage:', err)
    }
  },
}
