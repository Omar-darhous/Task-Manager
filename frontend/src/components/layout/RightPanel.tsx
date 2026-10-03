import type { Todo } from '../../types/todo'
import { StatsWidget } from '../dashboard/StatsWidget'
import { MiniCalendar } from '../dashboard/MiniCalendar'
import { UpcomingTasks } from '../dashboard/UpcomingTasks'

interface RightPanelProps {
  stats: {
    total: number
    active: number
    completed: number
  }
  progress: number
  tasks: Todo[]
  selectedDate?: string | null
  onSelectDate?: (dateStr: string | null) => void
  onToggleTask: (id: string | number) => void
}

export function RightPanel({
  stats,
  progress,
  tasks,
  selectedDate = null,
  onSelectDate,
  onToggleTask,
}: RightPanelProps) {
  return (
    <aside className="app-right-panel" aria-label="Information panel">
      {/* 1. Progress Overview */}
      <div className="panel-section">
        <div className="panel-section-header">
          <span className="panel-section-title">Progress Overview</span>
        </div>
        <StatsWidget
          total={stats.total}
          active={stats.active}
          completed={stats.completed}
          progress={progress}
        />
      </div>

      {/* 2. Interactive Mini Calendar */}
      <div className="panel-section">
        <div className="panel-section-header">
          <span className="panel-section-title">Calendar</span>
        </div>
        <MiniCalendar
          tasks={tasks}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />
      </div>

      {/* 3. Upcoming Deadlines */}
      <div className="panel-section">
        <div className="panel-section-header">
          <span className="panel-section-title">Upcoming</span>
        </div>
        <UpcomingTasks tasks={tasks} onToggle={onToggleTask} />
      </div>
    </aside>
  )
}
