import mongoose from 'mongoose'
import { env } from './environment.js'
import { logger } from '../utils/logger.js'

/**
 * Connect to MongoDB database using Mongoose.
 * Sanitizes connection strings to prevent credential exposure in logs.
 */
export async function connectDatabase(): Promise<void> {
  const uri = env.MONGODB_URI

  if (!uri || uri.trim() === '') {
    const errorMsg = 'MONGODB_URI is not defined. Please set MONGODB_URI in your environment or .env file.'
    logger.error(`Database connection aborted: ${errorMsg}`)
    throw new Error(errorMsg)
  }

  try {
    // Mask sensitive credentials if present in connection string
    const sanitizedUri = uri.replace(/\/\/[^@]+@/, '//***:***@')
    logger.info(`Attempting to connect to MongoDB at: ${sanitizedUri}`)

    await mongoose.connect(uri)
    logger.info('Successfully connected to MongoDB')
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', (error as Error).message)
    throw error
  }
}

/**
 * Disconnect from MongoDB gracefully.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    logger.info('Disconnected from MongoDB')
  }
}
