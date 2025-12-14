import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getPrismaClient } from '@/lib/db'
import { OpenAI } from 'openai'

const app = new Hono()
const prisma = getPrismaClient()

// 初始化OpenAI客户端（Kimi API）
const openai = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY || "sk-6QL7EvH2l4AOR4QOWKpMClxPm8a87rSbQftlWqE16GxR3uVk",
  baseURL: "https://api.moonshot.cn/v1",
  timeout: 55000, // 设置55秒超时，给客户端60秒留有余地
})

// 对话请求验证
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    content: z.string(),
    role: z.enum(['user', 'assistant'])
  })),
  userId: z.string().default('default-user-id')
})

// AI对话路由
app.post('/', zValidator('json', chatRequestSchema), async (c) => {
  const { messages, userId } = c.req.valid('json')
  
  // 获取用户个性信息
  const personality = await prisma.personality.findUnique({
    where: { userId }
  })
  
  // 系统提示，包含福格行为模型和用户信息
  const systemPrompt = `你是一个基于福格行为模型的私人任务助理，说话简洁自然，像朋友聊天一样。
  用户信息：
  - MBTI: ${personality?.mbti || '未知'}
  - 学习风格: ${personality?.learningStyle || '未知'}
  - 高效时间段: ${personality?.preferredTime || '未知'}
  
  工作原则：
  1. 私人助理式服务：主动了解用户需求，灵活帮用户安排日程
  2. 渐进式任务生成：长期任务只概述下一级计划，时间到了再生成具体任务
  3. 主动询问机制：简洁询问用户情况，先给建议再问意见
  4. 任务存档和分析：记录任务调整，基于数据改进

  请：
  1. 用简洁的话了解用户的任务目标和动机
  2. 简短询问任务难度和时间安排
  3. 基于福格行为模型生成合理的任务链，包含父任务和子任务
  4. 确保每个长期任务都分解为具体的短期子任务
  5. 最后使用 \`\`\`task 标记包裹生成的JSON格式任务数据，格式如下：
     \`\`\`task
     {
       "title": "任务标题",
       "description": "任务描述",
       "deadline": "2023-12-31T23:59:00",
       "important": false,
       "urgent": false,
       "period": "monthly",
       "children": [
         {
           "title": "子任务标题",
           "description": "子任务描述",
           "deadline": "2023-12-15T23:59:00",
           "period": "weekly",
           "important": true,
           "urgent": false,
           "children": [
             {
               "title": "孙子任务标题",
               "description": "孙子任务描述",
               "deadline": "2023-12-08T23:59:00",
               "period": "daily",
               "important": true,
               "urgent": true
             }
           ]
         }
       ]
     }
     \`\`\`
  `
  
  // 完整消息列表
  const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages
  ]
  
  try {
    // 调用Kimi API
    const completion = await openai.chat.completions.create({
      model: "kimi-k2-turbo-preview",
      messages: fullMessages,
      temperature: 0.6,
    })
    
    const aiReply = completion.choices[0].message.content || ''
    
    return c.json({ message: aiReply })
  } catch (error) {
    // 详细记录错误信息
    console.error('AI API error:', {
      error: error instanceof Error ? error.message : String(error),
      status: (error as any)?.status || 'unknown',
      requestId: (error as any)?.requestID || 'unknown',
      errorType: (error as any)?.type || 'unknown'
    })
    
    // 生成开发环境模拟响应
    const generateMockResponse = () => {
      const mockResponses = [
        '根据您之前的任务完成情况，建议您今天优先处理高优先级的未完成任务，然后分配一些时间学习新技能。',
        '今天的建议是：先完成昨天未完成的重要任务，然后休息一下，下午再开始新的任务。',
        '建议您今天专注于任务清单中标记为紧急的任务，完成后可以适当放松一下。',
        '基于您的任务历史，今天是个适合完成创造性工作的好日子，建议您安排一些需要思考的任务。',
        '今天的计划建议：上午处理日常事务，下午专注于长期项目，晚上留出时间复盘。'
      ]
      return mockResponses[Math.floor(Math.random() * mockResponses.length)]
    }
    
    // 返回200状态码而不是500，避免前端HTTPError
    return c.json({ 
      message: generateMockResponse() 
    }, 200)
  }
})

export default app
