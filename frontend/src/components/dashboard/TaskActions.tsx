import { Icon } from '../ui/Icon'

interface TaskActionsProps {
  completedCount: number
  loading?: boolean
  disabled?: boolean
  onClearCompleted: () => void
  onResetFromApi: () => void
}

export function TaskActions({
  completedCount,
  loading = false,
  disabled = false,
  onClearCompleted,
  onResetFromApi,
}: TaskActionsProps) {
  if (completedCount <= 0 || loading) {
    return null
  }

  return (
    <footer className="card-footer">
      <button
        type="button"
        className="btn-icon"
        onClick={onClearCompleted}
        disabled={disabled}
        aria-label="Clear completed tasks"
        title="Clear completed tasks"
      >
        <Icon name="trash" size={16} />
      </button>
      <button
        type="button"
        className="btn-icon"
        onClick={onResetFromApi}
        disabled={disabled}
        aria-label="Reset from API"
        title="Reset from API"
      >
        <Icon name="refresh" size={16} />
      </button>
    </footer>
  )
}

