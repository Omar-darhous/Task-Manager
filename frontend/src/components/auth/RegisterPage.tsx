import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../services/apiClient'
import { Icon } from '../ui/Icon'

interface RegisterPageProps {
  onSwitchToLogin: () => void
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = (): boolean => {
    const errors: {
      name?: string
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      errors.name = 'Full name is required'
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters long'
    } else if (trimmedName.length > 50) {
      errors.name = 'Name cannot exceed 50 characters'
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password'
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else if (err instanceof Error) {
        setServerError(err.message)
      } else {
        setServerError('An unexpected registration error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-brand-info">
            <h1 className="auth-brand-title">TaskFlow</h1>
            <p className="auth-brand-tagline">Plan. Focus. Finish.</p>
          </div>
        </div>

        <div className="auth-header">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Get started with organized and focused task management</p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="auth-alert auth-alert-error" role="alert" aria-live="assertive">
            <span className="auth-alert-message">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Name Field */}
          <div className="auth-form-group">
            <label htmlFor="register-name" className="auth-label">
              Full name
            </label>
            <input
              id="register-name"
              type="text"
              name="name"
              autoComplete="name"
              required
              className={`auth-input ${fieldErrors.name ? 'auth-input-error' : ''}`}
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: undefined }))
                }
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
            />
            {fieldErrors.name && (
              <span id="register-name-error" className="auth-field-error">
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div className="auth-form-group">
            <label htmlFor="register-email" className="auth-label">
              Email address
            </label>
            <input
              id="register-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="register-email-error" className="auth-field-error">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="auth-form-group">
            <label htmlFor="register-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                required
                className={`auth-input ${fieldErrors.password ? 'auth-input-error' : ''}`}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={0}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} />
              </button>
            </div>
            {fieldErrors.password && (
              <span id="register-password-error" className="auth-field-error">
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="auth-form-group">
            <label htmlFor="register-confirm-password" className="auth-label">
              Confirm password
            </label>
            <div className="auth-input-wrapper">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                required
                className={`auth-input ${fieldErrors.confirmPassword ? 'auth-input-error' : ''}`}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword ? 'register-confirm-password-error' : undefined
                }
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={0}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={16} />
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span id="register-confirm-password-error" className="auth-field-error">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="auth-btn-spinner-content">
                <span className="btn-spinner" aria-hidden="true" />
                <span>Creating account...</span>
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer toggle */}
        <div className="auth-footer">
          <span className="auth-footer-text">Already have an account?</span>{' '}
          <button
            type="button"
            className="auth-link-button"
            onClick={onSwitchToLogin}
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
