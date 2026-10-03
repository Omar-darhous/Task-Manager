import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/environment.js'
import apiRouter from './routes/api.router.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'

const app: Express = express()

// 1. Request logging (lightweight, structured)
app.use(requestLogger)

// 2. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
)

// 3. CORS configuration (strict origin checking, supports comma-separated list)
const allowedOrigins = env.CLIENT_URL.split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests with no origin (e.g. server-to-server, curl, health probes)
      if (!origin) {
        callback(null, true)
        return
      }
      const normalizedOrigin = origin.replace(/\/+$/, '')
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// 4. Rate Limiting (100 requests per 15 minutes in production; relaxed in dev/test for test suites)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },
})

app.use('/api', limiter)

// 5. Body parsers with size limit
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// 6. Mount API routes
app.use('/api', apiRouter)

// 7. 404 handler for unknown routes
app.use(notFoundHandler)

// 8. Centralized Error Handler
app.use(errorHandler)

export default app
