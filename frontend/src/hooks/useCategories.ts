import { useState, useEffect, useCallback } from 'react'
import {
  fetchCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  type BackendCategory,
} from '../services/categoryApi'
import { useAuth } from '../auth/useAuth'

export function useCategories() {
  const { isAuthenticated } = useAuth()
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    if (!isAuthenticated) {
      setCategories([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchCategoriesApi()
      setCategories(data)
    } catch {
      setError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    let ignore = false

    async function initialFetch() {
      if (!isAuthenticated) {
        setCategories([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await fetchCategoriesApi()
        if (!ignore) {
          setCategories(data)
        }
      } catch {
        if (!ignore) {
          setError('Failed to load categories.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    initialFetch()

    return () => {
      ignore = true
    }
  }, [isAuthenticated])

  const addCategory = async (name: string): Promise<BackendCategory> => {
    const trimmed = name.trim()
    const created = await createCategoryApi(trimmed)
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }

  const renameCategory = async (id: string, name: string): Promise<BackendCategory> => {
    const trimmed = name.trim()
    const updated = await updateCategoryApi(id, trimmed)
    setCategories((prev) =>
      prev
        .map((cat) => (cat._id === id ? updated : cat))
        .sort((a, b) => a.name.localeCompare(b.name))
    )
    return updated
  }

  const removeCategory = async (id: string): Promise<void> => {
    await deleteCategoryApi(id)
    setCategories((prev) => prev.filter((cat) => cat._id !== id))
  }

  return {
    categories,
    loading,
    error,
    addCategory,
    renameCategory,
    removeCategory,
    loadCategories,
  }
}
