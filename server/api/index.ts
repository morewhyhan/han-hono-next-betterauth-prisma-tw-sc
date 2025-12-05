import { Hono } from 'hono'
import authRoutes from './routes/auth'
import helloRoutes from './routes/hello'

const app = new Hono().basePath('/api')

// 将认证路由挂载到 /auth 路径
const routes = app
  .route('/auth', authRoutes)
  .route('/hello', helloRoutes)

export default app

export type AppType = typeof routes