import { Hono } from 'hono'

const app = new Hono().get('/', (c) => {
  return c.json({ message: 'Hello, Next.js!' })
})

export default app
