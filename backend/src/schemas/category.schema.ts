import { z } from 'zod'

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Category name is required' })
      .trim()
      .min(1, 'Category name cannot be empty')
      .max(50, 'Category name cannot exceed 50 characters'),
  }),
})

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID parameter is required'),
  }),
  body: z.object({
    name: z
      .string({ required_error: 'Category name is required' })
      .trim()
      .min(1, 'Category name cannot be empty')
      .max(50, 'Category name cannot exceed 50 characters'),
  }),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body']
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body']
