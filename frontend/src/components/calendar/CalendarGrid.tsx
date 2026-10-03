import type { Todo } from '../../types/todo'
import { getCalendarGrid, getTodayYMD } from '../../utils/date'

interface CalendarGridProps {
  currentDate: Date
  selectedDate: string | null
  tasks: Todo[]
  onSelectDate: (dateStr: string) => void
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function CalendarGrid({
  currentDate,
  selectedDate,
  tasks,
  onSelectDate,
}: CalendarGridProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getCalendarGrid(year, month)
  const todayYMD = getTodayYMD()

  // Pre-calculate task counts per date
  const taskCountByDate = new Map<string, { total: number; hasOverdue: boolean }>()

  for (const t of tasks) {
    if (!t.dueDate) continue
    const dStr = t.dueDate.split('T')[0]
    const current = taskCountByDate.get(dStr) || { total: 0, hasOverdue: false }
    current.total += 1
    if (!t.completed && dStr < todayYMD) {
      current.hasOverdue = true
    }
    taskCountByDate.set(dStr, current)
  }

  return (
    <div className="cal-view-grid-wrapper" role="region" aria-label="Monthly Calendar Grid">
      {/* Weekday Labels */}
      <div className="cal-view-weekdays" role="row">
        {WEEKDAYS.map((day) => (
          <div key={day} className="cal-view-weekday-header" role="columnheader">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="cal-view-days-grid" role="grid">
        {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIdx) => {
          const weekDays = days.slice(weekIdx * 7, weekIdx * 7 + 7)
          return (
            <div key={weekIdx} role="row" style={{ display: 'contents' }}>
              {weekDays.map((day) => {
                const isSelected = selectedDate === day.dateStr
                const dayInfo = taskCountByDate.get(day.dateStr)
                const taskCount = dayInfo ? dayInfo.total : 0
                const hasOverdue = dayInfo ? dayInfo.hasOverdue : false

                let dayClasses = 'cal-view-day-cell'
                if (!day.isCurrentMonth) dayClasses += ' other-month'
                if (day.isToday) dayClasses += ' is-today'
                if (isSelected) dayClasses += ' is-selected'

                const ariaLabel = `${day.dateStr}${
                  day.isToday ? ', Today' : ''
                }${isSelected ? ', Selected' : ''}${
                  taskCount > 0 ? `, ${taskCount} task${taskCount > 1 ? 's' : ''}` : ''
                }`

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    className={dayClasses}
                    onClick={() => onSelectDate(day.dateStr)}
                    aria-label={ariaLabel}
                    aria-selected={isSelected}
                    role="gridcell"
                  >
                    <span className="cal-view-day-number">{day.dayNumber}</span>

                    {/* Task Indicators */}
                    {taskCount > 0 && (
                      <div className="cal-view-day-indicators" aria-hidden="true">
                        {taskCount === 1 ? (
                          <span
                            className={`cal-view-dot ${hasOverdue ? 'overdue' : 'normal'}`}
                          />
                        ) : (
                          <span
                            className={`cal-view-badge-count ${hasOverdue ? 'overdue' : 'normal'}`}
                          >
                            {taskCount}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
