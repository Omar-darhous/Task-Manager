import type { Todo, TodosResponse } from '../types/todo'

const API_BASE = 'https://dummyjson.com/todos'
const STORAGE_KEY = 'task-manager-todos'
const NEXT_ID_KEY = 'task-manager-next-id'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

function loadTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Todo[]) : []
}

function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function getNextId(): number {
  const stored = localStorage.getItem(NEXT_ID_KEY)
  if (stored) return Number(stored)
  const todos = loadTodos()
  const maxId = todos.reduce((max, t) => Math.max(max, t.id), 0)
  return maxId + 1
}

function setNextId(id: number): void {
  localStorage.setItem(NEXT_ID_KEY, String(id))
}

export async function fetchTodos(): Promise<Todo[]> {
  const cached = loadTodos()
  if (cached.length > 0) {
    await delay(150)
    return cached
  }

  const res = await fetch(`${API_BASE}?limit=20`)
  if (!res.ok) throw new Error('Failed to fetch tasks from DummyJSON')

  const data = (await res.json()) as TodosResponse
  saveTodos(data.todos)
  setNextId(Math.max(...data.todos.map((t) => t.id), 0) + 1)
  return data.todos
}

export async function addTodo(text: string): Promise<Todo> {
  await delay()

  const res = await fetch(`${API_BASE}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ todo: text, completed: false, userId: 1 }),
  })

  if (!res.ok) throw new Error('Failed to add task')

  const apiTodo = (await res.json()) as Todo
  const id = getNextId()
  setNextId(id + 1)

  const newTodo: Todo = { ...apiTodo, id, todo: text, completed: false, userId: 1 }
  const todos = loadTodos()
  todos.unshift(newTodo)
  saveTodos(todos)
  return newTodo
}

export async function updateTodo(
  id: number,
  updates: Partial<Pick<Todo, 'todo' | 'completed'>>,
): Promise<Todo> {
  await delay()

  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!res.ok) throw new Error('Failed to update task')

  const todos = loadTodos()
  const index = todos.findIndex((t) => t.id === id)
  if (index === -1) throw new Error('Task not found')

  todos[index] = { ...todos[index], ...updates }
  saveTodos(todos)
  return todos[index]
}

export async function deleteTodo(id: number): Promise<void> {
  await delay()

  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete task')

  const todos = loadTodos().filter((t) => t.id !== id)
  saveTodos(todos)
}

export async function clearCompleted(): Promise<void> {
  await delay(150)
  const todos = loadTodos().filter((t) => !t.completed)
  saveTodos(todos)
}

export async function resetFromApi(): Promise<Todo[]> {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(NEXT_ID_KEY)
  return fetchTodos()
}
