import { z } from 'zod'

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters long')
        .max(50, 'Name cannot exceed 50 characters')
        .optional(),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email('Please provide a valid email address')
        .optional(),
    })
    .refine((data) => data.name !== undefined || data.email !== undefined, {
      message: 'At least one field (name or email) must be provided for update',
    }),
})

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z
        .string()
        .min(8, 'New password must be at least 8 characters long')
        .max(128, 'New password cannot exceed 128 characters'),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body']
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body']
