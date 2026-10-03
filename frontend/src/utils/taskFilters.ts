import type { FilterStatus, Todo } from '../types/todo'
import { getTodayYMD } from './date'

export type NavView = 'tasks' | 'today' | 'calendar' | 'completed' | 'focus' | 'settings'

export interface TaskFilterOptions {
  activeNav: NavView
  selectedCalendarDate?: string | null
  activeCategory?: string
  statusFilter?: FilterStatus
  searchQuery?: string
  todayStr?: string
}

/**
 * Pure function that evaluates whether a single task matches all applied filters.
 */
export function matchesTaskFilters(todo: Todo, options: TaskFilterOptions): boolean {
  const {
    activeNav,
    selectedCalendarDate,
    activeCategory,
    statusFilter = 'all',
    searchQuery = '',
    todayStr = getTodayYMD(),
  } = options

  // 1. Navigation View Filter
  if (activeNav === 'today') {
    // Tasks without due date are excluded from Today view
    if (!todo.dueDate) return false

    const dateOnly = todo.dueDate.split('T')[0]
    const isDueToday = dateOnly === todayStr
    const isOverdueActive = dateOnly < todayStr && !todo.completed

    // Today view includes tasks due today plus active overdue items
    if (!isDueToday && !isOverdueActive) {
      return false
    }
  } else if (activeNav === 'completed') {
    if (!todo.completed) return false
  } else if (activeNav === 'calendar') {
    if (selectedCalendarDate) {
      if (!todo.dueDate || todo.dueDate.split('T')[0] !== selectedCalendarDate) {
        return false
      }
    } else {
      // Show all tasks with scheduled dates if no specific day is picked
      if (!todo.dueDate) return false
    }
  }

  // 2. Calendar Date Filter (when set from MiniCalendar in any view)
  if (selectedCalendarDate && activeNav !== 'calendar') {
    if (!todo.dueDate || todo.dueDate.split('T')[0] !== selectedCalendarDate) {
      return false
    }
  }

  // 3. Category Filter
  if (activeCategory) {
    const taskCat = todo.category || 'General'
    if (taskCat.toLowerCase() !== activeCategory.toLowerCase()) {
      return false
    }
  }

  // 4. Status Filter (All / Active / Completed)
  if (activeNav !== 'completed') {
    if (statusFilter === 'active' && todo.completed) return false
    if (statusFilter === 'completed' && !todo.completed) return false
  }

  // 5. Search Query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim()
    const matchesTitle = todo.todo.toLowerCase().includes(query)
    const matchesCat = (todo.category || '').toLowerCase().includes(query)
    if (!matchesTitle && !matchesCat) {
      return false
    }
  }

  return true
}

/**
 * Pure pipeline: Filters a task collection based on unified filter options.
 */
export function filterTasks(todos: Todo[], options: TaskFilterOptions): Todo[] {
  return todos.filter((todo) => matchesTaskFilters(todo, options))
}

/**
 * Calculates task counts per category.
 */
export function getCategoryCounts(todos: Todo[]): Record<string, number> {
  const counts: Record<string, number> = {
    General: 0,
    Personal: 0,
    Work: 0,
    Study: 0,
    Finance: 0,
  }

  for (const todo of todos) {
    const cat = todo.category || 'General'
    counts[cat] = (counts[cat] || 0) + 1
  }

  return counts
}

/**
 * Calculates real-time task counts for sidebar navigation items.
 */
export function getNavCounts(todos: Todo[], todayStr = getTodayYMD()): Record<string, number> {
  let todayCount = 0
  let completedCount = 0

  for (const todo of todos) {
    if (todo.completed) {
      completedCount++
    }

    if (todo.dueDate) {
      const dateOnly = todo.dueDate.split('T')[0]
      if (dateOnly === todayStr || (dateOnly < todayStr && !todo.completed)) {
        todayCount++
      }
    }
  }

  return {
    tasks: todos.length,
    today: todayCount,
    completed: completedCount,
  }
}
