# AI任务生成功能修复计划

## 一、问题分析

### 1. 首页今日任务显示所有任务
- **问题**：今日任务区域显示了所有任务，而不是仅今日任务
- **原因**：quadrantTasks对象没有过滤今日任务，它过滤的是所有任务的四象限分类
- **影响**：用户看到的任务太多，无法专注于今日任务

### 2. 日历视图没有显示任何信息
- **问题**：日历视图显示"今天没有任务"，但实际有任务
- **原因**：dueDate格式处理问题，导致任务没有正确按日期分组
- **影响**：用户无法在日历中查看和管理任务

### 3. AI问题太冗长
- **问题**：AI问的问题太冗长，给用户带来阻力
- **原因**：系统提示词太复杂，导致AI回复冗长
- **影响**：用户体验不佳，可能不愿意与AI交互

## 二、修复方案

### 1. 修复首页今日任务显示

**文件**：`app/(main)/home/page.tsx`

**修改内容**：
- 添加今日任务过滤逻辑，只显示当天的任务
- 修改quadrantTasks对象，使其只包含今日任务
- 确保四象限视图和列表视图都只显示今日任务

**实现代码**：
```typescript
// 过滤今日任务
const todayTasks = useMemo(() => {
  const today = new Date().toISOString().split('T')[0]
  return tasks.filter((task: Task) => {
    if (!task.dueDate) return false
    const taskDate = task.dueDate.split('T')[0] || task.dueDate
    return taskDate === today
  })
}, [tasks])

// 四象限数据分组（仅今日任务）
const quadrantTasks = useMemo(() => {
  return {
    importantUrgent: todayTasks.filter((task: Task) => task.important && task.urgent),
    importantNotUrgent: todayTasks.filter((task: Task) => task.important && !task.urgent),
    notImportantUrgent: todayTasks.filter((task: Task) => !task.important && task.urgent),
    notImportantNotUrgent: todayTasks.filter((task: Task) => !task.important && !task.urgent)
  }
}, [todayTasks])

// 列表视图也只显示今日任务
{view === 'list' && (
  <div className="space-y-3">
    {todayTasks.map((task: Task) => (
      // 任务列表项
    ))}
  </div>
)}
```

### 2. 修复日历视图显示问题

**文件**：`components/calendar/CalendarView.tsx`

**修改内容**：
- 改进dueDate格式处理，确保任务能正确按日期分组
- 处理不同格式的dueDate（ISO字符串或日期对象）
- 确保任务状态为pending_approval的任务也能显示

**实现代码**：
```typescript
// 按日期分组任务
const tasksByDate = useMemo(() => {
  return tasks.reduce<Record<string, Task[]>>((acc: Record<string, Task[]>, task: Task) => {
    if (!task.dueDate) return acc
    
    let dateString: string
    try {
      // 处理不同格式的dueDate
      const date = new Date(task.dueDate)
      if (isNaN(date.getTime())) {
        // 如果是字符串但不是ISO格式，直接使用
        dateString = task.dueDate.split('T')[0] || task.dueDate
      } else {
        // 转换为ISO字符串格式
        dateString = date.toISOString().split('T')[0]
      }
    } catch (error) {
      // 处理转换错误
      dateString = task.dueDate.split('T')[0] || task.dueDate
    }
    
    if (!acc[dateString]) {
      acc[dateString] = []
    }
    acc[dateString].push(task)
    return acc
  }, {})
}, [tasks])
```

### 3. 简化AI提问

**文件**：`server/api/routes/ai-task.ts`

**修改内容**：
- 简化系统提示词，要求AI用更简洁、自然的方式提问
- 要求AI像聊天一样慢慢问，不要一次性问太多问题
- 降低AI回复的复杂性

**实现代码**：
```typescript
// 简化后的系统提示词
const systemPrompt = `你是一个基于福格行为模型的私人任务助理。

用户信息：
- MBTI: ${personality?.mbti || '未知'}
- 学习风格: ${personality?.learningStyle || '未知'}
- 高效时间段: ${personality?.preferredTime || '未知'}

工作原则：
1. 像真实的私人助理一样自然聊天
2. 用简洁的语言提问，不要冗长
3. 每次只问一个问题，循序渐进
4. 了解用户的任务目标和动机
5. 询问任务难度和时间安排
6. 基于福格行为模型生成合理的任务
7. 支持渐进式任务生成
8. 结合用户实际情况调整计划

请用友好、自然的方式与用户交流，帮助用户制定任务计划。

最后使用 \`\`\`task 标记包裹生成的JSON格式任务数据。
`
```

## 三、实施步骤

### 1. 修复首页今日任务显示
- 修改app/(main)/home/page.tsx文件
- 添加今日任务过滤逻辑
- 更新quadrantTasks对象
- 确保四象限视图和列表视图都只显示今日任务

### 2. 修复日历视图显示问题
- 修改components/calendar/CalendarView.tsx文件
- 改进dueDate格式处理
- 确保任务能正确按日期分组
- 测试不同格式的dueDate

### 3. 简化AI提问
- 修改server/api/routes/ai-task.ts文件
- 简化系统提示词
- 要求AI用更简洁、自然的方式提问
- 测试AI回复是否更简洁

## 四、预期效果

### 1. 首页今日任务
- 只显示当天的任务
- 四象限视图和列表视图都只显示今日任务
- 用户能专注于今日任务

### 2. 日历视图
- 正确显示所有任务
- 任务按日期分组
- 支持月视图和日视图切换
- 不同优先级任务用不同颜色标记

### 3. AI交互
- AI用更简洁、自然的方式提问
- 每次只问一个问题
- 像聊天一样与用户交流
- 用户体验更佳

## 五、验证方法

### 1. 首页今日任务
- 检查首页是否只显示当天的任务
- 测试四象限视图和列表视图
- 验证新任务是否能正确显示

### 2. 日历视图
- 检查日历视图是否显示任务
- 测试月视图和日视图切换
- 验证不同日期的任务是否正确显示

### 3. AI交互
- 测试与AI聊天，观察AI提问是否简洁
- 检查AI回复是否自然
- 验证AI是否能生成合理的任务

## 六、时间估算

| 任务 | 时间 |
|------|------|
| 修复首页今日任务 | 30分钟 |
| 修复日历视图 | 30分钟 |
| 简化AI提问 | 30分钟 |
| 测试验证 | 30分钟 |
| **总计** | **2小时** |

## 七、风险评估

### 1. 低风险
- 修复逻辑简单，不会影响其他功能
- 代码修改范围小，容易测试

### 2. 预期收益
- 提高用户体验
- 增强AI交互的易用性
- 确保核心功能正常工作

## 八、结论

通过上述修复，我们将解决用户提出的三个问题，提高AI任务生成功能的易用性和用户体验。修复后，用户将能：
- 在首页看到仅今日任务
- 在日历中查看和管理任务
- 与AI进行简洁、自然的交互

这些修复将使AI任务生成功能更加实用和友好，提高用户的满意度和使用率。