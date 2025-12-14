'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTasks, Task } from '@/hooks/tasks/useTasks'

// 任务项组件
const TaskItem = ({ task, level = 0, children }: { task: Task; level?: number; children?: Task[] }) => {
  const { updateTask, deleteTask } = useTasks()
  const [isExpanded, setIsExpanded] = useState(true)

  // 直接使用传入的children或空数组
  const taskChildren = Array.isArray(children) ? children : []

  const hasChildren = taskChildren.length > 0

  const handleStatusChange = (checked: boolean) => {
    updateTask(task.id.toString(), { status: checked ? 'completed' : 'pending' })
  }

  const handleDelete = () => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteTask(task.id.toString())
    }
  }

  return (
    <div className="space-y-1">
      <div className={`bg-card rounded-lg shadow-sm p-4 border hover:border-primary/50 transition-colors ${level > 0 ? 'ml-6' : ''}`}>
        <div className="flex items-start justify-between">
          <Link 
            href={`/tasks/${task.id}`} 
            className="flex-1"
          >
            <div className="flex items-start space-x-3">
              <Checkbox 
                checked={task.status === "completed"} 
                onCheckedChange={handleStatusChange}
              />
              {hasChildren && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
                  aria-label={isExpanded ? '折叠' : '展开'}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              )}
              <div className="flex-1">
                <h3 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center space-x-3 mt-2">
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      截止日期: {new Date(task.dueDate).toLocaleString('zh-CN')}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`}>
                    {task.important && task.urgent ? '重要且紧急' :
                     task.important && !task.urgent ? '重要不紧急' :
                     !task.important && task.urgent ? '紧急不重要' : '不紧急不重要'}
                  </span>
                  {task.period && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200`}>
                      {task.period}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
          <div className="ml-4">
            <button
              onClick={handleDelete}
              className="text-destructive hover:text-destructive/80 transition-colors p-2 rounded-md hover:bg-destructive/10"
              aria-label="删除任务"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6M9 18h6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 子任务列表 */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {taskChildren.map((child) => (
            <TaskItem key={child.id} task={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TaskList() {
  // 获取任务列表
  const { tasks, isLoading, isError } = useTasks()
  
  // 筛选状态
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'pending' | 'completed' | 'pending_approval',
    priority: 'all' as 'all' | 'important_urgent' | 'important_not_urgent' | 'not_important_urgent' | 'not_important_not_urgent',
    period: 'all' as 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    dateRange: 'all' as 'all' | 'today' | 'this_week' | 'this_month'
  })
  
  // 筛选任务
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      // 状态筛选
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false
      }
      
      // 优先级筛选
      if (filters.priority !== 'all') {
        const taskPriority = task.important && task.urgent ? 'important_urgent' :
                          task.important && !task.urgent ? 'important_not_urgent' :
                          !task.important && task.urgent ? 'not_important_urgent' : 'not_important_not_urgent'
        if (taskPriority !== filters.priority) {
          return false
        }
      }
      
      // 周期筛选
      if (filters.period !== 'all' && task.period !== filters.period) {
        return false
      }
      
      // 日期范围筛选
      if (filters.dateRange !== 'all' && task.dueDate) {
        const taskDate = new Date(task.dueDate)
        const today = new Date()
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        
        switch (filters.dateRange) {
          case 'today':
            if (taskDate.toDateString() !== new Date().toDateString()) {
              return false
            }
            break
          case 'this_week':
            if (taskDate < startOfWeek) {
              return false
            }
            break
          case 'this_month':
            if (taskDate < startOfMonth) {
              return false
            }
            break
        }
      }
      
      return true
    })
  }, [tasks, filters])
  
  // 构建任务树结构
  const taskTree = useMemo(() => {
    // 首先创建一个任务ID到任务的映射
    const taskMap = new Map<number, Task>()
    // 保存所有顶级任务（没有parentId的任务）
    const topLevelTasks: Task[] = []
    // 保存每个任务的子任务
    const childrenMap = new Map<number, Task[]>()
    
    // 初始化映射
    filteredTasks.forEach(task => {
      taskMap.set(task.id, task)
      childrenMap.set(task.id, [])
    })
    
    // 构建父子关系
    filteredTasks.forEach(task => {
      if (task.parentId) {
        // 如果是子任务，添加到父任务的子任务列表中
        const parentTasks = childrenMap.get(task.parentId) || []
        parentTasks.push(task)
        childrenMap.set(task.parentId, parentTasks)
      } else {
        // 如果是顶级任务，直接添加到顶级任务列表
        topLevelTasks.push(task)
      }
    })
    
    return { topLevelTasks, childrenMap }
  }, [filteredTasks])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-card-foreground">所有任务</h1>
              <Button>
                + 新建任务
              </Button>
            </div>
            <div className="text-center py-8 text-muted-foreground">
              加载任务中...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-card-foreground">所有任务</h1>
              <Button>
                + 新建任务
              </Button>
            </div>
            <div className="text-center py-8 text-muted-foreground">
              加载任务失败，请稍后重试
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* 页面标题和新建任务按钮 */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-card-foreground">所有任务</h1>
            <Button>
              + 新建任务
            </Button>
          </div>

          {/* 筛选栏 */}
          <div className="bg-card rounded-lg shadow-sm p-4 border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 状态筛选 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">状态</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value as typeof filters.status })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="pending_approval">待审核</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 优先级筛选 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">优先级</label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters({ ...filters, priority: value as typeof filters.priority })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="important_urgent">重要且紧急</SelectItem>
                    <SelectItem value="important_not_urgent">重要不紧急</SelectItem>
                    <SelectItem value="not_important_urgent">紧急不重要</SelectItem>
                    <SelectItem value="not_important_not_urgent">不紧急不重要</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 周期筛选 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">周期</label>
                <Select
                  value={filters.period}
                  onValueChange={(value) => setFilters({ ...filters, period: value as typeof filters.period })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择周期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="daily">每日</SelectItem>
                    <SelectItem value="weekly">每周</SelectItem>
                    <SelectItem value="monthly">每月</SelectItem>
                    <SelectItem value="yearly">每年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 日期范围筛选 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">日期范围</label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters({ ...filters, dateRange: value as typeof filters.dateRange })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择日期范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="today">今天</SelectItem>
                    <SelectItem value="this_week">本周</SelectItem>
                    <SelectItem value="this_month">本月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 任务列表 */}
          <div className="space-y-3">
            {taskTree.topLevelTasks && taskTree.topLevelTasks.length > 0 ? (
              taskTree.topLevelTasks.map((task: Task) => (
                <TaskItem key={task.id} task={task}>
                  {taskTree.childrenMap.get(task.id) || []}
                </TaskItem>
              ))
            ) : (
              <div className="bg-card rounded-lg shadow-sm p-8 border text-center">
                <p className="text-muted-foreground">
                  暂无符合条件的任务
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}