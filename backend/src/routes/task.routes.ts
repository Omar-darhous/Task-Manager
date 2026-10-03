import { Router } from 'express'
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  bulkTaskAction,
} from '../controllers/task.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { validateRequest } from '../middleware/validate.middleware.js'
import { createTaskSchema, updateTaskSchema, bulkTaskSchema } from '../schemas/task.schema.js'

const router = Router()

// All task routes require authentication
router.use(authenticate)

router.get('/', getTasks)
router.patch('/bulk', validateRequest(bulkTaskSchema), bulkTaskAction)
router.get('/:id', getTaskById)
router.post('/', validateRequest(createTaskSchema), createTask)
router.patch('/:id', validateRequest(updateTaskSchema), updateTask)
router.delete('/:id', deleteTask)

export default router
