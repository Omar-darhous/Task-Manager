import { useEffect, useRef, useState, useMemo } from 'react'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../auth/useAuth'

interface TopBarProps {
  title?: string
  subtitle?: string
  searchValue?: string
  onSearchChange?: (val: string) => void
  onToggleMobileMenu?: () => void
  isDark?: boolean
  onToggleTheme?: () => void
  onOpenSettings?: () => void
}

export function TopBar({
  title = 'All Tasks',
  subtitle,
  searchValue = '',
  onSearchChange,
  onToggleMobileMenu,
  isDark = true,
  onToggleTheme,
  onOpenSettings,
}: TopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const initials = useMemo(() => {
    if (!user || !user.name) return 'U'
    const parts = user.name.trim().split(/\s+/)
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return user.name.slice(0, 2).toUpperCase()
  }, [user])

  // Click outside to close user menu
  useEffect(() => {
    if (!userMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [userMenuOpen])

  // Keyboard shortcut listener: '/' to focus search, 'Escape' to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        const isEditable = (e.target as HTMLElement)?.isContentEditable
        if (targetTag !== 'input' && targetTag !== 'textarea' && !isEditable) {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchValue) {
          e.preventDefault()
          onSearchChange?.('')
        } else {
          searchInputRef.current?.blur()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchValue, onSearchChange])

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        {onToggleMobileMenu && (
          <button
            type="button"
            className="btn-icon mobile-menu-btn mobile-only"
            onClick={onToggleMobileMenu}
            aria-label="Open navigation menu"
          >
            <Icon name="menu" size={18} />
          </button>
        )}
        <div className="topbar-titles">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="topbar-right">
        {/* Search Field */}
        <div className="search-box">
          <Icon name="search" size={16} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Search tasks"
          />
          {searchValue ? (
            <button
              type="button"
              className="btn-search-clear"
              onClick={() => {
                onSearchChange?.('')
                searchInputRef.current?.focus()
              }}
              aria-label="Clear search query"
            >
              <Icon name="close" size={13} />
            </button>
          ) : (
            <kbd className="search-shortcut" title="Press / to search">
              /
            </kbd>
          )}
        </div>

        {/* Action icons */}
        <div className="topbar-actions">
          <button
            type="button"
            className="btn-icon topbar-action-btn"
            aria-label="Notifications"
            title="Notifications"
          >
            <Icon name="bell" size={18} />
          </button>

          <button
            type="button"
            className="btn-icon topbar-action-btn"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={18} />
          </button>

          {/* User Avatar & Dropdown */}
          <div className="user-menu-container" ref={userMenuRef}>
            <button
              type="button"
              className="user-avatar-btn"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label={`User menu for ${user?.name || 'current user'}`}
              title={user?.name ? `${user.name} (${initials})` : 'User profile'}
            >
              <div className="user-avatar">
                <span>{initials}</span>
              </div>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown-menu" role="menu" aria-label="User account menu">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-name">{user?.name || 'User'}</div>
                  <div className="user-dropdown-email">{user?.email || ''}</div>
                </div>
                {onOpenSettings && (
                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenSettings()
                    }}
                    role="menuitem"
                  >
                    <Icon name="settings" size={15} />
                    <span>Account Settings</span>
                  </button>
                )}
                <button
                  type="button"
                  className="user-dropdown-item logout-item"
                  onClick={() => {
                    setUserMenuOpen(false)
                    logout()
                  }}
                  role="menuitem"
                >
                  <Icon name="log-out" size={15} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

