import { Icon } from '../ui/Icon'

interface CalendarHeaderProps {
  currentDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="cal-view-header">
      <div className="cal-view-title-group">
        <h3 className="cal-view-month">{monthName}</h3>
      </div>
      <div className="cal-view-controls">
        <button
          type="button"
          className="btn-cal-action"
          onClick={onToday}
          aria-label="Go to today"
        >
          Today
        </button>
        <div className="cal-view-nav-buttons">
          <button
            type="button"
            className="btn-icon cal-nav-btn"
            onClick={onPrevMonth}
            aria-label="Previous month"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            className="btn-icon cal-nav-btn"
            onClick={onNextMonth}
            aria-label="Next month"
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
