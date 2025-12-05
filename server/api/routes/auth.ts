import { Hono } from 'hono'
import { auth } from '../../../lib/auth'

const authRoutes = new Hono()

// 挂载better-auth的所有路由
authRoutes.on(["POST", "GET"], "/**", (c) => auth.handler(c.req.raw))

export default authRoutes