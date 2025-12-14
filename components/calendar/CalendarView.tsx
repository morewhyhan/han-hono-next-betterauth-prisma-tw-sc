'use client'

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks, Task } from '@/hooks/tasks/useTasks'

const CalendarView: React.FC = () => {
  // 默认显示当前月份
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'day'>('month')

  // 获取任务列表
  const { tasks = [], isLoading, isError } = useTasks()

  // 按日期分组任务（使用本地时间）
  const tasksByDate = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc: Record<string, Task[]>, task: Task) => {
      if (!task.dueDate) return acc
      
      try {
        // 使用本地时间生成日期字符串，避免时区差异问题
        const date = new Date(task.dueDate)
        const dateString = date.toLocaleDateString('en-CA') // 格式：YYYY-MM-DD
        if (!acc[dateString]) {
          acc[dateString] = []
        }
        acc[dateString].push(task)
      } catch (error) {
        console.error('Error processing task date:', error, task)
      }
      return acc
    }, {})
  }, [tasks])

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

  const getTasksForDate = (date: Date): Task[] => {
    // 使用本地时间生成日期字符串，与任务分组逻辑保持一致
    const dateString = date.toLocaleDateString('en-CA') // 格式：YYYY-MM-DD
    return tasksByDate[dateString] || []
  }

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getTaskCategory = (important: boolean, urgent: boolean) => {
  if (important && urgent) return '重要且紧急'
  if (important && !urgent) return '重要不紧急'
  if (!important && urgent) return '紧急不重要'
  return '不紧急不重要'
}

const getTaskCategoryColor = (important: boolean, urgent: boolean): string => {
  // 统一使用灰色系，保持简洁
  return 'bg-gray-500 text-white'
}

  // 渲染月视图
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = getFirstDayOfMonth(currentDate)
    const days = []
    
    // 添加空白单元格
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }
    
    // 添加日期单元格
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dateString = date.toLocaleDateString('en-CA') // 格式：YYYY-MM-DD
      const dayTasks = tasksByDate[dateString] || []
      
      days.push(
        <div 
          key={day} 
          className={`p-2 hover:bg-primary/5 cursor-pointer transition-colors ${date.toDateString() === new Date().toDateString() ? 'bg-primary/5' : ''}`}
          onClick={() => {
            setCurrentDate(date)
            setView('day')
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${date.toDateString() === new Date().toDateString() ? 'text-primary' : ''}`}>
              {day}
            </span>
            {dayTasks.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {dayTasks.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayTasks.slice(0, 2).map((task: Task) => (
              <div
              key={task.id}
              className={`text-xs px-1 py-0.5 rounded truncate ${getTaskCategoryColor(task.important, task.urgent)}`}
              title={`${task.title} - ${getTaskCategory(task.important, task.urgent)}`}
            >
              {task.title}
            </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-xs text-muted-foreground text-center">+{dayTasks.length - 2}</div>
            )}
          </div>
        </div>
      )
    }
    
    return (
      <div className="grid grid-cols-7 gap-1 p-2">
        {/* 星期标题 */}
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center font-medium p-2 text-sm text-muted-foreground">{day}</div>
        ))}
        {/* 日期格子 */}
        {days}
      </div>
    )
  }

  // 渲染日视图
  const renderDayView = () => {
    const tasks = getTasksForDate(currentDate)
    
    return (
      <div className="p-4">
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              加载任务中...
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-muted-foreground">
              加载任务失败，请稍后重试
            </div>
          ) : tasks.length > 0 ? (
            tasks.map(task => (
              <div 
                key={task.id} 
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className={`w-2 rounded-full mt-1 ${getTaskCategoryColor(task.important, task.urgent).replace('bg-', 'bg-').replace('text-', '')}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h5 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h5>
                    <span className={`text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary`}>
                      {task.status === 'completed' ? '已完成' : '待完成'}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              今天没有任务，好好休息吧！
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border">
      {/* 导航栏 */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={handlePrev} className="p-1 hover:bg-primary/5 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('zh-CN', view === 'month' ? { year: 'numeric', month: 'long' } : { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <button onClick={handleNext} className="p-1 hover:bg-primary/5 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-1">
            <button 
              className={`px-3 py-1 rounded text-sm transition-colors ${view === 'month' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-card-foreground'}`}
              onClick={() => setView('month')}
            >
              月
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm transition-colors ${view === 'day' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-card-foreground'}`}
              onClick={() => setView('day')}
            >
              日
            </button>
          </div>
        </div>
      </div>
      
      {/* 日历内容 */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">加载日历数据中...</div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">加载日历数据失败，请稍后重试</div>
          </div>
        ) : (
          view === 'month' ? renderMonthView() : renderDayView()
        )}
      </div>
    </div>
  )
}

export default CalendarView