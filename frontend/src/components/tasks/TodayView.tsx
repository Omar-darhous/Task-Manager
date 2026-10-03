import type { Todo } from '../../types/todo'
import { getTodayYMD } from '../../utils/date'
import { Icon } from '../ui/Icon'
import { TaskItem } from './TaskItem'

interface TodayViewProps {
  todos: Todo[]
  searchQuery?: string
  activeCategory?: string
  selectedIds?: Set<string | number>
  onSelectToggle?: (id: string | number) => void
  onToggle: (id: string | number) => void
  onEdit: (id: string | number, text: string) => void
  onDelete: (id: string | number) => void
  onDuplicate?: (todo: Todo) => void
}

export function TodayView({
  todos,
  searchQuery = '',
  activeCategory,
  selectedIds,
  onSelectToggle,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
}: TodayViewProps) {
  const todayStr = getTodayYMD()

  if (todos.length === 0) {
    let emptyTitle = 'Nothing due today'
    let emptyHint = "You're clear for today."

    if (searchQuery.trim()) {
      emptyTitle = `No tasks matching "${searchQuery}"`
      emptyHint = 'Try a different search.'
    } else if (activeCategory) {
      emptyTitle = `No ${activeCategory} tasks due today`
      emptyHint = `Tasks assigned to ${activeCategory} will appear here.`
    }

    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Icon name="sun" size={32} />
        </span>
        <p>{emptyTitle}</p>
        <span className="empty-hint">{emptyHint}</span>
      </div>
    )
  }

  // Partition into Overdue, Due Today, and Completed
  const overdueTasks: Todo[] = []
  const todayTasks: Todo[] = []
  const completedTasks: Todo[] = []

  for (const todo of todos) {
    if (todo.completed) {
      completedTasks.push(todo)
      continue
    }

    const dateOnly = todo.dueDate ? todo.dueDate.split('T')[0] : ''
    if (dateOnly && dateOnly < todayStr) {
      overdueTasks.push(todo)
    } else {
      todayTasks.push(todo)
    }
  }

  return (
    <div className="today-view-sections">
      {/* 1. Overdue Section */}
      {overdueTasks.length > 0 && (
        <section className="today-section overdue-section" aria-labelledby="today-overdue-heading">
          <div className="today-section-header">
            <span className="today-section-badge overdue-badge">
              <Icon name="flag" size={14} />
              <span id="today-overdue-heading">Overdue</span>
            </span>
            <span className="today-section-count">{overdueTasks.length}</span>
          </div>
          <ul className="task-list">
            {overdueTasks.map((todo, idx) => (
              <TaskItem
                key={todo.id}
                todo={todo}
                index={idx}
                selected={selectedIds?.has(todo.id)}
                onSelectToggle={onSelectToggle}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </ul>
        </section>
      )}

      {/* 2. Due Today Section */}
      {todayTasks.length > 0 && (
        <section className="today-section" aria-labelledby="today-scheduled-heading">
          <div className="today-section-header">
            <span className="today-section-badge">
              <Icon name="calendar" size={14} />
              <span id="today-scheduled-heading">Due Today</span>
            </span>
            <span className="today-section-count">{todayTasks.length}</span>
          </div>
          <ul className="task-list">
            {todayTasks.map((todo, idx) => (
              <TaskItem
                key={todo.id}
                todo={todo}
                index={idx}
                selected={selectedIds?.has(todo.id)}
                onSelectToggle={onSelectToggle}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </ul>
        </section>
      )}

      {/* 3. Completed Today Section */}
      {completedTasks.length > 0 && (
        <section className="today-section completed-section" aria-labelledby="today-completed-heading">
          <div className="today-section-header">
            <span className="today-section-badge">
              <Icon name="check" size={14} />
              <span id="today-completed-heading">Completed</span>
            </span>
            <span className="today-section-count">{completedTasks.length}</span>
          </div>
          <ul className="task-list">
            {completedTasks.map((todo, idx) => (
              <TaskItem
                key={todo.id}
                todo={todo}
                index={idx}
                selected={selectedIds?.has(todo.id)}
                onSelectToggle={onSelectToggle}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
