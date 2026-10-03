interface StatsWidgetProps {
  total: number
  active: number
  completed: number
  progress: number
}

export function StatsWidget({ total, active, completed, progress }: StatsWidgetProps) {
  return (
    <section className="card stats-card" aria-label="Task progress and statistics">
      <div className="stat">
        <span className="stat-value" key={total}>
          {total}
        </span>
        <span className="stat-label">Total</span>
      </div>
      <div className="stat">
        <span className="stat-value" key={active}>
          {active}
        </span>
        <span className="stat-label">Active</span>
      </div>
      <div className="stat">
        <span className="stat-value" key={completed}>
          {completed}
        </span>
        <span className="stat-label">Done</span>
      </div>
      <div className="progress-ring">
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <path
            className="progress-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="progress-fill"
            strokeDasharray={`${progress}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="progress-text">{progress}%</span>
      </div>
    </section>
  )
}
