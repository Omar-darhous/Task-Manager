import { useState } from 'react'
import type { Todo } from '../types/todo'

interface TaskItemProps {
  todo: Todo
  index: number
  onToggle: (id: number) => void
  onEdit: (id: number, text: string) => void
  onDelete: (id: number) => void
}

export function TaskItem({ todo, index, onToggle, onEdit, onDelete }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.todo)
  const [removing, setRemoving] = useState(false)

  const saveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== todo.todo) {
      onEdit(todo.id, trimmed)
    }
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditText(todo.todo)
    setEditing(false)
  }

  const handleDelete = () => {
    setRemoving(true)
    setTimeout(() => onDelete(todo.id), 320)
  }

  return (
    <li
      className={`task-item ${todo.completed ? 'completed' : ''} ${removing ? 'removing' : ''}`}
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      <label className="task-checkbox">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark "${todo.todo}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        <span className="checkmark" />
      </label>

      {editing ? (
        <input
          className="task-edit-input"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
          autoFocus
        />
      ) : (
        <span
          className="task-text"
          onDoubleClick={() => !todo.completed && setEditing(true)}
        >
          <span className="task-text-inner">{todo.todo}</span>
        </span>
      )}

      <div className="task-actions">
        {!todo.completed && !editing && (
          <button
            type="button"
            className="btn-icon"
            onClick={() => setEditing(true)}
            aria-label="Edit task"
          >
            ✏️
          </button>
        )}
        <button
          type="button"
          className="btn-icon btn-delete"
          onClick={handleDelete}
          aria-label="Delete task"
        >
          🗑️
        </button>
      </div>
    </li>
  )
}
