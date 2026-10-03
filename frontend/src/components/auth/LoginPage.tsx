import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../services/apiClient'
import { Icon } from '../ui/Icon'

interface LoginPageProps {
  onSwitchToRegister: () => void
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {}

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
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
      await login({
        email: email.trim(),
        password,
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message)
      } else if (err instanceof Error) {
        setServerError(err.message)
      } else {
        setServerError('An unexpected authentication error occurred. Please try again.')
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
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to manage your tasks</p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="auth-alert auth-alert-error" role="alert" aria-live="assertive">
            <span className="auth-alert-message">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Field */}
          <div className="auth-form-group">
            <label htmlFor="auth-email" className="auth-label">
              Email address
            </label>
            <input
              id="auth-email"
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
              aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="auth-email-error" className="auth-field-error">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="auth-form-group">
            <label htmlFor="auth-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                className={`auth-input ${fieldErrors.password ? 'auth-input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
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
              <span id="auth-password-error" className="auth-field-error">
                {fieldErrors.password}
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
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer toggle */}
        <div className="auth-footer">
          <span className="auth-footer-text">Don't have an account?</span>{' '}
          <button
            type="button"
            className="auth-link-button"
            onClick={onSwitchToRegister}
            disabled={isSubmitting}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}
