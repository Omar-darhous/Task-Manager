import { useState } from 'react'
import { Icon } from '../ui/Icon'

interface BulkActionBarProps {
  selectedCount: number
  loading?: boolean
  onComplete: () => void
  onActivate: () => void
  onDelete: () => void
  onClearSelection: () => void
}

export function BulkActionBar({
  selectedCount,
  loading = false,
  onComplete,
  onActivate,
  onDelete,
  onClearSelection,
}: BulkActionBarProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (selectedCount === 0) {
    return null
  }

  const handleDeleteClick = () => {
    if (confirmingDelete) {
      setConfirmingDelete(false)
      onDelete()
    } else {
      setConfirmingDelete(true)
    }
  }

  return (
    <aside
      className="bulk-actions-toolbar"
      role="toolbar"
      aria-label="Bulk actions for selected tasks"
    >
      <div className="bulk-toolbar-info">
        <span className="bulk-badge">{selectedCount}</span>
        <span className="bulk-text">
          {selectedCount === 1 ? '1 task selected' : `${selectedCount} tasks selected`}
        </span>
      </div>

      <div className="bulk-toolbar-buttons">
        {confirmingDelete ? (
          <div className="confirm-btn-group" role="alert">
            <span style={{ fontSize: '0.8125rem', color: 'var(--danger)', fontWeight: 600 }}>
              Delete {selectedCount} task{selectedCount === 1 ? '' : 's'}?
            </span>
            <button
              type="button"
              className="bulk-btn bulk-btn-delete"
              onClick={handleDeleteClick}
              disabled={loading}
              aria-label={`Confirm delete of ${selectedCount} tasks`}
            >
              <Icon name="trash" size={14} />
              <span>Confirm</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="bulk-btn bulk-btn-complete"
              onClick={onComplete}
              disabled={loading}
              aria-label="Mark selected tasks as completed"
            >
              <Icon name="check" size={14} />
              <span>Complete</span>
            </button>

            <button
              type="button"
              className="bulk-btn bulk-btn-activate"
              onClick={onActivate}
              disabled={loading}
              aria-label="Mark selected tasks as active"
            >
              <Icon name="checklist" size={14} />
              <span>Active</span>
            </button>

            <button
              type="button"
              className="bulk-btn bulk-btn-delete"
              onClick={handleDeleteClick}
              disabled={loading}
              aria-label="Delete selected tasks"
            >
              <Icon name="trash" size={14} />
              <span>Delete</span>
            </button>

            <button
              type="button"
              className="bulk-btn bulk-btn-clear"
              onClick={onClearSelection}
              disabled={loading}
              aria-label="Clear task selection"
              title="Clear selection"
            >
              <Icon name="close" size={14} />
              <span>Deselect</span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
