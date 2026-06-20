import { useState, type FormEvent } from 'react'

interface TaskFormProps {
  onAdd: (text: string) => Promise<void>
  disabled?: boolean
}

export function TaskForm({ onAdd, disabled }: TaskFormProps) {
  const [text, setText] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    await onAdd(trimmed)
    setText('')
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="task-input"
        placeholder="What needs to be done?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        aria-label="New task"
      />
      <button type="submit" className="btn btn-primary" disabled={disabled || !text.trim()}>
        Add Task
      </button>
    </form>
  )
}
