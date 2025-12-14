# AI任务生成功能优化方案 - 私人助理版

## 1. 需求分析

### 1.1 核心需求
- **私人助理式任务管理**：像私人秘书一样主动帮用户安排日程
- **自动关联的任务层级**：支持年、月、周、日任务层级，短期任务可无上级
- **渐进式任务生成**：
  - 长期任务只概述下一级计划，不生成具体任务
  - 当时间周期来临时，结合之前数据和用户日程生成具体任务
- **AI主动询问机制**：每天登录时AI主动弹窗询问用户情况
- **任务审核机制**：AI生成的任务放入审核列表，用户可调整、审核或撤回
- **任务存档功能**：调整任务时存档旧任务，说明修改原因，方便AI分析
- **灵活的对话入口**：任何与AI对话的地方都可生成任务，未来支持QQ/微信接入
- **任务提醒功能**：支持邮箱、QQ、微信和页面提示
- **任务统计分析**：基于福格行为模型的任务完成情况和难度分析

### 1.2 期望效果
- AI能创建大的长期任务，并合理拆分为每周、每天的任务
- 根据用户实际情况动态调整计划
- 考虑用户的完成情况、日程安排、情绪和难度等因素
- 支持任务的灵活调整和撤回
- 保持良好的用户体验

## 2. 实现方案

### 2.1 数据库模型扩展

**文件**：`prisma/schema.prisma`

**核心修改**：
- 支持任务层级关联，短期任务可无上级
- 简化任务状态，只有`pending_approval`、`pending`和`completed`
- 添加任务存档功能，支持记录修改原因
- 支持任务难度和福格行为模型相关数据

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
  parentId    Int?     // 父任务ID，可选
  parent      Task?    @relation(fields: [parentId], references: [id], onDelete: Cascade)
  children    Task[]   // 子任务
  
  // 任务存档相关字段
  isArchived  Boolean  @default(false) // 是否存档
  archivedBy  String?  // 存档人ID
  archivedAt  DateTime? // 存档时间
  archiveReason String?  // 存档原因
  
  // 福格行为模型相关字段
  difficulty  Int?     // 任务难度，1-5分
  motivation  Int?     // 完成动机，1-5分
  completionRate Float? // 完成率
  feedback    String?  // 用户反馈

  @@index([userId])
  @@index([status])
  @@index([period])
  @@index([parentId])
  @@index([isArchived])
  @@map("task")
}
```

### 2.2 AI提示词优化

**文件**：`server/api/routes/ai-task.ts`

**核心原则**：
- 私人助理式的主动服务
- 结合之前数据和用户情况的渐进式生成
- 主动询问用户情况
- 支持任务调整和存档

```typescript
const systemPrompt = `你是一个基于福格行为模型的私人任务助理。

用户信息：
- MBTI: ${personality?.mbti || '未知'}
- 学习风格: ${personality?.learningStyle || '未知'}
- 高效时间段: ${personality?.preferredTime || '未知'}

工作原则：
1. 私人助理式服务：
   - 主动了解用户情况和需求
   - 像私人秘书一样帮用户安排日程
   - 灵活适应用户的实际情况

2. 渐进式任务生成：
   - 长期任务只概述下一级计划，不生成具体任务
   - 当时间周期来临时，结合之前数据生成具体任务
   - 考虑用户的完成情况、日程安排、情绪和难度等因素

3. 主动询问机制：
   - 每天登录时主动询问用户情况
   - 了解用户的日程安排、外界干扰、情绪和任务难度
   - 先给出建议，再询问用户意见

4. 任务存档和分析：
   - 调整任务时存档旧任务，记录修改原因
   - 基于存档数据进行分析和改进

5. 任务提醒：
   - 基于任务优先级和截止时间发送提醒
   - 支持多种提醒方式

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
- 现有任务列表添加"待审核任务"选项卡
- 支持查看、调整、批准和撤回待审核任务
- 任务调整时存档旧任务，创建新任务
- 支持任务难度和动机的评分

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
  // 存档旧任务
  await updateTask(taskId, { 
    isArchived: true, 
    archivedAt: new Date(), 
    archiveReason: '用户调整任务' 
  })
  // 创建新任务
  await createTask({
    ...taskData,
    status: 'pending_approval',
    parentId: taskData.parentId
  })
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

### 2.4 主动询问弹窗实现

**文件**：`app/(main)/home/page.tsx`

**核心功能**：
- 每天登录时AI主动弹窗询问用户情况
- 先给出AI建议，再询问用户意见
- 了解用户的日程安排、外界干扰、情绪和任务难度
- 支持用户直接修改AI建议

**实现细节**：

```typescript
// 主动询问弹窗状态
const [isAiInquiryOpen, setIsAiInquiryOpen] = useState(false)
const [aiSuggestion, setAiSuggestion] = useState<string>('')
const [userInput, setUserInput] = useState<string>('')

// 检查是否需要显示主动询问弹窗
useEffect(() => {
  // 检查今天是否已询问
  const lastInquiry = localStorage.getItem('lastAiInquiry')
  const today = new Date().toDateString()
  
  if (lastInquiry !== today) {
    // 显示主动询问弹窗
    setIsAiInquiryOpen(true)
    // 调用AI获取建议
    fetchAiSuggestion()
  }
}, [])

// 获取AI建议
const fetchAiSuggestion = async () => {
  // 调用AI API获取建议
  const response = await fetch.post('api/ai-task/inquiry', { 
    json: { 
      action: 'get_suggestion',
      userId: 'default-user-id' // 实际应该获取当前用户ID
    } 
  })
  const data = await response.json()
  setAiSuggestion(data.suggestion)
}

// 提交用户反馈
const submitInquiry = async () => {
  // 调用AI API提交反馈
  await fetch.post('api/ai-task/inquiry', { 
    json: { 
      action: 'submit_feedback',
      userId: 'default-user-id', // 实际应该获取当前用户ID
      suggestion: aiSuggestion,
      feedback: userInput
    } 
  })
  
  // 记录今天已询问
  localStorage.setItem('lastAiInquiry', new Date().toDateString())
  // 关闭弹窗
  setIsAiInquiryOpen(false)
}

// 主动询问弹窗
<Dialog open={isAiInquiryOpen} onOpenChange={setIsAiInquiryOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>今日任务安排建议</DialogTitle>
      <DialogDescription>
        基于您之前的任务完成情况，我为您准备了今日的任务安排建议
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="bg-secondary p-4 rounded-lg">
        <p className="text-sm whitespace-pre-wrap">{aiSuggestion}</p>
      </div>
      <Textarea
        placeholder="请告诉我您的意见、日程安排或其他需要调整的地方..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className="min-h-[120px]"
      />
    </div>
    <DialogFooter>
      <Button variant="secondary" onClick={() => setIsAiInquiryOpen(false)}>
        稍后再说
      </Button>
      <Button onClick={submitInquiry}>
        确认并生成任务
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2.5 任务提醒功能实现

**文件**：`server/api/routes/reminder.ts`

**核心功能**：
- 基于任务优先级和截止时间发送提醒
- 支持多种提醒方式：邮箱、QQ、微信和页面提示
- 页面上显示提示消息图标

**实现细节**：

```typescript
// 页面提示消息图标
<div className="relative">
  <BellIcon className="h-5 w-5 text-muted-foreground cursor-pointer" onClick={() => setIsNotificationOpen(true)} />
  {unreadNotifications > 0 && (
    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-primary-foreground text-xs flex items-center justify-center">
      {unreadNotifications}
    </span>
  )}
</div>
```

## 3. 核心流程

### 3.1 渐进式任务生成流程

1. **长期任务生成**：
   - 用户与AI对话，描述长期目标
   - AI生成长期任务，概述下一级计划
   - 任务进入审核列表，状态为pending_approval

2. **时间周期触发**：
   - 当新的时间周期（月、周、日）来临时
   - 系统自动触发AI询问流程

3. **AI主动询问**：
   - AI结合之前数据和用户情况生成建议
   - 弹窗向用户询问日程安排、外界干扰、情绪和难度等因素
   - 用户提供反馈和调整意见

4. **生成具体任务**：
   - AI基于用户反馈生成具体任务
   - 任务进入审核列表，状态为pending_approval

5. **用户审核**：
   - 批准：任务进入正式任务列表，状态为pending
   - 调整：存档旧任务，创建新任务
   - 撤回：删除任务

6. **任务执行和反馈**：
   - 用户执行任务
   - AI记录任务完成情况和难度
   - 生成新的任务建议

### 3.2 任务调整和存档流程

1. **用户发起调整**：
   - 用户在审核列表或任务列表中选择调整任务

2. **存档旧任务**：
   - 系统自动存档旧任务
   - 记录存档时间和原因

3. **创建新任务**：
   - 基于用户调整创建新任务
   - 新任务进入审核列表

4. **AI分析改进**：
   - AI基于存档数据进行分析
   - 改进后续任务建议

## 4. 技术要点

### 4.1 渐进式任务生成
- **时间周期触发**：基于系统时间自动触发
- **数据驱动**：结合用户历史数据和当前情况
- **主动询问**：AI主动了解用户情况
- **灵活调整**：支持用户反馈和调整

### 4.2 任务存档机制
- **自动存档**：任务调整时自动存档旧任务
- **修改原因记录**：方便AI进行数据分析
- **历史追溯**：支持查看历史任务版本
- **数据安全**：确保旧任务数据不丢失

### 4.3 主动询问弹窗
- **定时触发**：每天首次登录时触发
- **智能建议**：基于AI分析的个性化建议
- **用户反馈**：支持用户直接修改和调整
- **流畅体验**：简洁友好的界面设计

### 4.4 任务提醒系统
- **多渠道支持**：邮箱、QQ、微信和页面提示
- **智能提醒**：基于任务优先级和截止时间
- **用户可控**：支持关闭和调整提醒设置
- **简洁设计**：页面提示图标小而不影响体验

### 4.5 福格行为模型应用
- **任务难度评分**：1-5分，记录任务难度
- **完成动机评分**：1-5分，记录用户动机
- **完成率统计**：统计任务完成情况
- **数据分析**：基于数据改进任务建议

## 5. 预期效果

### 5.1 功能效果
- ✅ 私人助理式主动服务
- ✅ 渐进式任务生成，结合用户实际情况
- ✅ 任务审核机制，支持调整和存档
- ✅ 自动关联的任务层级
- ✅ 主动询问弹窗
- ✅ 多渠道任务提醒
- ✅ 基于福格行为模型的统计分析

### 5.2 用户体验
- 简化任务创建流程
- 提高任务的合理性和可执行性
- 增强用户对任务的控制感
- 适应用户的实际情况和变化
- 提供个性化的任务建议
- 主动服务，减少用户操作

## 6. 验证要点

- 数据库模型扩展是否成功
- AI主动询问弹窗是否正常显示
- 任务审核、调整和存档功能是否正常
- 渐进式任务生成是否符合预期
- 任务提醒功能是否正常
- 福格行为模型数据统计是否准确
- 用户体验是否流畅

## 7. 未来扩展

- **QQ/微信接入**：支持在聊天软件中与AI交流
- **更智能的AI建议**：基于更丰富的数据和算法
- **更个性化的提醒**：基于用户偏好调整提醒方式
- **更详细的统计报表**：提供可视化的任务完成情况
- **语音交互**：支持语音输入和输出
- **习惯养成**：基于福格行为模型帮助用户养成好习惯

---

本方案综合了所有需求，实现了私人助理式的AI任务生成功能，包括渐进式任务生成、主动询问、任务审核和多渠道提醒，同时基于福格行为模型提供统计分析，为用户提供个性化的任务管理服务。