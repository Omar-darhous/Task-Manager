import { useState } from 'react'
import type { Todo } from '../../types/todo'
import { getTodayYMD } from '../../utils/date'
import { sortTasks } from '../../utils/taskSort'
import { Icon } from '../ui/Icon'
import { TaskItem } from '../tasks/TaskItem'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'

interface CalendarViewProps {
  tasks: Todo[]
  selectedDate: string | null
  onSelectDate: (dateStr: string | null) => void
  onToggle: (id: string | number) => void
  onEdit: (id: string | number, text: string) => void
  onDelete: (id: string | number) => void
  onDuplicate?: (todo: Todo) => void
}

export function CalendarView({
  tasks,
  selectedDate,
  onSelectDate,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number)
      if (!Number.isNaN(y) && !Number.isNaN(m)) {
        return new Date(y, m - 1, 1)
      }
    }
    return new Date()
  })

  const effectiveSelectedDate = selectedDate || getTodayYMD()

  const handlePrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    onSelectDate(getTodayYMD())
  }

  // Filter tasks for the selected date
  const scheduledTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate.split('T')[0] === effectiveSelectedDate,
  )
  const sortedTasks = sortTasks(scheduledTasks)

  // Format date for heading: e.g. "Saturday, Sep 26, 2026"
  const formattedDate = (() => {
    const parts = effectiveSelectedDate.split('-').map(Number)
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    return effectiveSelectedDate
  })()

  return (
    <div className="cal-view-container">
      {/* 1. Calendar Panel */}
      <div className="cal-view-board">
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={effectiveSelectedDate}
          tasks={tasks}
          onSelectDate={(date) => {
            onSelectDate(date)
          }}
        />
      </div>

      {/* 2. Tasks for Selected Date Section */}
      <div className="cal-view-day-tasks" aria-labelledby="cal-day-tasks-heading">
        <div className="cal-day-tasks-header">
          <div>
            <h3 id="cal-day-tasks-heading" className="cal-day-tasks-title">
              Tasks for {formattedDate}
            </h3>
            <span className="cal-day-tasks-subtitle">
              {scheduledTasks.length} task{scheduledTasks.length === 1 ? '' : 's'} scheduled
            </span>
          </div>
          {selectedDate && (
            <button
              type="button"
              className="btn-cal-clear-selection"
              onClick={() => onSelectDate(null)}
              aria-label="View all scheduled tasks"
            >
              Clear date selection
            </button>
          )}
        </div>

        {sortedTasks.length === 0 ? (
          <div className="empty-state cal-empty-state">
            <span className="empty-icon">
              <Icon name="calendar" size={28} />
            </span>
            <p>No tasks scheduled for this date</p>
            <span className="empty-hint">Select another date or create a task above.</span>
          </div>
        ) : (
          <ul className="task-list">
            {sortedTasks.map((todo, idx) => (
              <TaskItem
                key={todo.id}
                todo={todo}
                index={idx}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
