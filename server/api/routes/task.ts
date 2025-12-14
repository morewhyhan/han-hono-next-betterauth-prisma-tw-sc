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
  dueDate: z.string().optional().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val),
    'dueDate 必须是完整的 ISO-8601 格式 (YYYY-MM-DDTHH:mm:ss)'
  ),
  important: z.boolean(),
  urgent: z.boolean(),
  status: z.enum(['pending', 'completed', 'pending_approval']).optional().default('pending_approval'),
  parentId: z.number().optional().nullable(),
  period: z.string().optional()
})

// 任务更新请求验证模式
const taskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed', 'pending_approval']).optional(),
  dueDate: z.string().optional().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val),
    'dueDate 必须是完整的 ISO-8601 格式 (YYYY-MM-DDTHH:mm:ss)'
  ),
  important: z.boolean().optional(),
  urgent: z.boolean().optional(),
  parentId: z.number().optional().nullable(),
  period: z.string().optional()
})

// 获取任务列表
app.get('/', async (c) => {
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
  
  // 确保返回的日期格式一致，使用ISO格式
  const formattedTasks = tasks.map(task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    archivedAt: task.archivedAt ? task.archivedAt.toISOString() : null,
    remindAt: task.remindAt ? task.remindAt.toISOString() : null
  }))
  
  return c.json(formattedTasks)
})

// 获取单个任务
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  
  const task = await prisma.task.findUnique({
    where: { id: parseInt(id), userId }
  })
  
  if (!task) {
    return c.notFound()
  }
  
  // 确保返回的日期格式一致，使用ISO格式
  const formattedTask = {
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    archivedAt: task.archivedAt ? task.archivedAt.toISOString() : null,
    remindAt: task.remindAt ? task.remindAt.toISOString() : null
  }
  
  return c.json(formattedTask)
})

// 创建新任务
app.post('/', zValidator('json', taskCreateSchema), async (c) => {
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  const data = c.req.valid('json')
  
  // 确保所有任务都有dueDate，默认使用当天23:59:00
  const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(new Date().setHours(23, 59, 0, 0))
  
  // 处理parentId，确保空值被正确处理
  const parentId = data.parentId === undefined || data.parentId === null ? null : data.parentId
  
  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate,
      parentId,
      userId
    }
  })
  
  return c.json(task, 201)
})

// 更新任务
app.put('/:id', zValidator('json', taskUpdateSchema), async (c) => {
  const id = c.req.param('id')
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  const data = c.req.valid('json')
  
  // 处理parentId，确保空值被正确处理
  const parentId = data.parentId === undefined ? undefined : (data.parentId === null ? null : data.parentId)
  
  const task = await prisma.task.update({
    where: { id: parseInt(id), userId },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      parentId
    }
  })
  
  return c.json(task)
})

// 获取任务的子任务
app.get('/:id/children', async (c) => {
  const id = c.req.param('id')
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  
  const children = await prisma.task.findMany({
    where: { parentId: parseInt(id), userId },
    orderBy: { createdAt: 'asc' }
  })
  
  // 确保返回的日期格式一致，使用ISO格式
  const formattedChildren = children.map(task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    archivedAt: task.archivedAt ? task.archivedAt.toISOString() : null,
    remindAt: task.remindAt ? task.remindAt.toISOString() : null
  }))
  
  return c.json(formattedChildren)
})

// 获取任务的父任务
app.get('/:id/parent', async (c) => {
  const id = c.req.param('id')
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  
  // 先获取当前任务，查看其父任务ID
  const currentTask = await prisma.task.findUnique({
    where: { id: parseInt(id), userId }
  })
  
  if (!currentTask || !currentTask.parentId) {
    return c.json(null)
  }
  
  // 获取父任务
  const parentTask = await prisma.task.findUnique({
    where: { id: currentTask.parentId, userId }
  })
  
  if (!parentTask) {
    return c.json(null)
  }
  
  // 确保返回的日期格式一致，使用ISO格式
  const formattedParentTask = {
    ...parentTask,
    dueDate: parentTask.dueDate ? parentTask.dueDate.toISOString() : null,
    createdAt: parentTask.createdAt.toISOString(),
    updatedAt: parentTask.updatedAt.toISOString(),
    archivedAt: parentTask.archivedAt ? parentTask.archivedAt.toISOString() : null,
    remindAt: parentTask.remindAt ? parentTask.remindAt.toISOString() : null
  }
  
  return c.json(formattedParentTask)
})

// 删除任务
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  // 注意：这里假设 userId 已经通过认证中间件设置到上下文中
  // 为了避免类型错误，我们暂时使用一个默认值，实际应用中应该通过认证中间件获取
  const userId = "default-user-id" // 实际应用中应该是从上下文中获取
  
  await prisma.task.delete({
    where: { id: parseInt(id), userId }
  })
  
  return c.text('OK')
})

export default app
