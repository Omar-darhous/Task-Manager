import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import type { Todo } from '../../types/todo'
import { formatDueDate } from '../../utils/date'
import { Icon } from '../ui/Icon'

interface TaskItemProps {
  todo: Todo
  index: number
  selected?: boolean
  onSelectToggle?: (id: string | number) => void
  onToggle: (id: string | number) => void
  onEdit: (id: string | number, text: string) => void
  onDelete: (id: string | number) => void
  onDuplicate?: (todo: Todo) => void
}

export function TaskItem({
  todo,
  index,
  selected = false,
  onSelectToggle,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.todo)
  const [removing, setRemoving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPlacement, setMenuPlacement] = useState<'bottom' | 'top'>('bottom')
  const menuRef = useRef<HTMLDivElement>(null)

  // Calculate menu placement avoiding viewport clipping
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 150) {
        setMenuPlacement('top')
      } else {
        setMenuPlacement('bottom')
      }
    }
  }, [menuOpen])

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return

    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const startEdit = () => {
    setEditText(todo.todo)
    setEditing(true)
  }

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
    setTimeout(() => onDelete(todo.id), 220)
  }

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  const dueStatus = formatDueDate(todo.dueDate)
  const priority = todo.priority || 'medium'
  const category = todo.category || 'General'

  return (
    <li
      className={`task-row ${todo.completed ? 'completed' : ''} ${
        removing ? 'removing' : ''
      }`}
      style={{ animationDelay: `${Math.min(index * 30, 250)}ms` }}
    >
      {/* 0. Multi-select Checkbox */}
      {onSelectToggle && (
        <input
          type="checkbox"
          className="task-select-checkbox"
          checked={selected}
          onChange={() => onSelectToggle(todo.id)}
          aria-label={`Select task: ${todo.todo}`}
        />
      )}

      {/* 1. Custom Accessible Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.completed}
        className={`task-checkbox-btn ${todo.completed ? 'checked' : ''}`}
        onClick={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.todo}" as ${
          todo.completed ? 'incomplete' : 'complete'
        }`}
      >
        {todo.completed && (
          <Icon name="check" size={12} className="check-icon" />
        )}
      </button>

      {/* 2. Main Content & Metadata */}
      <div className="task-content">
        {editing ? (
          <input
            className="task-edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleEditKeyDown}
            autoFocus
            aria-label="Edit task title"
          />
        ) : (
          <span
            className="task-title"
            onDoubleClick={() => !todo.completed && startEdit()}
            title={!todo.completed ? 'Double click to edit' : undefined}
          >
            {todo.todo}
          </span>
        )}

        {/* Row 2: Metadata (Category, Priority, Due Date) */}
        <div className="task-meta">
          {category && (
            <span className="meta-badge meta-category">
              <Icon name="tag" size={11} />
              <span>{category}</span>
            </span>
          )}

          <span className={`meta-badge meta-priority priority-${priority}`}>
            <Icon name="flag" size={11} />
            <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
          </span>

          {dueStatus && (
            <span
              className={`meta-badge meta-due ${
                dueStatus.isOverdue ? 'overdue' : ''
              } ${dueStatus.isToday ? 'due-today' : ''}`}
            >
              <Icon name="calendar" size={11} />
              <span>{dueStatus.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Action Context Menu */}
      <div className="task-menu-container" ref={menuRef}>
        <button
          type="button"
          className="btn-icon btn-menu-trigger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label={`Options for "${todo.todo}"`}
          title="Task options"
        >
          <Icon name="more" size={16} />
        </button>

        {menuOpen && (
          <div
            className={`task-context-menu place-${menuPlacement}`}
            role="menu"
            aria-label="Task actions"
          >
            {!todo.completed && (
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  startEdit()
                }}
              >
                <Icon name="edit" size={14} />
                <span>Edit</span>
              </button>
            )}

            {onDuplicate && (
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onDuplicate(todo)
                }}
              >
                <Icon name="copy" size={14} />
                <span>Duplicate</span>
              </button>
            )}

            <button
              type="button"
              className="menu-item menu-item-danger"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                handleDelete()
              }}
            >
              <Icon name="trash" size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
