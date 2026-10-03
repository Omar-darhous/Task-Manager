import { Router } from 'express'
import { getHealth, getReadiness, getLiveness } from '../controllers/health.controller.js'

const router = Router()

router.get('/', getHealth)
router.get('/readiness', getReadiness)
router.get('/liveness', getLiveness)

export default router
