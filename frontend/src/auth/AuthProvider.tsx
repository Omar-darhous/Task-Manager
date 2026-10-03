import { useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AuthContextType, LoginCredentials, RegisterCredentials, User } from './auth.types'
import { authStorage } from './auth.storage'
import { getMeApi, loginApi, registerApi } from './auth.api'
import { AuthContext } from './auth.context'
import { setUnauthorizedHandler } from '../services/apiClient'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => authStorage.getToken())
  const [user, setUser] = useState<User | null>(() => authStorage.getUser())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Verify and hydrate current user on initial mount if token exists
  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      const storedToken = authStorage.getToken()
      if (!storedToken) {
        if (isMounted) {
          setUser(null)
          setToken(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const currentUser = await getMeApi()
        if (isMounted) {
          setUser(currentUser)
          setToken(storedToken)
          authStorage.setUser(currentUser)
        }
      } catch {
        // Token expired or invalid
        if (isMounted) {
          authStorage.clear()
          setUser(null)
          setToken(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [])

  // Global 401 unauthorized eviction listener
  useEffect(() => {
    const handleUnauthorized = () => {
      authStorage.clear()
      setToken(null)
      setUser(null)
    }

    setUnauthorizedHandler(handleUnauthorized)
    window.addEventListener('taskflow:unauthorized', handleUnauthorized)

    return () => {
      setUnauthorizedHandler(null)
      window.removeEventListener('taskflow:unauthorized', handleUnauthorized)
    }
  }, [])

  // Cross-tab authentication synchronization via window 'storage' event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.storageArea && e.storageArea !== localStorage) {
        return
      }

      // If clear() was called in another tab
      if (e.key === null) {
        setToken(null)
        setUser(null)
        return
      }

      if (e.key === 'taskflow_auth_token') {
        if (!e.newValue) {
          // Token removed in another tab (logout)
          setToken(null)
          setUser(null)
        } else {
          // Token updated in another tab
          setToken(e.newValue)
          const updatedUser = authStorage.getUser()
          if (updatedUser) {
            setUser(updatedUser)
          }
        }
      } else if (e.key === 'taskflow_auth_user') {
        if (!e.newValue) {
          setUser(null)
        } else {
          try {
            const parsedUser = JSON.parse(e.newValue) as User
            setUser(parsedUser)
          } catch {
            setUser(null)
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const data = await loginApi(credentials)
    authStorage.setToken(data.token)
    authStorage.setUser(data.user)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const data = await registerApi(credentials)
    authStorage.setToken(data.token)
    authStorage.setUser(data.user)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    authStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    authStorage.setUser(updatedUser)
    setUser(updatedUser)
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
