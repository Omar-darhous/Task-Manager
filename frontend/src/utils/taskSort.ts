import type { Todo } from '../types/todo'
import { getTodayYMD } from './date'

/**
 * Returns a sort rank for active tasks:
 * 0: Overdue (active)
 * 1: Due today (active)
 * 2: Upcoming future due dates (active)
 * 3: No due date (active)
 * 4: Completed
 */
function getTaskRank(todo: Todo, todayStr: string): number {
  if (todo.completed) return 4
  if (!todo.dueDate) return 3

  const dateOnly = todo.dueDate.split('T')[0]
  if (dateOnly < todayStr) return 0
  if (dateOnly === todayStr) return 1
  return 2
}

/**
 * Compares two tasks for stable chronological/priority display:
 * 1. Active tasks first
 * 2. Overdue first -> Today -> Upcoming (chronological) -> No due date
 * 3. Stable tie-break by ID descending (newer tasks first)
 * 4. Completed tasks placed at end
 */
export function sortTasksNormal(todos: Todo[]): Todo[] {
  const todayStr = getTodayYMD()

  return [...todos].sort((a, b) => {
    const rankA = getTaskRank(a, todayStr)
    const rankB = getTaskRank(b, todayStr)

    if (rankA !== rankB) {
      return rankA - rankB
    }

    // Within upcoming (rank 2) or overdue (rank 0), sort chronologically by dueDate ascending
    if ((rankA === 0 || rankA === 2) && a.dueDate && b.dueDate) {
      const dateA = a.dueDate.split('T')[0]
      const dateB = b.dueDate.split('T')[0]
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB)
      }
    }

    // Stable secondary sort: by createdAt descending if available, otherwise by id descending
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt)
    }

    const idA = typeof a.id === 'number' ? a.id : Number(a.id)
    const idB = typeof b.id === 'number' ? b.id : Number(b.id)
    if (!isNaN(idA) && !isNaN(idB)) {
      return idB - idA
    }
    return String(b.id).localeCompare(String(a.id))
  })
}

/**
 * Sorts tasks specifically for the Completed view:
 * Most recently created/completed first.
 */
export function sortTasksCompleted(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt)
    }
    const idA = typeof a.id === 'number' ? a.id : Number(a.id)
    const idB = typeof b.id === 'number' ? b.id : Number(b.id)
    if (!isNaN(idA) && !isNaN(idB)) {
      return idB - idA
    }
    return String(b.id).localeCompare(String(a.id))
  })
}

/**
 * Primary sort entry point depending on view context.
 */
export function sortTasks(todos: Todo[], isCompletedView = false): Todo[] {
  if (isCompletedView) {
    return sortTasksCompleted(todos)
  }
  return sortTasksNormal(todos)
}
