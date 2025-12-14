# 添加任务API路由计划

## 问题分析

当前项目存在以下问题：
1. **前端已配置API通信**：前端通过`taskService.ts`实现了任务的CRUD操作，但缺少后端API支持
2. **后端缺少任务路由**：API服务器仅实现了认证和示例路由，没有任务相关的端点
3. **数据库模型已存在**：Prisma schema中已定义了Task模型，包含所有必要字段

## 实现步骤

### 1. 创建任务路由文件

* 创建`server/api/routes/task.ts`文件
* 实现任务的CRUD操作端点
* 使用Prisma Client进行数据库操作

### 2. 实现任务CRUD操作

* **GET /api/tasks**：获取任务列表
* **GET /api/tasks/:id**：获取单个任务详情
* **POST /api/tasks**：创建新任务
* **PUT /api/tasks/:id**：更新任务
* **DELETE /api/tasks/:id**：删除任务

### 3. 挂载任务路由

* 在`server/api/index.ts`中挂载任务路由
* 确保路由正确配置

### 4. 测试API端点

* 使用Postman或curl测试所有任务API端点
* 确保与前端代码兼容

## 技术实现

### 任务路由文件结构

```typescript
// server/api/routes/task.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getPrismaClient } from '@/lib/db'

const app = new Hono()
const prisma = getPrismaClient()

// 任务创建请求验证模式
const taskCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  important: z.boolean(),
  urgent: z.boolean()
})

// 任务更新请求验证模式
const taskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed']).optional(),
  dueDate: z.string().optional(),
  important: z.boolean().optional(),
  urgent: z.boolean().optional()
})

// 获取任务列表
app.get('/', async (c) => {
  // 从请求中获取用户ID（通过认证中间件）
  const userId = c.get('userId') as string
  
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
  
  return c.json(tasks)
})

// 获取单个任务
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId') as string
  
  const task = await prisma.task.findUnique({
    where: { id: parseInt(id), userId }
  })
  
  if (!task) {
    return c.notFound()
  }
  
  return c.json(task)
})

// 创建新任务
app.post('/', zValidator('json', taskCreateSchema), async (c) => {
  const userId = c.get('userId') as string
  const data = c.req.valid('json')
  
  const task = await prisma.task.create({
    data: {
      ...data,
      userId
    }
  })
  
  return c.json(task, 201)
})

// 更新任务
app.put('/:id', zValidator('json', taskUpdateSchema), async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId') as string
  const data = c.req.valid('json')
  
  const task = await prisma.task.update({
    where: { id: parseInt(id), userId },
    data
  })
  
  return c.json(task)
})

// 删除任务
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId') as string
  
  await prisma.task.delete({
    where: { id: parseInt(id), userId }
  })
  
  return c.text('OK')
})

export default app
```

### 挂载任务路由

```typescript
// server/api/index.ts
import { Hono } from 'hono'
import authRoutes from './routes/auth'
import helloRoutes from './routes/hello'
import taskRoutes from './routes/task' // 添加任务路由导入

const app = new Hono().basePath('/api')

// 将认证路由挂载到 /auth 路径
app.route('/auth', authRoutes)
app.route('/hello', helloRoutes)
app.route('/tasks', taskRoutes) // 挂载任务路由

export default app

export type AppType = typeof app
```

## 预期结果

* 所有任务API端点正常工作
* 前端可以成功调用API获取和操作任务数据
* 数据库中任务数据正确存储和更新
* 认证机制正常工作，确保用户只能访问自己的任务

## 风险和注意事项

* 确保认证中间件正确配置，获取用户ID
* 实现适当的错误处理
* 确保输入验证正确
* 考虑添加分页和过滤功能
* 确保API响应格式与前端代码兼容