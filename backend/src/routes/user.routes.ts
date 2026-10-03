import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/user.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { validateRequest } from '../middleware/validate.middleware.js'
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../schemas/user.schema.js'

const router = Router()

// All user routes require authentication
router.use(authenticate)

router.get('/me', getProfile)
router.patch('/me', validateRequest(updateProfileSchema), updateProfile)
router.patch('/me/password', validateRequest(changePasswordSchema), changePassword)

export default router
