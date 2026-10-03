import { useMemo } from 'react'
import type { Todo } from '../../types/todo'
import { formatDueDate } from '../../utils/date'
import { Icon } from '../ui/Icon'

interface UpcomingTasksProps {
  tasks: Todo[]
  onToggle: (id: string | number) => void
  onSelectTask?: (id: string | number) => void
}

export function UpcomingTasks({ tasks, onToggle }: UpcomingTasksProps) {
  // Separate tasks into upcoming (today + future) and overdue
  const { upcomingList, overdueCount } = useMemo(() => {
    const today = new Date()
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime()

    const withDueDate = tasks.filter((t) => !t.completed && Boolean(t.dueDate))

    let overdue = 0
    const upcoming: { todo: Todo; dueTime: number }[] = []

    for (const t of withDueDate) {
      const parts = t.dueDate!.split('T')[0].split('-').map(Number)
      if (parts.length >= 3) {
        const dueTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime()
        if (dueTime < todayMidnight) {
          overdue++
        } else {
          upcoming.push({ todo: t, dueTime })
        }
      }
    }

    // Sort upcoming ascending by due date
    upcoming.sort((a, b) => a.dueTime - b.dueTime)

    return {
      upcomingList: upcoming.slice(0, 5).map((item) => item.todo),
      overdueCount: overdue,
    }
  }, [tasks])

  if (upcomingList.length === 0 && overdueCount === 0) {
    return (
      <div className="upcoming-empty-card">
        <Icon name="calendar" size={20} className="upcoming-empty-icon" />
        <span className="upcoming-empty-title">No upcoming deadlines</span>
        <span className="upcoming-empty-hint">
          Add due dates to your tasks to see your schedule here.
        </span>
      </div>
    )
  }

  return (
    <div className="upcoming-widget" aria-label="Upcoming deadlines list">
      {/* Overdue alert indicator if any overdue tasks exist */}
      {overdueCount > 0 && (
        <div className="overdue-banner-compact" role="status">
          <Icon name="flag" size={12} className="overdue-icon" />
          <span>
            <strong>{overdueCount}</strong> overdue{' '}
            {overdueCount === 1 ? 'task' : 'tasks'} need attention
          </span>
        </div>
      )}

      {upcomingList.length > 0 ? (
        <ul className="upcoming-list">
          {upcomingList.map((t) => {
            const dueStatus = formatDueDate(t.dueDate)
            const priority = t.priority || 'medium'

            return (
              <li key={t.id} className="upcoming-item">
                <button
                  type="button"
                  className={`upcoming-checkbox ${
                    t.completed ? 'completed' : ''
                  }`}
                  onClick={() => onToggle(t.id)}
                  aria-label={`Mark "${t.todo}" as completed`}
                >
                  {t.completed && <Icon name="check" size={10} />}
                </button>

                <div className="upcoming-details">
                  <span className="upcoming-title" title={t.todo}>
                    {t.todo}
                  </span>
                  <div className="upcoming-meta">
                    {dueStatus && (
                      <span
                        className={`upcoming-due-badge ${
                          dueStatus.isToday ? 'is-today' : ''
                        }`}
                      >
                        {dueStatus.label}
                      </span>
                    )}
                    <span className={`upcoming-priority priority-${priority}`}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="upcoming-empty-card compact">
          <span className="upcoming-empty-hint">
            No future deadlines scheduled for today or later.
          </span>
        </div>
      )}
    </div>
  )
}
