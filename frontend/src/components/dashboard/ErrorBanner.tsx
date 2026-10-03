import { Icon } from '../ui/Icon'

interface ErrorBannerProps {
  error: string | null
  onDismiss: () => void
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null

  return (
    <div className="error-banner slide-down" role="alert">
      <span>{error}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error">
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}
