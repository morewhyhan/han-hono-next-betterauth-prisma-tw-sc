# AI任务生成功能优化方案

## 1. 需求分析

### 1.1 核心需求
- **OKR管理法**：AI使用OKR管理法创建任务，包括目标（Objective）、关键结果（Key Result）和具体任务（Task）
- **灵活的任务层级**：支持年、月、周、日任务层级，这些层级是可选的
- **渐进式任务生成**：永远结合之前的情况和用户反馈灵活生成任务，无论任务周期
- **任务审核机制**：AI生成的任务放入审核列表，用户可灵活调整、自主审核或撤回
- **现有任务列表集成**：审核列表作为任务列表的子功能模块，不单独新建
- **灵活的对话入口**：任何与AI对话的地方都可以生成任务

### 1.2 期望效果
- AI能创建大的长期任务，并合理拆分为每周、每天的任务
- 根据用户实际情况动态调整计划
- 考虑用户的完成情况和日程安排
- 支持任务的灵活调整和撤回
- 保持良好的用户体验

## 2. 实现方案

### 2.1 数据库模型扩展

**文件**：`prisma/schema.prisma`

**修改内容**：
- 添加`pending_approval`状态，支持任务审核流程
- 添加`period`字段，支持年、月、周、日等不同周期
- 支持任务的层级关系和关联

```prisma
model Task {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      String   @default("pending") // pending, pending_approval, completed
  important   Boolean  @default(false)
  urgent      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  dueDate     DateTime?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  period      String?  // yearly, monthly, weekly, daily (optional)
  parentId    Int?     // 父任务ID
  parent      Task?    @relation(fields: [parentId], references: [id], onDelete: Cascade)
  children    Task[]   // 子任务

  @@index([userId])
  @@index([status])
  @@index([period])
  @@index([parentId])
  @@map("task")
}
```

### 2.2 AI提示词优化

**文件**：`server/api/routes/ai-task.ts`

**核心原则**：
- 支持OKR管理法
- 灵活的任务层级结构
- 结合之前情况和用户反馈的渐进式生成
- 动态调整计划

```typescript
const systemPrompt = `你是一个基于OKR管理法的智能任务规划助手。

用户信息：
- MBTI: ${personality?.mbti || '未知'}
- 学习风格: ${personality?.learningStyle || '未知'}
- 高效时间段: ${personality?.preferredTime || '未知'}

工作原则：
1. 使用OKR管理法：
   - 目标（Objective）：大的长期任务
   - 关键结果（Key Result）：可衡量的结果
   - 任务（Task）：具体的行动步骤

2. 灵活的任务层级：
   - 支持年、月、周、日任务层级，可选
   - 根据用户需求创建不同层级的任务
   - 支持层级关联和拆分

3. 渐进式任务生成：
   - 永远结合之前的情况和用户反馈
   - 考虑用户的完成情况和日程安排
   - 灵活调整计划

4. 生成待审核任务：
   - 生成的任务状态设为待审核
   - 支持用户灵活调整和审核

任务数据格式：
```task
{
  "title": "任务标题",
  "description": "任务描述",
  "deadline": "2023-12-31T23:59:00",
  "important": false,
  "urgent": false,
  "period": "yearly",
  "children": [
    {
      "title": "子任务标题",
      "description": "子任务描述",
      "deadline": "2023-12-15T23:59:00",
      "period": "monthly",
      "important": true,
      "urgent": false
    }
  ]
}
```
`
```

### 2.3 任务列表集成审核功能

**文件**：`app/(main)/home/page.tsx`

**核心功能**：
- 在现有任务列表中添加"待审核任务"选项卡
- 支持查看、调整、批准和撤回待审核任务
- 实现任务状态的切换

**实现细节**：

```typescript
// 待审核任务筛选
const pendingApprovalTasks = tasks.filter(task => task.status === 'pending_approval')

// 任务审核功能
const approveTask = async (taskId: string) => {
  await updateTask(taskId, { status: 'pending' })
}

const withdrawTask = async (taskId: string) => {
  await deleteTask(taskId)
}

const adjustTask = async (taskId: string, taskData: TaskUpdateRequest) => {
  await updateTask(taskId, taskData)
}

// 任务列表视图修改
<Tabs value={view} onValueChange={setView}>
  <TabsList>
    <TabsTrigger value="quadrant">四象限</TabsTrigger>
    <TabsTrigger value="list">列表</TabsTrigger>
    <TabsTrigger value="approval">待审核任务</TabsTrigger> {/* 新增待审核选项卡 */}
  </TabsList>
  
  {/* 待审核任务视图 */}
  <TabsContent value="approval">
    <div>
      <h4>待审核任务 ({pendingApprovalTasks.length})</h4>
      <div className="space-y-4">
        {pendingApprovalTasks.map(task => (
          <div key={task.id} className="bg-secondary p-4 rounded-lg">
            <h5>{task.title}</h5>
            <p>{task.description}</p>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => approveTask(task.id.toString())}>批准</Button>
              <Button variant="secondary" onClick={() => adjustTask(task.id.toString(), { ...task, status: 'pending' })}>调整</Button>
              <Button variant="destructive" onClick={() => withdrawTask(task.id.toString())}>撤回</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </TabsContent>
</Tabs>
```

### 2.4 AI任务生成流程

1. **用户发起对话**：在任何AI聊天界面描述任务需求
2. **AI理解需求**：结合用户信息和历史数据分析
3. **生成任务草案**：使用OKR管理法生成任务，状态设为`pending_approval`
4. **任务进入审核列表**：显示在任务列表的"待审核任务"选项卡
5. **用户审核**：
   - 批准：任务状态变为`pending`，进入正式任务列表
   - 调整：修改任务细节后批准
   - 撤回：删除待审核任务
6. **动态调整**：根据用户完成情况和反馈，后续任务生成时自动调整

## 3. 技术要点

### 3.1 渐进式任务生成
- **年任务**：概述年度目标和关键结果，不生成具体月度任务
- **月任务**：概述月度计划，不生成具体周任务
- **周任务**：生成具体每周任务，结合用户日程
- **日任务**：生成具体每日任务，结合用户当天日程

### 3.2 数据驱动决策
- 分析用户历史任务完成情况
- 考虑用户反馈和调整
- 结合用户日程安排
- 动态调整任务难度和数量

### 3.3 灵活的层级管理
- 支持不同周期任务的关联
- 允许用户自由选择任务层级
- 支持跨层级的任务查看和管理

### 3.4 用户体验优化
- 保持简洁的界面设计
- 提供清晰的任务状态指示
- 支持任务的批量操作
- 提供友好的交互反馈

## 4. 预期效果

### 4.1 功能效果
- ✅ OKR管理法的应用
- ✅ 灵活的任务层级结构
- ✅ 渐进式任务生成
- ✅ 任务审核机制
- ✅ 现有任务列表集成
- ✅ 灵活的对话入口

### 4.2 用户体验
- 简化任务创建流程
- 提高任务的合理性和可执行性
- 增强用户对任务的控制感
- 适应用户的实际情况和变化
- 提供个性化的任务建议

## 5. 验证要点

- 数据库模型扩展是否成功
- AI生成的任务是否正确进入审核列表
- 审核列表是否正确显示在现有任务列表中
- 任务审核、调整和撤回功能是否正常
- 渐进式任务生成是否符合预期
- 任务层级关系是否正确
- 用户体验是否流畅

## 6. 未来扩展

- **批量操作**：支持批量审核、调整和撤回任务
- **智能推荐**：基于用户行为和偏好提供任务建议
- **统计分析**：提供任务完成情况的统计和分析
- **协作功能**：支持多用户协作和任务分配
- **提醒功能**：根据任务优先级和截止时间发送提醒

---

本方案综合了所有需求，实现了OKR管理法、渐进式任务生成和任务审核机制，同时保持了良好的用户体验和系统灵活性。