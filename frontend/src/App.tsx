import { useState, useMemo, useEffect, useCallback } from 'react'
import type { Todo } from './types/todo'
import { useTodos } from './hooks/useTodos'
import { useCategories } from './hooks/useCategories'
import { useTheme } from './hooks/useTheme'
import { useAuth } from './auth/useAuth'
import { LoginPage } from './components/auth/LoginPage'
import { RegisterPage } from './components/auth/RegisterPage'
import { getTodayYMD } from './utils/date'
import {
  filterTasks,
  getCategoryCounts,
  getNavCounts,
} from './utils/taskFilters'
import { sortTasks } from './utils/taskSort'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Sidebar, type NavItemKey } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { RightPanel } from './components/layout/RightPanel'
import { ErrorBanner } from './components/dashboard/ErrorBanner'
import { TaskActions } from './components/dashboard/TaskActions'
import { TaskForm } from './components/tasks/TaskForm'
import { FilterTabs } from './components/tasks/FilterTabs'
import { TaskList } from './components/tasks/TaskList'
import { TodayView } from './components/tasks/TodayView'
import { CalendarView } from './components/calendar/CalendarView'
import { Toast, type ToastData } from './components/ui/Toast'
import { Icon } from './components/ui/Icon'
import { AccountSettingsPage } from './components/settings/AccountSettingsPage'
import { BulkActionBar } from './components/tasks/BulkActionBar'
import { ExportMenu } from './components/tasks/ExportMenu'
import './App.css'

function App() {
  const {
    allTodos,
    filter,
    setFilter,
    loading,
    error,
    setError,
    actionLoading,
    stats,
    progress,
    addTodo,
    toggleTodo,
    editTodo,
    removeTodo,
    clearCompleted,
    resetFromApi,
    bulkComplete,
    bulkActivate,
    bulkDelete,
    load,
  } = useTodos()

  const {
    categories,
    addCategory,
    renameCategory,
    removeCategory,
    loadCategories,
  } = useCategories()

  const { isAuthenticated, isLoading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'register'>(() => {
    return typeof window !== 'undefined' && window.location.pathname === '/register'
      ? 'register'
      : 'login'
  })

  const [activeNav, setActiveNav] = useState<NavItemKey>(() => {
    if (typeof window === 'undefined') return 'tasks'
    const path = window.location.pathname
    if (path === '/settings') return 'settings'
    if (path === '/calendar') return 'calendar'
    if (path === '/today') return 'today'
    if (path === '/completed') return 'completed'
    return 'tasks'
  })

  // Sync browser path with authView and navigation history events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (!isAuthenticated && !isLoading) {
        const protectedPaths = ['/', '/settings', '/calendar', '/today', '/completed']
        if (protectedPaths.includes(path)) {
          window.history.replaceState(null, '', '/login')
          return
        }
      }
      if (path === '/register') {
        setAuthView('register')
      } else if (path === '/login') {
        setAuthView('login')
      } else if (path === '/settings') {
        setActiveNav('settings')
      } else if (path === '/calendar') {
        setActiveNav('calendar')
      } else if (path === '/today') {
        setActiveNav('today')
      } else if (path === '/completed') {
        setActiveNav('completed')
      } else if (path === '/') {
        setActiveNav('tasks')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isAuthenticated, isLoading])

  // When unauthenticated, normalize protected paths to /login
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      const protectedPaths = ['/', '/settings', '/calendar', '/today', '/completed']
      if (protectedPaths.includes(window.location.pathname)) {
        window.history.replaceState(null, '', '/login')
      }
    }
  }, [isAuthenticated, isLoading])

  // When authenticated, ensure URL pathname does not linger on /login or /register
  useEffect(() => {
    if (isAuthenticated) {
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        window.history.replaceState(null, '', '/')
      }
    }
  }, [isAuthenticated])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | undefined>()
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<ToastData | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string | number>>(new Set())
  const { isDark, toggleTheme } = useTheme()

  const showToast = useCallback((message: string, action?: ToastData['action']) => {
    setToast({
      id: String(Date.now()),
      message,
      action,
    })
  }, [])

  // ── Dynamic Unified Categories Derivation ──
  const dynamicCategories = useMemo(() => {
    const defaultPresets = [
      { _id: 'general', name: 'General' },
      { _id: 'personal', name: 'Personal' },
      { _id: 'work', name: 'Work' },
      { _id: 'study', name: 'Study' },
      { _id: 'finance', name: 'Finance' },
    ]
    const existingNames = new Set(defaultPresets.map((c) => c.name.toLowerCase()))
    const result = [...defaultPresets]
    for (const cat of categories) {
      if (!existingNames.has(cat.name.toLowerCase())) {
        existingNames.add(cat.name.toLowerCase())
        result.push({ _id: cat._id, name: cat.name })
      }
    }
    return result
  }, [categories])

  const availableCategoryNames = useMemo(() => {
    return dynamicCategories.map((c) => c.name)
  }, [dynamicCategories])

  // ── Counts Derivation (Single Collection Truth) ──
  const categoryCounts = useMemo(() => getCategoryCounts(allTodos), [allTodos])
  const navCounts = useMemo(() => getNavCounts(allTodos), [allTodos])

  // ── Unified Filtering Pipeline (Pure Function) ──
  const filteredTasks = useMemo(() => {
    return filterTasks(allTodos, {
      activeNav,
      selectedCalendarDate,
      activeCategory,
      statusFilter: filter,
      searchQuery,
    })
  }, [
    allTodos,
    activeNav,
    selectedCalendarDate,
    activeCategory,
    filter,
    searchQuery,
  ])

  // ── Predictable Task Ordering ──
  const displayedTasks = useMemo(() => {
    return sortTasks(filteredTasks, activeNav === 'completed')
  }, [filteredTasks, activeNav])

  // ── Contextual Page Title & Subtitle ──
  const { pageTitle, pageSubtitle } = useMemo(() => {
    if (activeNav === 'settings') {
      return {
        pageTitle: 'Account Settings',
        pageSubtitle: 'Manage your personal profile, security credentials, and categories',
      }
    }
    if (activeNav === 'today') {
      const todayFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
      return {
        pageTitle: 'Today',
        pageSubtitle: `Tasks due today — ${todayFormatted}`,
      }
    }
    if (activeNav === 'completed') {
      return {
        pageTitle: 'Completed',
        pageSubtitle: `Finished tasks (${stats.completed} total)`,
      }
    }
    if (activeNav === 'calendar') {
      return {
        pageTitle: 'Calendar',
        pageSubtitle: selectedCalendarDate
          ? `Schedule for ${selectedCalendarDate}`
          : 'Schedule by date',
      }
    }
    if (activeCategory) {
      return {
        pageTitle: activeCategory,
        pageSubtitle: `${activeCategory}-related tasks`,
      }
    }
    return {
      pageTitle: 'All Tasks',
      pageSubtitle: '',
    }
  }, [activeNav, activeCategory, selectedCalendarDate, stats.completed])

  const handleNavSelect = (key: NavItemKey) => {
    setActiveNav(key)
    setSelectedTaskIds(new Set())

    if (key === 'settings') {
      window.history.pushState(null, '', '/settings')
      return
    }

    if (key === 'calendar') {
      window.history.pushState(null, '', '/calendar')
    } else if (key === 'today') {
      window.history.pushState(null, '', '/today')
    } else if (key === 'completed') {
      window.history.pushState(null, '', '/completed')
    } else if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/')
    }

    if (key !== 'calendar') {
      setSelectedCalendarDate(null)
    }
    if (key === 'completed') {
      setFilter('completed')
    } else if (key === 'tasks') {
      setFilter('all')
    }
  }

  const handleOpenSettings = () => {
    handleNavSelect('settings')
  }

  const handleBackFromSettings = () => {
    setActiveNav('tasks')
    window.history.pushState(null, '', '/')
  }

  const handleAddTask = async (
    todoData: Omit<Todo, 'id' | 'completed' | 'userId'>,
  ) => {
    let finalDueDate = todoData.dueDate
    if (!finalDueDate && activeNav === 'today') {
      finalDueDate = getTodayYMD()
    } else if (!finalDueDate && activeNav === 'calendar' && selectedCalendarDate) {
      finalDueDate = selectedCalendarDate
    }

    let finalCategory = todoData.category
    if (!finalCategory && activeCategory) {
      finalCategory = activeCategory as Todo['category']
    }

    await addTodo({
      ...todoData,
      dueDate: finalDueDate,
      category: finalCategory,
    })
    showToast('Task created')
  }

  const handleToggleTask = async (id: string | number) => {
    const target = allTodos.find((t) => t.id === id)
    await toggleTodo(id)
    if (target) {
      showToast(target.completed ? 'Task marked active' : 'Task completed')
    }
  }

  const handleEditTask = async (id: string | number, text: string) => {
    await editTodo(id, text)
    showToast('Task updated')
  }

  const handleDuplicate = async (todo: Todo) => {
    await addTodo({
      todo: `${todo.todo} (Copy)`,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate,
    })
    showToast('Task duplicated')
  }

  const handleDeleteTask = async (id: string | number) => {
    const target = allTodos.find((t) => t.id === id)
    await removeTodo(id)
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (target) {
      let restored = false
      showToast('Task deleted', {
        label: 'Undo',
        onClick: async () => {
          if (restored) return
          restored = true
          await addTodo({
            todo: target.todo,
            priority: target.priority,
            category: target.category,
            dueDate: target.dueDate,
          })
          showToast('Task restored')
        },
      })
    }
  }

  const handleClearCompleted = async () => {
    await clearCompleted()
    setSelectedTaskIds(new Set())
    showToast('Completed tasks cleared')
  }

  const handleResetFromApi = async () => {
    await resetFromApi()
    setSelectedTaskIds(new Set())
    showToast('Sample tasks reloaded')
  }

  // ── Bulk Actions Handlers ──
  const handleSelectToggle = (id: string | number) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAllVisible = () => {
    setSelectedTaskIds(new Set(displayedTasks.map((t) => t.id)))
  }

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set())
  }

  const handleBulkComplete = async () => {
    const ids = Array.from(selectedTaskIds)
    if (ids.length === 0) return
    await bulkComplete(ids)
    setSelectedTaskIds(new Set())
    showToast(`Marked ${ids.length} task${ids.length === 1 ? '' : 's'} as completed`)
  }

  const handleBulkActivate = async () => {
    const ids = Array.from(selectedTaskIds)
    if (ids.length === 0) return
    await bulkActivate(ids)
    setSelectedTaskIds(new Set())
    showToast(`Marked ${ids.length} task${ids.length === 1 ? '' : 's'} as active`)
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedTaskIds)
    if (ids.length === 0) return
    const tasksToDelete = allTodos.filter((t) => selectedTaskIds.has(t.id))

    await bulkDelete(ids)
    setSelectedTaskIds(new Set())

    // Undo bulk delete using existing Toast & Undo system (STEP 16)
    let restored = false
    showToast(`Deleted ${ids.length} task${ids.length === 1 ? '' : 's'}`, {
      label: 'Undo',
      onClick: async () => {
        if (restored) return
        restored = true
        for (const task of tasksToDelete) {
          await addTodo({
            todo: task.todo,
            priority: task.priority,
            category: task.category,
            dueDate: task.dueDate,
          })
        }
        showToast(`Restored ${tasksToDelete.length} task${tasksToDelete.length === 1 ? '' : 's'}`)
      },
    })
  }

  // ── Category Handlers for Sidebar ──
  const handleAddCategory = async (name: string) => {
    try {
      await addCategory(name)
      showToast(`Category '${name}' created`)
    } catch {
      showToast('Failed to create category')
    }
  }

  const handleRenameCategory = async (id: string, name: string) => {
    try {
      const oldCat = categories.find((c) => c._id === id)?.name
      await renameCategory(id, name)
      await load()
      if (oldCat && activeCategory === oldCat) {
        setActiveCategory(name)
      }
      showToast(`Category renamed to '${name}'`)
    } catch {
      showToast('Failed to rename category')
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      await removeCategory(id)
      await load()
      if (activeCategory === name) {
        setActiveCategory(undefined)
      }
      showToast(`Category '${name}' deleted. Tasks reassigned to General.`)
    } catch {
      showToast('Failed to delete category')
    }
  }

  const hasActiveFilters = Boolean(
    selectedCalendarDate ||
      activeCategory ||
      (activeNav !== 'tasks' && activeNav !== 'settings') ||
      searchQuery.trim(),
  )

  const clearAllFilters = () => {
    setSelectedCalendarDate(null)
    setActiveCategory(undefined)
    setActiveNav('tasks')
    setFilter('all')
    setSearchQuery('')
  }

  if (isLoading) {
    return (
      <div className="auth-loading-splash" role="status" aria-label="Loading session">
        <div className="btn-spinner" style={{ width: 28, height: 28 }} />
        <span>Loading TaskFlow...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onSwitchToLogin={() => {
            setAuthView('login')
            window.history.pushState(null, '', '/login')
          }}
        />
      )
    }
    return (
      <LoginPage
        onSwitchToRegister={() => {
          setAuthView('register')
          window.history.pushState(null, '', '/register')
        }}
      />
    )
  }

  return (
    <DashboardLayout
      collapsed={sidebarCollapsed}
      sidebar={
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          activeNav={activeNav}
          onSelectNav={handleNavSelect}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat)
            if (activeNav === 'settings') {
              setActiveNav('tasks')
              window.history.pushState(null, '', '/')
            }
          }}
          isMobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          categoryCounts={categoryCounts}
          navCounts={navCounts}
          categories={dynamicCategories}
          onAddCategory={handleAddCategory}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onOpenSettings={handleOpenSettings}
        />
      }
      topBar={
        <TopBar
          title={pageTitle}
          subtitle={pageSubtitle}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileMenu={() => setMobileNavOpen((o) => !o)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onOpenSettings={handleOpenSettings}
        />
      }
      rightPanel={
        <RightPanel
          stats={stats}
          progress={progress}
          tasks={allTodos}
          selectedDate={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
          onToggleTask={handleToggleTask}
        />
      }
    >
      {/* Settings View */}
      {activeNav === 'settings' ? (
        <AccountSettingsPage
          onBack={handleBackFromSettings}
          onShowToast={showToast}
          onCategoryChange={async () => {
            await load()
            await loadCategories()
          }}
        />
      ) : (
        <>
          {/* Workspace Header / Page Context */}
          <div className="workspace-header">
            <h2 className="greeting-title">{pageTitle}</h2>
            {pageSubtitle && <p className="greeting-subtitle">{pageSubtitle}</p>}
          </div>

          {/* Active Filter Indicators Bar */}
          {hasActiveFilters && (
            <div
              className="active-filter-chips-bar"
              role="status"
              aria-label="Active filters"
            >
              <span className="filter-chips-label">Filters:</span>
              {activeNav !== 'tasks' && (
                <span className="filter-chip">
                  <Icon name="checklist" size={12} />
                  <span>
                    {activeNav === 'today'
                      ? 'Today'
                      : activeNav === 'calendar'
                        ? 'Calendar'
                        : activeNav === 'completed'
                          ? 'Completed'
                          : activeNav}
                  </span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => {
                      setActiveNav('tasks')
                      setFilter('all')
                    }}
                    aria-label="Remove navigation view filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {activeCategory && (
                <span className="filter-chip">
                  <Icon name="tag" size={12} />
                  <span>{activeCategory}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => setActiveCategory(undefined)}
                    aria-label={`Remove ${activeCategory} category filter`}
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedCalendarDate && (
                <span className="filter-chip">
                  <Icon name="calendar" size={12} />
                  <span>{selectedCalendarDate}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => setSelectedCalendarDate(null)}
                    aria-label="Remove date filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="filter-chip">
                  <Icon name="search" size={12} />
                  <span>"{searchQuery}"</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                type="button"
                className="clear-all-filters-btn"
                onClick={clearAllFilters}
              >
                Clear all
              </button>
            </div>
          )}

          <ErrorBanner error={error} onDismiss={() => setError(null)} />

          {/* Main Task Workspace Card */}
          <div className="card task-card">
            {/* Task creation input form */}
            <TaskForm
              onAdd={handleAddTask}
              disabled={loading || actionLoading}
              availableCategories={availableCategoryNames}
            />

            {/* Status Filter Tabs (All / Active / Done) & Export Menu */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.25rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {activeNav !== 'calendar' ? (
                <FilterTabs filter={filter} onChange={setFilter} stats={stats} />
              ) : (
                <div />
              )}
              <ExportMenu tasks={displayedTasks} onShowToast={showToast} />
            </div>

            <div className="task-scroll">
              {loading ? (
                <div className="loading">
                  <div className="spinner" />
                  <p>Loading tasks from API...</p>
                </div>
              ) : activeNav === 'calendar' ? (
                <CalendarView
                  tasks={filteredTasks}
                  selectedDate={selectedCalendarDate}
                  onSelectDate={setSelectedCalendarDate}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onDuplicate={handleDuplicate}
                />
              ) : activeNav === 'today' ? (
                <TodayView
                  todos={displayedTasks}
                  searchQuery={searchQuery}
                  activeCategory={activeCategory}
                  selectedIds={selectedTaskIds}
                  onSelectToggle={handleSelectToggle}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onDuplicate={handleDuplicate}
                />
              ) : (
                <TaskList
                  todos={displayedTasks}
                  filter={filter}
                  searchQuery={searchQuery}
                  activeNav={activeNav}
                  activeCategory={activeCategory}
                  selectedDate={selectedCalendarDate}
                  selectedIds={selectedTaskIds}
                  onSelectToggle={handleSelectToggle}
                  onSelectAllVisible={handleSelectAllVisible}
                  onClearSelection={handleClearSelection}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onDuplicate={handleDuplicate}
                />
              )}
            </div>

            {/* Bulk Actions Sticky Toolbar */}
            <BulkActionBar
              selectedCount={selectedTaskIds.size}
              loading={actionLoading}
              onComplete={handleBulkComplete}
              onActivate={handleBulkActivate}
              onDelete={handleBulkDelete}
              onClearSelection={handleClearSelection}
            />

            <TaskActions
              completedCount={stats.completed}
              loading={loading}
              disabled={actionLoading}
              onClearCompleted={handleClearCompleted}
              onResetFromApi={handleResetFromApi}
            />
          </div>
        </>
      )}

      {/* Lightweight Toast Feedback & Undo */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </DashboardLayout>
  )
}

export default App
