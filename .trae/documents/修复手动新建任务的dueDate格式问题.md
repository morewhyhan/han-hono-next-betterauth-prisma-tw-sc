# 修复手动新建任务的dueDate格式问题

## 1. 问题分析

* 从终端错误信息可以看到，Prisma 期望完整的 ISO-8601 日期时间格式，但当前格式是 `YYYY-MM-DDTHH:mm`，缺少秒数部分
* 错误信息：`Invalid value for argument `dueDate`: premature end of input. Expected ISO-8601 DateTime.`
* 问题出在 `app/(main)/home/page.tsx` 的 `getDefaultDeadline` 函数中

## 2. 修复方案

### 2.1 修复前端日期格式生成

* 修改 `app/(main)/home/page.tsx` 中的 `getDefaultDeadline` 函数，生成包含秒数的完整 ISO-8601 格式
* 将 `YYYY-MM-DDTHH:mm` 格式改为 `YYYY-MM-DDTHH:mm:ss` 格式

### 2.2 可选：后端添加日期格式验证和转换

* 在 `server/api/routes/task.ts` 中添加日期格式验证
* 使用 Zod 验证 `dueDate` 格式为完整的 ISO-8601 格式
* 或者在创建任务前将日期字符串转换为有效的 Date 对象

## 3. 具体修改

### 3.1 修改前端 `getDefaultDeadline` 函数

```typescript
// 当前代码
const getDefaultDeadline = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T23:59`
}

// 修改后
const getDefaultDeadline = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T23:59:00`
}
```

### 3.2 可选：后端添加日期格式验证

```typescript
// 在 server/api/routes/task.ts 中
const taskCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  dueDate: z.string().optional().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val),
    'dueDate 必须是完整的 ISO-8601 格式 (YYYY-MM-DDTHH:mm:ss)'
  ),
  important: z.boolean(),
  urgent: z.boolean()
})
```

## 4. 预期结果

* 修复后，手动新建任务时，`dueDate` 会以完整的 ISO-8601 格式发送到后端
* Prisma 能够正确处理日期格式，不会报错
* 任务能够成功创建并保存到数据库
* 页面能够正常显示新创建的任务

## 5. 验证步骤

* 运行 `npm run build` 确保项目能正常构建
* 启动开发服务器，测试手动新建任务功能
* 检查数据库中是否成功保存了新任务
* 检查页面上是否显示了新创建的任务

