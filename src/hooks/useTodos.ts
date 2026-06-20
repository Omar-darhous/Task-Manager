import { useCallback, useEffect, useState } from 'react'
import type { FilterStatus, Todo } from '../types/todo'
import * as todoApi from '../services/todoApi'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await todoApi.fetchTodos()
      setTodos(data)
    } catch {
      setError('Could not load tasks. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addTodo = async (text: string) => {
    setActionLoading(true)
    try {
      const newTodo = await todoApi.addTodo(text)
      setTodos((prev) => [newTodo, ...prev])
    } catch {
      setError('Failed to add task.')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleTodo = async (id: number) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    try {
      const updated = await todoApi.updateTodo(id, { completed: !todo.completed })
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch {
      setError('Failed to update task.')
    }
  }

  const editTodo = async (id: number, text: string) => {
    try {
      const updated = await todoApi.updateTodo(id, { todo: text })
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch {
      setError('Failed to edit task.')
    }
  }

  const removeTodo = async (id: number) => {
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

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const stats = {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  }

  return {
    todos: filtered,
    filter,
    setFilter,
    loading,
    error,
    setError,
    actionLoading,
    stats,
    addTodo,
    toggleTodo,
    editTodo,
    removeTodo,
    clearCompleted,
    resetFromApi,
  }
}
