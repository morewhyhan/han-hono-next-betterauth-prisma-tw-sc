# 基于福格行为模型的AI智能任务规划系统前端实现计划

## 1. 前端技术栈
- **框架**：Next.js 15 + React 19
- **样式**：Tailwind CSS
- **UI组件**：Radix UI + 自定义组件
- **状态管理**：React Query
- **HTTP客户端**：ky
- **图标**：lucide-react

## 2. 页面设计与实现

### 2.1 仪表盘页面 (/home)
**核心功能**：展示福格三要素健康度、AI建议、今日任务概览

**组件设计**：
- **FoggDashboard**：福格三要素评分仪表盘，使用雷达图或柱状图展示
- **AiSuggestions**：AI每日建议列表，支持接受/拒绝操作
- **TodayTasks**：今日任务概览，显示待完成、进行中、已完成任务数量
- **TaskList**：今日任务列表，支持任务操作

**实现要点**：
- 使用React Query获取AI建议和任务数据
- 实现动态评分显示
- 添加任务状态切换功能

### 2.2 个性设置页面 (/settings/personality)
**核心功能**：设置MBTI、学习风格、能量水平等个性特点

**组件设计**：
- **PersonalityForm**：个性特点设置表单
- **MbtiSelector**：MBTI类型选择器
- **LearningStyleSelector**：学习风格选择器
- **EnergyLevelSlider**：能量水平滑块
- **WorkRhythmSelector**：工作节奏选择器
- **PreferredTimeSelector**：偏好时间选择器

**实现要点**：
- 表单验证
- 实时预览
- 数据持久化

### 2.3 AI聊天页面 (/ai-chat)
**核心功能**：AI主动与用户聊天，了解任务需求

**组件设计**：
- **ChatWindow**：聊天窗口，显示对话记录
- **ChatMessage**：聊天消息组件，区分AI和用户消息
- **ChatInput**：聊天输入框，支持发送消息
- **ChatFlow**：聊天流程控制器，管理AI对话逻辑

**实现要点**：
- 消息动画效果
- 打字机效果
- 对话状态管理

### 2.4 日历视图页面 (/calendar)
**核心功能**：查看每日任务安排

**组件设计**：
- **CalendarView**：日历视图，支持月/日切换
- **MonthView**：月视图，显示每月任务数量
- **DayView**：日视图，显示每日任务详情
- **TaskItem**：任务项，显示任务时间和标题

**实现要点**：
- 日期导航
- 任务数量标记
- 响应式设计

### 2.5 任务详情页面 (/tasks/[id])
**核心功能**：查看和管理具体任务

**组件设计**：
- **TaskHeader**：任务头部，显示标题和操作按钮
- **TaskInfo**：任务信息，显示描述、状态、优先级等
- **FoggScores**：福格三要素评分，显示动机、能力、提示分数
- **AiTaskSuggestions**：AI任务建议，针对该任务的具体建议
- **TaskActions**：任务操作按钮，开始/完成/推迟任务

**实现要点**：
- 动态评分展示
- 任务状态更新
- 建议接受/拒绝功能

## 3. 核心组件设计

### 3.1 FoggDashboard组件
```tsx
// components/dashboard/FoggDashboard.tsx
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FoggDashboardProps {
  motivation: number
  ability: number
  prompt: number
}

const FoggDashboard: React.FC<FoggDashboardProps> = ({ motivation, ability, prompt }) => {
  const data = [
    { name: '动机', value: motivation * 100 },
    { name: '能力', value: ability * 100 },
    { name: '提示', value: prompt * 100 },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">福格三要素健康度</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default FoggDashboard
```

### 3.2 AiChat组件
```tsx
// components/chat/AiChat.tsx
import React, { useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'ai' | 'user'
  timestamp: Date
}

const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '您好！我是您的AI任务规划助手。请问您想要完成什么长期目标呢？',
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages([...messages, newMessage])
    setInput('')
    
    // 模拟AI回复
    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        content: '感谢您的分享！让我为您制定一个个性化的计划。',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiReply])
    }, 1000)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        AI聊天助手
      </h3>
      <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${message.sender === 'ai' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="输入您的回答..." 
          className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          className="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600 transition-colors"
          onClick={handleSend}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default AiChat
```

### 3.3 CalendarView组件
```tsx
// components/calendar/CalendarView.tsx
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarViewProps {
  // 日历数据
}

const CalendarView: React.FC<CalendarViewProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'day'>('month')

  const handlePrev = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setDate(newDate.getDate() - 1)
      }
      return newDate
    })
  }

  const handleNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() + 1)
      } else {
        newDate.setDate(newDate.getDate() + 1)
      }
      return newDate
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">日历视图</h3>
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('month')}
          >
            月视图
          </button>
          <button 
            className={`px-3 py-1 rounded ${view === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('day')}
          >
            日视图
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h4 className="text-lg font-medium">
          {currentDate.toLocaleDateString('zh-CN', view === 'month' ? { year: 'numeric', month: 'long' } : { year: 'numeric', month: 'long', day: 'numeric' })}
        </h4>
        <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* 日历内容 */}
      <div className="border border-gray-200 rounded-lg">
        {view === 'month' ? (
          <div className="grid grid-cols-7 gap-1 p-2">
            {/* 星期标题 */}
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center font-medium p-2">{day}</div>
            ))}
            {/* 日期格子 */}
            {/* 实现日期显示和任务数量标记 */}
          </div>
        ) : (
          <div className="p-4">
            {/* 日视图任务列表 */}
            <div className="space-y-2">
              {/* 任务项 */}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarView
```

## 3. 状态管理与API调用

### 3.1 API客户端配置
```tsx
// lib/api-client.ts
import ky from 'ky'

export const apiClient = ky.create({
  prefixUrl: '/api',
  credentials: 'include',
})
```

### 3.2 React Query配置
```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### 3.3 API Hooks
```tsx
// hooks/useTasks.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface Task {
  id: string
  title: string
  description?: string
  motivation: number
  ability: number
  prompt: number
  status: string
  priority: number
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export const useTasks = () => {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('tasks')
      return response.json()
    },
  })
}
```

## 4. 样式与UI设计

### 4.1 颜色方案
- **主色调**：蓝色 (#3b82f6) - 代表信任和智能
- **辅助色**：紫色 (#8b5cf6) - 代表创新和个性
- **成功色**：绿色 (#10b981) - 代表完成和成功
- **警告色**：黄色 (#f59e0b) - 代表提醒和警告
- **危险色**：红色 (#ef4444) - 代表错误和删除

### 4.2 排版方案
- **标题**：使用Inter字体，粗体
- **正文**：使用Inter字体，常规
- **按钮文本**：使用Inter字体，中等粗细
- **辅助文字**：使用Inter字体，浅色

### 4.3 响应式设计
- **移动端**：单列布局，隐藏次要信息
- **平板**：双列布局，显示更多信息
- **桌面**：三列布局，完整展示所有功能

## 5. 实现步骤

### 5.1 基础设置
1. 安装必要依赖（recharts用于图表）
2. 配置React Query
3. 配置API客户端

### 5.2 组件开发
1. 开发基础UI组件（按钮、卡片、表单等）
2. 开发福格三要素仪表盘组件
3. 开发AI聊天组件
4. 开发日历视图组件
5. 开发任务列表组件
6. 开发个性设置表单组件

### 5.3 页面集成
1. 更新home页面，集成仪表盘和任务列表
2. 开发个性设置页面
3. 开发AI聊天页面
4. 开发日历视图页面
5. 开发任务详情页面

### 5.4 功能实现
1. 实现任务CRUD功能
2. 实现AI建议接受/拒绝功能
3. 实现个性特点保存功能
4. 实现任务状态切换功能
5. 实现日历视图切换功能

### 5.5 优化与测试
1. 优化页面加载性能
2. 优化移动端体验
3. 添加错误处理
4. 测试所有功能
5. 进行UI/UX优化

## 6. 预期效果

### 6.1 用户体验
- **极简操作**：用户只需输入需求，AI完成所有规划
- **直观可视化**：清晰的图表和日历，易于理解
- **个性化服务**：基于多种个性特点，提供精准建议
- **流畅交互**：响应式设计，流畅动画效果

### 6.2 功能效果
- **福格模型应用**：可视化展示动机、能力、提示三要素
- **AI主动聊天**：AI引导用户完成任务规划
- **日历化管理**：直观的日历视图，便于查看每日任务
- **个性定制**：结合MBTI等个性特点，提供个性化建议

## 7. 后续扩展

### 7.1 功能扩展
- 添加语音交互功能
- 集成第三方日历服务
- 添加社交分享功能
- 实现任务提醒推送

### 7.2 技术扩展
- 引入AI生成图像功能
- 实现离线支持
- 添加PWA支持
- 优化性能，实现SSR/SSG

这个前端实现计划将创建一个极简、直观、功能完整的AI智能任务规划系统，突出福格行为模型的应用和AI的主动能力，同时保持良好的用户体验。