import { Router } from 'express'
import authRoutes from './auth.routes.js'
import healthRoutes from './health.routes.js'
import taskRoutes from './task.routes.js'
import categoryRoutes from './category.routes.js'
import userRoutes from './user.routes.js'
import docsRoutes from './docs.routes.js'

const apiRouter = Router()

apiRouter.use('/auth', authRoutes)
apiRouter.use('/users', userRoutes)
apiRouter.use('/health', healthRoutes)
apiRouter.use('/tasks', taskRoutes)
apiRouter.use('/categories', categoryRoutes)
apiRouter.use('/docs', docsRoutes)

export default apiRouter
