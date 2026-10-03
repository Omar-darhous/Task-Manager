type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|jwt|creditcard|hash/i

/**
 * Recursively sanitizes objects to prevent leaking credentials, tokens, or hashes into logs.
 */
export function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 5 || data === null || data === undefined) return data

  if (typeof data === 'string') {
    // Mask potential MongoDB connection strings
    let sanitized = data.replace(/\/\/[^@]+@/, '//***:***@')
    // Mask potential JWT tokens (three base64 segments)
    sanitized = sanitized.replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]')
    return sanitized
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message.replace(/\/\/[^@]+@/, '//***:***@'),
      stack: process.env.NODE_ENV === 'production' ? undefined : data.stack,
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1))
  }

  if (typeof data === 'object') {
    const cleanObj: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.test(key)) {
        cleanObj[key] = '[REDACTED]'
      } else {
        cleanObj[key] = sanitizeLogData(val, depth + 1)
      }
    }
    return cleanObj
  }

  return data
}

function formatLog(level: LogLevel, message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString()
  const sanitizedArgs = args.map((arg) => sanitizeLogData(arg))
  const prefix = `[${level.toUpperCase()}] ${timestamp} - ${message}`

  switch (level) {
    case 'error':
      if (sanitizedArgs.length > 0) {
        console.error(prefix, ...sanitizedArgs)
      } else {
        console.error(prefix)
      }
      break
    case 'warn':
      if (sanitizedArgs.length > 0) {
        console.warn(prefix, ...sanitizedArgs)
      } else {
        console.warn(prefix)
      }
      break
    case 'debug':
      if (process.env.NODE_ENV !== 'production') {
        if (sanitizedArgs.length > 0) {
          console.debug(prefix, ...sanitizedArgs)
        } else {
          console.debug(prefix)
        }
      }
      break
    case 'info':
    default:
      if (sanitizedArgs.length > 0) {
        console.log(prefix, ...sanitizedArgs)
      } else {
        console.log(prefix)
      }
      break
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => formatLog('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => formatLog('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => formatLog('error', message, ...args),
  debug: (message: string, ...args: unknown[]) => formatLog('debug', message, ...args),
}
