import { z } from 'zod'

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters'),
    priority: z
      .enum(['low', 'medium', 'high'], {
        errorMap: () => ({ message: 'Priority must be either low, medium, or high' }),
      })
      .optional()
      .default('medium'),
    category: z
      .string()
      .trim()
      .min(1, 'Category cannot be empty')
      .max(50, 'Category cannot exceed 50 characters')
      .optional()
      .default('General'),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Due date must be a valid date or datetime string',
      })
      .optional()
      .nullable(),
  }),
})

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Task ID parameter is required'),
  }),
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, 'Title cannot be empty')
        .max(200, 'Title cannot exceed 200 characters')
        .optional(),
      completed: z.boolean().optional(),
      priority: z
        .enum(['low', 'medium', 'high'], {
          errorMap: () => ({ message: 'Priority must be either low, medium, or high' }),
        })
        .optional(),
      category: z
        .string()
        .trim()
        .min(1, 'Category cannot be empty')
        .max(50, 'Category cannot exceed 50 characters')
        .optional(),
      dueDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: 'Due date must be a valid date or datetime string',
        })
        .optional()
        .nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
})

export const bulkTaskSchema = z.object({
  body: z.object({
    ids: z
      .array(
        z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID format')
      )
      .min(1, 'At least one task ID is required'),
    action: z.enum(['complete', 'activate', 'delete'], {
      errorMap: () => ({ message: "Action must be 'complete', 'activate', or 'delete'" }),
    }),
  }),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body']
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body']
export type BulkTaskInput = z.infer<typeof bulkTaskSchema>['body']
