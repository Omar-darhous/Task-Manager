import { useState, useMemo } from 'react'
import type { Todo } from '../../types/todo'
import { getCalendarGrid, getTodayYMD } from '../../utils/date'
import { Icon } from '../ui/Icon'

interface MiniCalendarProps {
  tasks?: Todo[]
  selectedDate?: string | null
  onSelectDate?: (dateStr: string | null) => void
}

const weekdayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function MiniCalendar({
  tasks = [],
  selectedDate = null,
  onSelectDate,
}: MiniCalendarProps) {
  const today = new Date()
  const todayYMD = getTodayYMD()

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  // Generate grid days for viewed month
  const gridDays = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  // Map of dates (YYYY-MM-DD) that have tasks
  const datesWithTasks = useMemo(() => {
    const map = new Set<string>()
    for (const t of tasks) {
      if (t.dueDate) {
        const ymd = t.dueDate.split('T')[0]
        map.add(ymd)
      }
    }
    return map
  }, [tasks])

  const monthTitle = new Date(currentYear, currentMonth, 1).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      year: 'numeric',
    },
  )

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleGoToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    onSelectDate?.(todayYMD)
  }

  const handleDayClick = (dateStr: string) => {
    // If clicking already selected date, toggle off
    if (selectedDate === dateStr) {
      onSelectDate?.(null)
    } else {
      onSelectDate?.(dateStr)
    }
  }

  const isCurrentMonthViewed =
    currentYear === today.getFullYear() && currentMonth === today.getMonth()

  return (
    <div className="mini-calendar" aria-label="Interactive mini calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <span className="calendar-title">{monthTitle}</span>

        <div className="calendar-nav-actions">
          {!isCurrentMonthViewed && (
            <button
              type="button"
              className="calendar-today-btn"
              onClick={handleGoToday}
              aria-label="Go to current month"
            >
              Today
            </button>
          )}

          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            <Icon name="chevron-left" size={14} />
          </button>

          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            <Icon name="chevron-right" size={14} />
          </button>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="calendar-weekdays" aria-hidden="true">
        {weekdayNames.map((day) => (
          <span key={day} className="calendar-weekday">
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="calendar-grid" role="grid">
        {Array.from({ length: Math.ceil(gridDays.length / 7) }, (_, weekIdx) => {
          const weekDays = gridDays.slice(weekIdx * 7, weekIdx * 7 + 7)
          return (
            <div key={weekIdx} role="row" style={{ display: 'contents' }}>
              {weekDays.map((day) => {
                const isSelected = selectedDate === day.dateStr
                const hasTasks = datesWithTasks.has(day.dateStr)

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    role="gridcell"
                    className={`calendar-day ${
                      !day.isCurrentMonth ? 'other-month' : ''
                    } ${day.isToday ? 'is-today' : ''} ${
                      isSelected ? 'is-selected' : ''
                    } ${hasTasks ? 'has-tasks' : ''}`}
                    onClick={() => handleDayClick(day.dateStr)}
                    aria-label={`${day.dateStr}${day.isToday ? ' (Today)' : ''}${
                      hasTasks ? ' (Has tasks)' : ''
                    }`}
                    aria-selected={isSelected}
                  >
                    <span className="day-number">{day.dayNumber}</span>
                    {hasTasks && <span className="task-indicator-dot" />}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <div className="calendar-selection-bar">
          <span className="selection-label">
            Filtered: <strong>{selectedDate}</strong>
          </span>
          <button
            type="button"
            className="clear-selection-btn"
            onClick={() => onSelectDate?.(null)}
            aria-label="Clear calendar date filter"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
