import { useState, useMemo, type FormEvent } from 'react'
import { Icon, type IconName } from '../ui/Icon'

export type NavItemKey = 'tasks' | 'today' | 'calendar' | 'focus' | 'completed' | 'settings'

export interface SidebarCategory {
  _id: string
  name: string
}

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  activeNav?: NavItemKey
  onSelectNav?: (key: NavItemKey) => void
  activeCategory?: string
  onSelectCategory?: (category?: string) => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
  categoryCounts?: Record<string, number>
  navCounts?: Record<string, number>
  categories?: SidebarCategory[]
  onAddCategory?: (name: string) => Promise<void>
  onRenameCategory?: (id: string, name: string) => Promise<void>
  onDeleteCategory?: (id: string, name: string) => Promise<void>
  onOpenSettings?: () => void
}

interface NavItem {
  key: NavItemKey
  label: string
  icon: IconName
  badge?: number
}

const navItems: NavItem[] = [
  { key: 'tasks', label: 'Tasks', icon: 'checklist' },
  { key: 'today', label: 'Today', icon: 'calendar' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'focus', label: 'Focus Mode', icon: 'target' },
  { key: 'completed', label: 'Completed', icon: 'check-circle' },
]

function getCategoryIcon(name: string): IconName {
  const lower = name.toLowerCase()
  if (lower === 'personal') return 'user'
  if (lower === 'work') return 'briefcase'
  if (lower === 'study') return 'book'
  if (lower === 'finance') return 'wallet'
  return 'tag'
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  activeNav = 'tasks',
  onSelectNav,
  activeCategory,
  onSelectCategory,
  isMobileOpen = false,
  onCloseMobile,
  categoryCounts,
  navCounts,
  categories = [],
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onOpenSettings,
}: SidebarProps) {
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')

  // Default fallback and preset list
  const defaultPresets: SidebarCategory[] = useMemo(
    () => [
      { _id: 'general', name: 'General' },
      { _id: 'personal', name: 'Personal' },
      { _id: 'work', name: 'Work' },
      { _id: 'study', name: 'Study' },
      { _id: 'finance', name: 'Finance' },
    ],
    []
  )

  // Merge presets with custom categories belonging to the user
  const displayCategories: SidebarCategory[] = useMemo(() => {
    if (!categories || categories.length === 0) {
      return defaultPresets
    }
    const existingNames = new Set(defaultPresets.map((c) => c.name.toLowerCase()))
    const result: SidebarCategory[] = [...defaultPresets]
    for (const cat of categories) {
      if (!existingNames.has(cat.name.toLowerCase())) {
        existingNames.add(cat.name.toLowerCase())
        result.push(cat)
      }
    }
    return result
  }, [categories, defaultPresets])

  const isPresetCategory = (id: string) =>
    ['general', 'personal', 'work', 'study', 'finance'].includes(id.toLowerCase())

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newCatName.trim()
    if (!trimmed || !onAddCategory) return
    await onAddCategory(trimmed)
    setNewCatName('')
    setIsAddingCategory(false)
  }

  const handleRenameSubmit = async (id: string) => {
    const trimmed = editingCatName.trim()
    if (!trimmed || !onRenameCategory) {
      setEditingCatId(null)
      return
    }
    await onRenameCategory(id, trimmed)
    setEditingCatId(null)
  }

  const handleDeleteClick = async (cat: SidebarCategory) => {
    if (isPresetCategory(cat._id) || cat.name.toLowerCase() === 'general') return
    const confirmed = window.confirm(
      `Delete category "${cat.name}"? All existing tasks in this category will be moved to "General".`
    )
    if (confirmed && onDeleteCategory) {
      await onDeleteCategory(cat._id, cat.name)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Application navigation"
      >
        {/* Brand Area */}
        <div className="sidebar-brand">
          {!collapsed && (
            <div className="brand-info">
              <span className="brand-title">TaskFlow</span>
              <span className="brand-subtitle">Plan. Focus. Finish.</span>
            </div>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              className="btn-collapse-toggle desktop-only"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Icon
                name={collapsed ? 'chevron-right' : 'chevron-left'}
                size={14}
              />
            </button>
          )}
          {onCloseMobile && (
            <button
              type="button"
              className="btn-close-mobile mobile-only"
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="sidebar-section">
          {!collapsed && <span className="section-label">Navigation</span>}
          <ul className="nav-list">
            {navItems.map((item) => {
              const isActive = activeNav === item.key
              const count = navCounts?.[item.key]
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectNav?.(item.key)
                      onCloseMobile?.()
                    }}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon name={item.icon} size={18} className="nav-icon" />
                    {!collapsed && <span className="nav-text">{item.label}</span>}
                    {!collapsed && typeof count === 'number' && count > 0 && (
                      <span className="nav-count-badge">{count}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Categories Section */}
        <div className="sidebar-section categories-section">
          {!collapsed && <span className="section-label">Categories</span>}
          <ul className="nav-list">
            {displayCategories.map((cat) => {
              const isActive = activeCategory === cat.name
              const count = categoryCounts?.[cat.name]
              const isGeneral = cat.name.toLowerCase() === 'general'
              const isEditing = editingCatId === cat._id

              if (isEditing && !collapsed) {
                return (
                  <li key={cat._id} className="sidebar-add-cat-inline">
                    <input
                      type="text"
                      className="sidebar-add-cat-input"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(cat._id)
                        if (e.key === 'Escape') setEditingCatId(null)
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleRenameSubmit(cat._id)}
                      aria-label="Save rename"
                    >
                      <Icon name="check" size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setEditingCatId(null)}
                      aria-label="Cancel rename"
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </li>
                )
              }

              return (
                <li key={cat._id || cat.name} className="category-nav-wrapper">
                  <button
                    type="button"
                    className={`nav-item category-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectCategory?.(isActive ? undefined : cat.name)
                      onCloseMobile?.()
                    }}
                    title={collapsed ? cat.name : undefined}
                  >
                    <Icon name={getCategoryIcon(cat.name)} size={17} className="nav-icon" />
                    {!collapsed && <span className="nav-text">{cat.name}</span>}
                    {!collapsed && typeof count === 'number' && count > 0 && (
                      <span className="nav-count-badge category-count-badge">{count}</span>
                    )}
                  </button>

                  {!collapsed && (
                    <div className="category-sidebar-actions">
                      {onRenameCategory && !isPresetCategory(cat._id) && (
                        <button
                          type="button"
                          className="btn-cat-action"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCatId(cat._id)
                            setEditingCatName(cat.name)
                          }}
                          aria-label={`Rename ${cat.name}`}
                          title="Rename category"
                        >
                          <Icon name="edit" size={12} />
                        </button>
                      )}
                      {!isGeneral && onDeleteCategory && !isPresetCategory(cat._id) && (
                        <button
                          type="button"
                          className="btn-cat-action btn-cat-delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(cat)
                          }}
                          aria-label={`Delete ${cat.name}`}
                          title="Delete category"
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {!collapsed && (
            isAddingCategory ? (
              <form className="sidebar-add-cat-inline" onSubmit={handleAddSubmit}>
                <input
                  type="text"
                  className="sidebar-add-cat-input"
                  placeholder="Category name..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  autoFocus
                  maxLength={50}
                  aria-label="New category name"
                />
                <button type="submit" className="btn-icon" aria-label="Add category">
                  <Icon name="check" size={12} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => {
                    setIsAddingCategory(false)
                    setNewCatName('')
                  }}
                  aria-label="Cancel"
                >
                  <Icon name="close" size={12} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="btn-add-category"
                onClick={() => setIsAddingCategory(true)}
                aria-label="Add category"
              >
                <Icon name="plus" size={14} />
                <span>Add category</span>
              </button>
            )
          )}
        </div>

        {/* Footer / Settings Link */}
        <div className="sidebar-footer">
          <button
            type="button"
            className={`nav-item settings-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => {
              onSelectNav?.('settings')
              onOpenSettings?.()
              onCloseMobile?.()
            }}
            title={collapsed ? 'Settings' : undefined}
            aria-current={activeNav === 'settings' ? 'page' : undefined}
          >
            <Icon name="settings" size={17} className="nav-icon" />
            {!collapsed && <span className="nav-text">Settings</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

