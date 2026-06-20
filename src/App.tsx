import { FilterTabs } from './components/FilterTabs'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import { useTodos } from './hooks/useTodos'
import './App.css'

function App() {
  const {
    todos,
    filter,
    setFilter,
    loading,
    error,
    setError,
    actionLoading,
    stats,
    addTodo,
    toggleTodo,
    editTodo,
    removeTodo,
    clearCompleted,
    resetFromApi,
  } = useTodos()

  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="app">
      <div className="app-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <main className="dashboard">
        <aside className="sidebar animate-in" style={{ animationDelay: '0ms' }}>
          <header className="header">
            <h1>Task Manager</h1>
            <p className="subtitle">Organize your day, one task at a time</p>
          </header>

          <section className="card stats-card">
            <div className="stat">
              <span className="stat-value" key={stats.total}>{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat">
              <span className="stat-value" key={stats.active}>{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat">
              <span className="stat-value" key={stats.completed}>{stats.completed}</span>
              <span className="stat-label">Done</span>
            </div>
            <div className="progress-ring">
              <svg viewBox="0 0 36 36">
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
        </aside>

        <section className="main-panel animate-in" style={{ animationDelay: '120ms' }}>
          {error && (
            <div className="error-banner slide-down" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
                ✕
              </button>
            </div>
          )}

          <div className="card task-card">
            <TaskForm onAdd={addTodo} disabled={loading || actionLoading} />
            <FilterTabs filter={filter} onChange={setFilter} stats={stats} />

            <div className="task-scroll">
              {loading ? (
                <div className="loading">
                  <div className="spinner" />
                  <p>Loading tasks from API...</p>
                </div>
              ) : (
                <TaskList
                  todos={todos}
                  onToggle={toggleTodo}
                  onEdit={editTodo}
                  onDelete={removeTodo}
                />
              )}
            </div>

            {stats.completed > 0 && !loading && (
              <footer className="card-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={clearCompleted}
                  disabled={actionLoading}
                >
                  Clear completed ({stats.completed})
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={resetFromApi}
                  disabled={actionLoading}
                >
                  Reset from API
                </button>
              </footer>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
