export type Priority = 'low' | 'medium' | 'high'
export type TaskCategory = 'Work' | 'Personal' | 'Health' | 'Finance' | 'General' | string

export interface Todo {
  id: string | number
  todo: string
  completed: boolean
  userId?: string | number
  priority?: Priority
  category?: TaskCategory
  dueDate?: string
  createdAt?: string
}

export interface TodosResponse {
  todos: Todo[]
  total: number
  skip?: number
  limit?: number
}

export type FilterStatus = 'all' | 'active' | 'completed'

export interface CreateTodoInput {
  todo: string
  priority?: Priority
  category?: TaskCategory
  dueDate?: string
}

export type UpdateTodoInput = Partial<
  Pick<Todo, 'todo' | 'completed' | 'priority' | 'category' | 'dueDate'>
>
