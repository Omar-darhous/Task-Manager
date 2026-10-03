import app from './app.js'
import { env } from './config/environment.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { logger } from './utils/logger.js'

async function startServer(): Promise<void> {
  try {
    // Attempt database connection
    try {
      await connectDatabase()
    } catch (dbError) {
      logger.warn(
        `MongoDB connection could not be established: ${(dbError as Error).message}. ` +
          'Ensure MongoDB is running and MONGODB_URI is correctly configured in your .env file.'
      )
      if (env.NODE_ENV === 'production') {
        logger.error('Production startup failed due to missing database connection.')
        process.exit(1)
      }
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`)
      logger.info(`Health check available at: http://localhost:${env.PORT}/api/health`)
      logger.info(`Readiness probe available at: http://localhost:${env.PORT}/api/health/readiness`)
      logger.info(`Liveness probe available at: http://localhost:${env.PORT}/api/health/liveness`)
      logger.info(`Swagger API docs available at: http://localhost:${env.PORT}/api/docs`)
    })

    let isShuttingDown = false

    const gracefulShutdown = (signal: string) => {
      if (isShuttingDown) return
      isShuttingDown = true

      logger.info(`Received ${signal}. Initiating graceful shutdown...`)

      // Set a forced timeout in case connections do not close cleanly
      const forceShutdownTimer = setTimeout(() => {
        logger.error('Graceful shutdown timed out after 10s. Forcing exit.')
        process.exit(1)
      }, 10000)
      forceShutdownTimer.unref()

      server.close(async (err) => {
        if (err) {
          logger.error('Error closing HTTP server:', err.message)
        } else {
          logger.info('HTTP server stopped accepting new requests.')
        }

        try {
          await disconnectDatabase()
          logger.info('Graceful shutdown completed successfully.')
          process.exit(0)
        } catch (dbErr) {
          logger.error('Error during database disconnection:', (dbErr as Error).message)
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason)
    })

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err)
      gracefulShutdown('uncaughtException')
    })
  } catch (error) {
    logger.error('Fatal error during server startup:', (error as Error).message)
    process.exit(1)
  }
}

void startServer()
