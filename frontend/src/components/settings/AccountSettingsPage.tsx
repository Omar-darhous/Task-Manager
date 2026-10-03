import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { updateProfileApi, changePasswordApi } from '../../services/userApi'
import { useCategories } from '../../hooks/useCategories'
import { Icon } from '../ui/Icon'
import { ApiError } from '../../services/apiClient'

interface AccountSettingsPageProps {
  onBack: () => void
  onShowToast: (message: string) => void
  onCategoryChange?: () => void
}

export function AccountSettingsPage({ onBack, onShowToast, onCategoryChange }: AccountSettingsPageProps) {
  const { user, updateUser } = useAuth()
  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    renameCategory,
    removeCategory,
  } = useCategories()

  // ── Profile Form State ──
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  // ── Password Form State ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // ── Category Management State ──
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [categoryActionLoading, setCategoryActionLoading] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // ── Profile Submit ──
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName || trimmedName.length < 2) {
      setProfileError('Name must be at least 2 characters long.')
      return
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setProfileError('Please enter a valid email address.')
      return
    }

    if (trimmedName === user?.name && trimmedEmail === user?.email) {
      setProfileError('No changes detected.')
      return
    }

    setProfileSaving(true)
    try {
      const updatedUser = await updateProfileApi({
        name: trimmedName,
        email: trimmedEmail,
      })

      // Immediate Auth state & storage sync (STEP 7)
      updateUser(updatedUser)
      setProfileSuccess('Profile updated successfully!')
      onShowToast('Profile updated successfully')
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileError(err.message)
      } else {
        setProfileError('Failed to update profile. Please try again.')
      }
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Password Submit ──
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!currentPassword) {
      setPasswordError('Current password is required.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.')
      return
    }

    setPasswordSaving(true)
    try {
      const result = await changePasswordApi({
        currentPassword,
        newPassword,
      })

      setPasswordSuccess(result.message || 'Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onShowToast('Password updated successfully')
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message)
      } else {
        setPasswordError('Failed to change password. Please check your credentials.')
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  // ── Category Handlers ──
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault()
    setCategoryError(null)
    const trimmed = newCategoryName.trim()
    if (!trimmed) return

    setCategoryActionLoading(true)
    try {
      await addCategory(trimmed)
      setNewCategoryName('')
      setAddingCategory(false)
      onShowToast(`Category '${trimmed}' created`)
      onCategoryChange?.()
    } catch (err) {
      if (err instanceof ApiError) {
        setCategoryError(err.message)
      } else {
        setCategoryError('Failed to add category.')
      }
    } finally {
      setCategoryActionLoading(false)
    }
  }

  const handleSaveCategoryRename = async (id: string) => {
    const trimmed = editingCategoryName.trim()
    if (!trimmed) {
      setEditingCategoryId(null)
      return
    }

    setCategoryActionLoading(true)
    setCategoryError(null)
    try {
      await renameCategory(id, trimmed)
      setEditingCategoryId(null)
      onShowToast(`Category renamed to '${trimmed}'`)
      onCategoryChange?.()
    } catch (err) {
      if (err instanceof ApiError) {
        setCategoryError(err.message)
      } else {
        setCategoryError('Failed to rename category.')
      }
    } finally {
      setCategoryActionLoading(false)
    }
  }

  const handleConfirmCategoryDelete = async (id: string, name: string) => {
    setCategoryActionLoading(true)
    setCategoryError(null)
    try {
      await removeCategory(id)
      setDeletingCategoryId(null)
      onShowToast(`Category '${name}' deleted. Tasks reassigned to General.`)
      onCategoryChange?.()
    } catch (err) {
      if (err instanceof ApiError) {
        setCategoryError(err.message)
      } else {
        setCategoryError('Failed to delete category.')
      }
    } finally {
      setCategoryActionLoading(false)
    }
  }

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <div className="settings-page" role="main" aria-label="Account Settings">
      {/* Top Header & Back Button */}
      <div className="settings-header">
        <button
          type="button"
          className="btn-back"
          onClick={onBack}
          aria-label="Back to tasks"
        >
          <Icon name="chevron-left" size={16} />
          <span>Back to Tasks</span>
        </button>

        <div className="settings-title-group">
          <h2 className="greeting-title">Account Settings</h2>
          <p className="greeting-subtitle">
            Manage your personal profile, security credentials, and organization
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* ── Section 1: Profile Information ── */}
        <section className="card settings-card" aria-labelledby="profile-heading">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Icon name="user" size={20} />
            </div>
            <div>
              <h3 id="profile-heading" className="settings-card-title">
                Profile Information
              </h3>
              <p className="settings-card-desc">
                Update your display name and email address
              </p>
            </div>
          </div>

          <div className="settings-avatar-row">
            <div className="user-avatar settings-avatar" aria-hidden="true">
              <span>{initials}</span>
            </div>
            <div className="settings-avatar-info">
              <span className="settings-user-name">{user?.name || 'User'}</span>
              <span className="settings-user-role-badge">
                <Icon name="check-circle" size={12} />
                <span>{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</span>
              </span>
            </div>
          </div>

          {profileError && (
            <div className="settings-alert alert-error" role="alert">
              <Icon name="close" size={14} />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="settings-alert alert-success" role="status">
              <Icon name="check" size={14} />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form className="settings-form" onSubmit={handleProfileSubmit}>
            <div className="settings-field">
              <label htmlFor="settings-name" className="settings-label">
                Full Name
              </label>
              <input
                id="settings-name"
                type="text"
                className="settings-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setProfileError(null)
                  setProfileSuccess(null)
                }}
                required
                minLength={2}
                maxLength={50}
                disabled={profileSaving}
                autoComplete="name"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-email" className="settings-label">
                Email Address
              </label>
              <input
                id="settings-email"
                type="email"
                className="settings-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setProfileError(null)
                  setProfileSuccess(null)
                }}
                required
                disabled={profileSaving}
                autoComplete="email"
              />
            </div>

            <div className="settings-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={profileSaving || (name.trim() === user?.name && email.trim().toLowerCase() === user?.email)}
              >
                {profileSaving ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ── Section 2: Security & Password ── */}
        <section className="card settings-card" aria-labelledby="security-heading">
          <div className="settings-card-header">
            <div className="settings-card-icon security-icon">
              <Icon name="target" size={20} />
            </div>
            <div>
              <h3 id="security-heading" className="settings-card-title">
                Security & Password
              </h3>
              <p className="settings-card-desc">
                Ensure your account is protected with a secure password
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="settings-alert alert-error" role="alert">
              <Icon name="close" size={14} />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="settings-alert alert-success" role="status">
              <Icon name="check" size={14} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form className="settings-form" onSubmit={handlePasswordSubmit}>
            <div className="settings-field">
              <label htmlFor="settings-curr-pass" className="settings-label">
                Current Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="settings-curr-pass"
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="settings-input"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setPasswordError(null)
                    setPasswordSuccess(null)
                  }}
                  required
                  disabled={passwordSaving}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPassword((s) => !s)}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  tabIndex={0}
                >
                  <Icon name={showCurrentPassword ? 'eye-off' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-new-pass" className="settings-label">
                New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="settings-new-pass"
                  type={showNewPassword ? 'text' : 'password'}
                  className="settings-input"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordError(null)
                    setPasswordSuccess(null)
                  }}
                  required
                  minLength={8}
                  disabled={passwordSaving}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword((s) => !s)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  tabIndex={0}
                >
                  <Icon name={showNewPassword ? 'eye-off' : 'eye'} size={16} />
                </button>
              </div>
              <span className="field-hint">Must be at least 8 characters long</span>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-conf-pass" className="settings-label">
                Confirm New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="settings-conf-pass"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="settings-input"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError(null)
                    setPasswordSuccess(null)
                  }}
                  required
                  disabled={passwordSaving}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  tabIndex={0}
                >
                  <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            <div className="settings-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  passwordSaving ||
                  !currentPassword ||
                  !newPassword ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
              >
                {passwordSaving ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ── Section 3: Category Management ── */}
        <section className="card settings-card" aria-labelledby="categories-heading">
          <div className="settings-card-header">
            <div className="settings-card-icon category-icon">
              <Icon name="tag" size={20} />
            </div>
            <div className="settings-card-title-row">
              <div>
                <h3 id="categories-heading" className="settings-card-title">
                  Category Management
                </h3>
                <p className="settings-card-desc">
                  Create and organize task categories for your workspace
                </p>
              </div>
            </div>
          </div>

          {categoryError && (
            <div className="settings-alert alert-error" role="alert">
              <Icon name="close" size={14} />
              <span>{categoryError}</span>
            </div>
          )}

          <div className="categories-list-container">
            {categoriesLoading ? (
              <div className="categories-loading">
                <span className="btn-spinner" />
                <span>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <p className="categories-empty-hint">
                No custom categories yet. Add one below to organize your tasks.
              </p>
            ) : (
              <ul className="settings-categories-list" aria-label="Existing categories">
                {categories.map((cat) => {
                  const isEditing = editingCategoryId === cat._id
                  const isDeleting = deletingCategoryId === cat._id
                  const isGeneral = cat.name.toLowerCase() === 'general'

                  return (
                    <li key={cat._id} className="settings-category-item">
                      {isEditing ? (
                        <div className="category-edit-form">
                          <input
                            type="text"
                            className="settings-input category-inline-input"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCategoryRename(cat._id)
                              if (e.key === 'Escape') setEditingCategoryId(null)
                            }}
                            autoFocus
                            maxLength={50}
                            aria-label={`Rename category ${cat.name}`}
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSaveCategoryRename(cat._id)}
                            disabled={categoryActionLoading || !editingCategoryName.trim()}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingCategoryId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : isDeleting ? (
                        <div className="category-confirm-delete" role="alert">
                          <span>Delete <strong>{cat.name}</strong>? Tasks will move to General.</span>
                          <div className="confirm-btn-group">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleConfirmCategoryDelete(cat._id, cat.name)}
                              disabled={categoryActionLoading}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDeletingCategoryId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="category-row-display">
                          <div className="category-badge-name">
                            <Icon name="tag" size={14} />
                            <span>{cat.name}</span>
                            {isGeneral && <span className="default-pill">Default</span>}
                          </div>

                          <div className="category-actions-group">
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => {
                                setEditingCategoryId(cat._id)
                                setEditingCategoryName(cat.name)
                                setDeletingCategoryId(null)
                              }}
                              aria-label={`Rename category ${cat.name}`}
                              title="Rename category"
                            >
                              <Icon name="edit" size={14} />
                            </button>

                            {!isGeneral && (
                              <button
                                type="button"
                                className="btn-icon btn-delete"
                                onClick={() => {
                                  setDeletingCategoryId(cat._id)
                                  setEditingCategoryId(null)
                                }}
                                aria-label={`Delete category ${cat.name}`}
                                title="Delete category"
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Add Category Trigger / Form */}
            {addingCategory ? (
              <form className="add-category-form" onSubmit={handleAddCategory}>
                <input
                  type="text"
                  className="settings-input"
                  placeholder="e.g., Marketing, Health, Projects"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  maxLength={50}
                  autoFocus
                  required
                  disabled={categoryActionLoading}
                  aria-label="New category name"
                />
                <div className="add-category-btns">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={categoryActionLoading || !newCategoryName.trim()}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setAddingCategory(false)
                      setNewCategoryName('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-add-cat"
                onClick={() => setAddingCategory(true)}
              >
                <Icon name="plus" size={15} />
                <span>Add new category</span>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
