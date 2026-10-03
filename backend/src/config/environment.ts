import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

export const envSchema = z
  .object({
    PORT: z
      .string()
      .default('5000')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
        message: 'PORT must be a valid port number (1-65535)',
      }),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    MONGODB_URI: z
      .string()
      .optional(),
    CLIENT_URL: z
      .string()
      .default('http://localhost:5173'),
    JWT_SECRET: z
      .string({ required_error: 'JWT_SECRET is required' })
      .min(10, 'JWT_SECRET must be at least 10 characters long'),
    JWT_EXPIRES_IN: z
      .string()
      .default('1d'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.MONGODB_URI || data.MONGODB_URI.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MONGODB_URI'],
          message: 'MONGODB_URI is required in production environment',
        })
      }
      if (!data.JWT_SECRET || data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must be at least 32 characters long in production',
        })
      }
      if (
        data.JWT_SECRET.toLowerCase().includes('your_super_secret') ||
        data.JWT_SECRET.toLowerCase().includes('dev-secret') ||
        data.JWT_SECRET.toLowerCase().includes('placeholder')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET cannot use default/development placeholder in production',
        })
      }
      if (!process.env.CLIENT_URL || process.env.CLIENT_URL.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CLIENT_URL'],
          message: 'CLIENT_URL must be explicitly configured in production environment',
        })
      }
    }
  })

export type Environment = z.infer<typeof envSchema>

export function validateEnvironment(envObj: Record<string, unknown> = process.env): {
  success: boolean
  data?: Environment
  errors?: Record<string, string[]>
} {
  const result = envSchema.safeParse(envObj)
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }
  return {
    success: true,
    data: result.data,
  }
}

const parsed = validateEnvironment(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.errors)
  throw new Error('Environment configuration validation failed')
}

export const env: Environment = parsed.data!
