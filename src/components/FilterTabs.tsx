import type { FilterStatus } from '../types/todo'

interface FilterTabsProps {
  filter: FilterStatus
  onChange: (filter: FilterStatus) => void
  stats: { total: number; active: number; completed: number }
}

const tabs: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
]

export function FilterTabs({ filter, onChange, stats }: FilterTabsProps) {
  const counts: Record<FilterStatus, number> = {
    all: stats.total,
    active: stats.active,
    completed: stats.completed,
  }

  return (
    <div className="filter-tabs">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`filter-tab ${filter === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
          <span className="filter-count">{counts[key]}</span>
        </button>
      ))}
    </div>
  )
}
