import { useCallback, useEffect, useState } from 'react'
import type { CreateTodoInput, FilterStatus, Todo, UpdateTodoInput } from '../types/todo'
import * as todoApi from '../services/todoApi'
import { useAuth } from '../auth/useAuth'

export function useTodos() {
  const { isAuthenticated } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setTodos([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await todoApi.fetchTodos()
      setTodos(data)
    } catch {
      setError('Could not load tasks. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    let ignore = false

    async function initialFetch() {
      if (!isAuthenticated) {
        return
      }

      setLoading(true)
      try {
        const data = await todoApi.fetchTodos()
        if (!ignore) {
          setTodos(data)
        }
      } catch {
        if (!ignore) {
          setError('Could not load tasks. Check your connection.')
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

  const addTodo = async (input: string | CreateTodoInput) => {
    setActionLoading(true)
    try {
      const newTodo = await todoApi.addTodo(input)
      setTodos((prev) => [newTodo, ...prev])
    } catch {
      setError('Failed to add task.')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleTodo = async (id: string | number) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    try {
      const updated = await todoApi.updateTodo(id, { completed: !todo.completed })
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch {
      setError('Failed to update task.')
    }
  }

  const editTodo = async (id: string | number, text: string) => {
    try {
      const updated = await todoApi.updateTodo(id, { todo: text })
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch {
      setError('Failed to edit task.')
    }
  }

  const updateTodo = async (id: string | number, updates: UpdateTodoInput) => {
    try {
      const updated = await todoApi.updateTodo(id, updates)
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch {
      setError('Failed to update task.')
    }
  }

  const removeTodo = async (id: string | number) => {
    try {
      await todoApi.deleteTodo(id)
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setError('Failed to delete task.')
    }
  }

  const clearCompleted = async () => {
    setActionLoading(true)
    try {
      await todoApi.clearCompleted()
      setTodos((prev) => prev.filter((t) => !t.completed))
    } catch {
      setError('Failed to clear completed tasks.')
    } finally {
      setActionLoading(false)
    }
  }

  const resetFromApi = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await todoApi.resetFromApi()
      setTodos(data)
    } catch {
      setError('Could not reload tasks from API.')
    } finally {
      setLoading(false)
    }
  }

  const bulkComplete = async (ids: (string | number)[]) => {
    if (ids.length === 0) return
    setActionLoading(true)
    try {
      await todoApi.bulkTaskApi(ids, 'complete')
      const idSet = new Set(ids.map(String))
      setTodos((prev) =>
        prev.map((t) => (idSet.has(String(t.id)) ? { ...t, completed: true } : t))
      )
    } catch {
      setError('Failed to complete selected tasks.')
    } finally {
      setActionLoading(false)
    }
  }

  const bulkActivate = async (ids: (string | number)[]) => {
    if (ids.length === 0) return
    setActionLoading(true)
    try {
      await todoApi.bulkTaskApi(ids, 'activate')
      const idSet = new Set(ids.map(String))
      setTodos((prev) =>
        prev.map((t) => (idSet.has(String(t.id)) ? { ...t, completed: false } : t))
      )
    } catch {
      setError('Failed to mark selected tasks active.')
    } finally {
      setActionLoading(false)
    }
  }

  const bulkDelete = async (ids: (string | number)[]) => {
    if (ids.length === 0) return
    setActionLoading(true)
    try {
      await todoApi.bulkTaskApi(ids, 'delete')
      const idSet = new Set(ids.map(String))
      setTodos((prev) => prev.filter((t) => !idSet.has(String(t.id))))
    } catch {
      setError('Failed to delete selected tasks.')
    } finally {
      setActionLoading(false)
    }
  }

  const currentTodos = isAuthenticated ? todos : []

  const filteredTodos = currentTodos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  // Calculated strictly from complete task collection
  const total = currentTodos.length
  const active = currentTodos.filter((t) => !t.completed).length
  const completed = currentTodos.filter((t) => t.completed).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const stats = {
    total,
    active,
    completed,
    progress,
  }

  return {
    // Both full list and filtered list available
    todos: filteredTodos, // Backward compatibility for existing consumers (e.g. App.tsx)
    allTodos: currentTodos,      // Full collection for upcoming dashboard widgets
    filteredTodos,        // Explicit filtered alias
    filter,
    setFilter,
    loading,
    error,
    setError,
    actionLoading,
    stats,
    progress,
    addTodo,
    toggleTodo,
    editTodo,
    updateTodo,
    removeTodo,
    clearCompleted,
    resetFromApi,
    bulkComplete,
    bulkActivate,
    bulkDelete,
    load,
  }
}

