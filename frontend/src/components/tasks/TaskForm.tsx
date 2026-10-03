import { useState, type FormEvent } from 'react'
import type { CreateTodoInput, Priority, TaskCategory } from '../../types/todo'
import { Icon } from '../ui/Icon'

interface TaskFormProps {
  onAdd: (input: CreateTodoInput) => Promise<void>
  disabled?: boolean
  availableCategories?: string[]
}

const defaultCategories: TaskCategory[] = [
  'General',
  'Personal',
  'Work',
  'Study',
  'Finance',
]

const priorities: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export function TaskForm({ onAdd, disabled, availableCategories }: TaskFormProps) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<TaskCategory>('General')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')

  const categoryList =
    availableCategories && availableCategories.length > 0
      ? availableCategories
      : defaultCategories

  // Derive selected category safely so if a category was deleted/renamed it falls back to General
  const selectedCategory = categoryList.includes(category) ? category : 'General'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    await onAdd({
      todo: trimmed,
      category: selectedCategory,
      priority,
      dueDate: dueDate || undefined,
    })

    // Reset text and due date, maintain current category & default priority
    setText('')
    setDueDate('')
    setPriority('medium')
  }

  return (
    <form className="task-form-pro" onSubmit={handleSubmit}>
      {/* Top Input Row */}
      <div className="task-form-input-row">
        <Icon name="plus" size={16} className="task-form-plus-icon" />
        <input
          type="text"
          className="task-input-pro"
          placeholder="What do you want to accomplish?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          aria-label="New task title"
        />
      </div>

      {/* Bottom Controls Row: Category, Priority, Due Date, Submit Button */}
      <div className="task-form-controls-row">
        <div className="task-form-meta-controls">
          {/* Category Dropdown */}
          <div className="select-wrapper" title="Task category">
            <Icon name="tag" size={12} className="select-icon" />
            <select
              className="task-form-select"
              value={selectedCategory}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              disabled={disabled}
              aria-label="Select category"
            >
              {categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="select-wrapper" title="Task priority">
            <Icon name="flag" size={12} className="select-icon" />
            <select
              className="task-form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              disabled={disabled}
              aria-label="Select priority"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Picker */}
          <div className="date-wrapper" title="Due date">
            <Icon name="calendar" size={12} className="select-icon" />
            <input
              type="date"
              className="task-form-date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={disabled}
              aria-label="Due date"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary task-form-submit"
          disabled={disabled || !text.trim()}
        >
          Add Task
        </button>
      </div>
    </form>
  )
}
