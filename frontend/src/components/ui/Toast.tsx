import { useEffect } from 'react'
import { Icon } from './Icon'

export interface ToastData {
  id: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: ToastData | null
  onDismiss: () => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      onDismiss()
    }, 4500)

    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div className="toast-notification-wrapper" role="status" aria-live="polite">
      <div className="toast-card">
        <span className="toast-message">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            className="toast-action-btn"
            onClick={() => {
              toast.action?.onClick()
              onDismiss()
            }}
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          className="toast-close-btn"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <Icon name="close" size={13} />
        </button>
      </div>
    </div>
  )
}
