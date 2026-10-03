import type { FilterStatus, Todo } from '../../types/todo'
import { Icon, type IconName } from '../ui/Icon'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  todos: Todo[]
  filter?: FilterStatus
  searchQuery?: string
  activeNav?: string
  activeCategory?: string
  selectedDate?: string | null
  selectedIds?: Set<string | number>
  onSelectToggle?: (id: string | number) => void
  onSelectAllVisible?: () => void
  onClearSelection?: () => void
  onToggle: (id: string | number) => void
  onEdit: (id: string | number, text: string) => void
  onDelete: (id: string | number) => void
  onDuplicate?: (todo: Todo) => void
}

export function TaskList({
  todos,
  filter = 'all',
  searchQuery = '',
  activeNav = 'tasks',
  activeCategory,
  selectedDate,
  selectedIds,
  onSelectToggle,
  onSelectAllVisible,
  onClearSelection,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
}: TaskListProps) {
  if (todos.length === 0) {
    let emptyTitle = 'No tasks yet'
    let emptyHint = 'Create your first task above.'
    let emptyIcon: IconName = 'checklist'

    if (searchQuery.trim()) {
      emptyTitle = `No tasks matching "${searchQuery}"`
      emptyHint = 'Try a different search.'
      emptyIcon = 'search'
    } else if (activeCategory) {
      emptyTitle = `No ${activeCategory} tasks`
      emptyHint = `Tasks assigned to ${activeCategory} will appear here.`
      emptyIcon = 'briefcase'
    } else if (activeNav === 'today') {
      emptyTitle = 'Nothing due today'
      emptyHint = "You're clear for today."
      emptyIcon = 'sun'
    } else if (activeNav === 'completed' || filter === 'completed') {
      emptyTitle = 'No completed tasks'
      emptyHint = 'Completed tasks will appear here.'
      emptyIcon = 'check-circle'
    } else if (activeNav === 'calendar' || selectedDate) {
      emptyTitle = 'No tasks scheduled'
      emptyHint = 'Select another date or create a task.'
      emptyIcon = 'calendar'
    } else if (filter === 'active') {
      emptyTitle = 'No active tasks'
      emptyHint = "You're all caught up! Great job."
      emptyIcon = 'check-circle'
    }

    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Icon name={emptyIcon} size={32} />
        </span>
        <p>{emptyTitle}</p>
        <span className="empty-hint">{emptyHint}</span>
      </div>
    )
  }

  const allVisibleSelected =
    Boolean(selectedIds && todos.length > 0 && todos.every((t) => selectedIds.has(t.id)))

  return (
    <div className="task-list-wrapper">
      {onSelectToggle && (
        <div className="tasks-select-all-header">
          <label className="select-all-toggle-label">
            <input
              type="checkbox"
              className="task-select-checkbox"
              checked={allVisibleSelected}
              onChange={() => {
                if (allVisibleSelected) {
                  onClearSelection?.()
                } else {
                  onSelectAllVisible?.()
                }
              }}
              aria-label="Select all visible tasks"
            />
            <span>Select all visible ({todos.length})</span>
          </label>
          {selectedIds && selectedIds.size > 0 && (
            <button
              type="button"
              className="chip-remove-btn"
              onClick={onClearSelection}
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      <ul className="task-list">
        {todos.map((todo, index) => (
          <TaskItem
            key={todo.id}
            todo={todo}
            index={index}
            selected={selectedIds?.has(todo.id)}
            onSelectToggle={onSelectToggle}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        ))}
      </ul>
    </div>
  )
}
