import type { Todo } from '../types/todo'

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '""'
  }
  const str = String(value)
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Exports tasks as a standards-compliant UTF-8 CSV file with BOM.
 */
export function exportTasksToCsv(tasks: Todo[], baseFilename = 'taskflow_tasks'): void {
  const headers = ['Title', 'Completed', 'Priority', 'Category', 'Due Date', 'Created At']

  const rows = tasks.map((task) => [
    escapeCsvField(task.todo),
    escapeCsvField(task.completed ? 'Yes' : 'No'),
    escapeCsvField(task.priority || 'medium'),
    escapeCsvField(task.category || 'General'),
    escapeCsvField(task.dueDate || ''),
    escapeCsvField(task.createdAt ? new Date(task.createdAt).toLocaleString() : ''),
  ])

  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n')

  // \uFEFF ensures proper UTF-8 decoding in Microsoft Excel and external spreadsheet tools
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const dateStr = new Date().toISOString().split('T')[0]
  triggerDownload(blob, `${baseFilename}_${dateStr}.csv`)
}

/**
 * Exports tasks as a formatted JSON file with user-facing fields.
 */
export function exportTasksToJson(tasks: Todo[], baseFilename = 'taskflow_tasks'): void {
  const cleanTasks = tasks.map((task) => ({
    title: task.todo,
    completed: task.completed,
    priority: task.priority || 'medium',
    category: task.category || 'General',
    dueDate: task.dueDate || null,
    createdAt: task.createdAt || null,
  }))

  const jsonContent = JSON.stringify(cleanTasks, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const dateStr = new Date().toISOString().split('T')[0]
  triggerDownload(blob, `${baseFilename}_${dateStr}.json`)
}
