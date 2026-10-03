import { Router } from 'express'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { validateRequest } from '../middleware/validate.middleware.js'
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema.js'

const router = Router()

// All category routes require authentication
router.use(authenticate)

router.get('/', getCategories)
router.post('/', validateRequest(createCategorySchema), createCategory)
router.patch('/:id', validateRequest(updateCategorySchema), updateCategory)
router.delete('/:id', deleteCategory)

export default router
