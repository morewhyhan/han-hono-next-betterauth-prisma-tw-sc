import { Hono } from 'hono'
import authRoutes from './routes/auth'
import helloRoutes from './routes/hello'
import taskRoutes from './routes/task'
import personalityRoutes from './routes/personality'
import aiTaskRoutes from './routes/ai-task' // 添加AI任务路由
import { requireAuth } from './middleware/auth'

const app = new Hono().basePath('/api')

// 将认证路由挂载到 /auth 路径
app.route('/auth', authRoutes)
app.route('/hello', helloRoutes)

// 受保护的业务路由
app.use('/tasks/*', requireAuth)
app.use('/personality/*', requireAuth)
app.use('/ai-task/*', requireAuth)

app.route('/tasks', taskRoutes)
app.route('/personality', personalityRoutes)
app.route('/ai-task', aiTaskRoutes) // 挂载AI任务路由

export default app

export type AppType = typeof app