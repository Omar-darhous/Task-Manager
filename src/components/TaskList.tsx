import type { Todo } from '../types/todo'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  todos: Todo[]
  onToggle: (id: number) => void
  onEdit: (id: number, text: string) => void
  onDelete: (id: number) => void
}

export function TaskList({ todos, onToggle, onEdit, onDelete }: TaskListProps) {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <p>No tasks here yet</p>
        <span className="empty-hint">Add a task above to get started</span>
      </div>
    )
  }

  return (
    <ul className="task-list">
      {todos.map((todo, index) => (
        <TaskItem
          key={todo.id}
          todo={todo}
          index={index}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
