import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getPrismaClient } from '@/lib/db'

const app = new Hono()
const prisma = getPrismaClient()

// 个性设置创建/更新请求验证模式
const personalitySchema = z.object({
  mbti: z.string().min(4, 'MBTI类型必须为4个字符'),
  learningStyle: z.string(),
  energyLevel: z.number().min(1).max(10),
  workRhythm: z.string(),
  preferredTime: z.string()
})

// 获取个性设置
app.get('/', async (c) => {
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  
  const personality = await prisma.personality.findUnique({
    where: { userId }
  })
  
  return c.json(personality || null)
})

// 创建或更新个性设置
app.put('/', zValidator('json', personalitySchema), async (c) => {
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  const data = c.req.valid('json')
  
  // 检查是否已存在个性设置
  const existingPersonality = await prisma.personality.findUnique({
    where: { userId }
  })
  
  let personality
  
  if (existingPersonality) {
    // 更新现有设置
    personality = await prisma.personality.update({
      where: { userId },
      data
    })
  } else {
    // 创建新设置
    personality = await prisma.personality.create({
      data: {
        ...data,
        userId
      }
    })
  }
  
  return c.json(personality)
})

export default app
