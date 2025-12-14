# 实现真实AI对话的任务创建功能

## 1. 问题分析

* **用户需求**：
  - 不要模拟回复，要真实的AI对话
  - 体现在AI辅助添加任务的弹窗页面上
  - AI了解用户真实动机和任务难度
  - 结合用户信息生成任务
  - 用户审核通过后添加到数据库

* **现有问题**：
  - 当前AI聊天使用模拟回复
  - 没有连接真实的AI API
  - 没有生成实际的任务建议
  - 没有任务审核功能

## 2. 实现方案

### 2.1 创建AI对话API路由

* **文件**：`server/api/routes/ai-task.ts`
* **功能**：
  - 接收前端发送的聊天消息
  - 调用Kimi API进行真实对话
  - 根据对话上下文生成任务建议
  - 返回AI回复和任务建议

### 2.2 修改AI聊天组件

* **文件**：`app/(main)/home/page.tsx` 中的AI指导弹窗
* **功能**：
  - 连接后端AI API
  - 实现真实的AI对话
  - 移除模拟回复
  - 添加任务生成和审核功能

### 2.3 实现任务审核功能

* **文件**：`app/(main)/home/page.tsx`
* **功能**：
  - 展示AI生成的任务详情
  - 允许用户修改任务
  - 审核通过后保存到数据库

## 3. 详细实现步骤

### 3.1 创建AI对话API路由

```typescript
// server/api/routes/ai-task.ts
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
  const systemPrompt = `你是一个基于福格行为模型的任务规划助手。
  用户信息：
  - MBTI: ${personality?.mbti || '未知'}
  - 学习风格: ${personality?.learningStyle || '未知'}
  - 高效时间段: ${personality?.preferredTime || '未知'}
  
  请：
  1. 了解用户的任务目标和动机
  2. 询问任务难度和时间安排
  3. 基于福格行为模型生成合理的任务
  4. 最后生成JSON格式的任务数据`
  
  // 完整消息列表
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ]
  
  // 调用Kimi API
  const completion = await openai.chat.completions.create({
    model: "kimi-k2-turbo-preview",
    messages: fullMessages,
    temperature: 0.6,
  })
  
  const aiReply = completion.choices[0].message.content || ''
  
  return c.json({ reply: aiReply })
})

export default app
```

### 3.2 修改API入口路由

```typescript
// server/api/index.ts
import { Hono } from 'hono'
import authRoutes from './routes/auth'
import helloRoutes from './routes/hello'
import taskRoutes from './routes/task'
import personalityRoutes from './routes/personality'
import aiTaskRoutes from './routes/ai-task' // 添加AI任务路由

const app = new Hono().basePath('/api')

// 挂载路由
app.route('/auth', authRoutes)
app.route('/hello', helloRoutes)
app.route('/tasks', taskRoutes)
app.route('/personality', personalityRoutes)
app.route('/ai-task', aiTaskRoutes) // 添加AI任务路由

export default app
export type AppType = typeof app
```

### 3.3 修改前端AI聊天弹窗

* 修改 `app/(main)/home/page.tsx` 中的AI指导弹窗
* 移除模拟回复，连接真实AI API
* 实现真实的AI对话
* 添加任务生成和审核功能

### 3.4 实现任务审核功能

* 添加任务审核界面
* 展示AI生成的任务
* 允许用户修改和审核
* 审核通过后保存到数据库

## 4. 预期效果

* **真实AI对话**：用户可以与Kimi AI进行真实对话
* **任务生成**：AI基于对话生成合理的任务
* **个性化建议**：结合用户的个性信息
* **任务审核**：用户可以审核并修改任务
* **无缝保存**：审核通过后自动保存到数据库
* **用户体验**：流畅的对话流程，直观的审核界面

## 5. 技术要点

* 使用Kimi API实现真实AI对话
* 结合用户个性信息生成个性化任务
* 实现前后端分离的架构
* 保持良好的用户体验
* 确保数据安全和隐私保护

## 6. 验证步骤

* 测试AI对话功能
* 测试任务生成功能
* 测试任务审核功能
* 测试任务保存功能
* 确保整个流程流畅

