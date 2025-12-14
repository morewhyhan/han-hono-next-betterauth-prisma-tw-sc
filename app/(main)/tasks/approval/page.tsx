'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useTasks, Task } from '@/hooks/tasks/useTasks'
import { useQueryClient } from '@tanstack/react-query'

// 计算当日晚上23:59:00的时间（当天最后一刻）- 解决时区问题
const getDefaultDeadline = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // 月份从0开始
  const day = String(now.getDate()).padStart(2, '0')
  
  // 直接构建本地时间的YYYY-MM-DDTHH:mm:ss格式字符串
  // 确保显示为本地时间的23:59:00，符合ISO-8601完整格式要求
  return `${year}-${month}-${day}T23:59:00`
}

// 审批任务项组件
const ApprovalTaskItem = ({ task, level = 0, children }: { task: Task; level?: number; children?: Task[] }) => {
  const { updateTask, deleteTask } = useTasks()
  const [isExpanded, setIsExpanded] = useState(true)
  
  // 直接使用传入的children或空数组
  const taskChildren = Array.isArray(children) ? children : []
  
  const handleApprove = async () => {
    await updateTask(task.id.toString(), { status: 'pending' })
  }
  
  const handleWithdraw = async () => {
    if (confirm('确定要撤回这个任务吗？')) {
      await deleteTask(task.id.toString())
    }
  }
  
  const hasChildren = taskChildren.length > 0
  
  return (
    <div className="space-y-1">
      <div className={`bg-secondary p-6 rounded-lg shadow-sm ${level > 0 ? 'ml-6' : ''}`}>
        <h5 className="text-lg font-semibold mb-2">{task.title}</h5>
        {task.description && (
          <p className="text-muted-foreground mb-4">{task.description}</p>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {task.important && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                重要
              </span>
            )}
            {task.urgent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                紧急
              </span>
            )}
            {task.period && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {task.period}
              </span>
            )}
          </div>
          {task.dueDate && (
            <span className="text-sm text-muted-foreground">
              截止日期：{new Date(task.dueDate).toLocaleString('zh-CN')}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={handleApprove}>
            批准
          </Button>
          <Button variant="secondary" onClick={() => {
            // 处理调整逻辑，这里可以复用原有的调整功能
            // 由于原组件结构限制，暂时不实现调整功能
          }}>
            调整
          </Button>
          <Button variant="destructive" onClick={handleWithdraw}>
            撤回
          </Button>
        </div>
      </div>
      
      {/* 子任务列表 */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {taskChildren.map((child) => (
            <ApprovalTaskItem key={child.id} task={child} level={level + 1} />
          ))}
        </div>
      )}
      
      {/* 展开/折叠按钮 */}
      {hasChildren && (
        <div className={`flex justify-start ${level > 0 ? 'ml-6' : ''}`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
          >
            {isExpanded ? '▼ 折叠' : '▶ 展开'} {taskChildren.length} 个子任务
          </button>
        </div>
      )}
    </div>
  )
}

export default function ApprovalTasksPage() {
  // 生成的任务状态
  const [generatedTask, setGeneratedTask] = useState<any>(null)
  const [showTaskReview, setShowTaskReview] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  
  // 表单字段状态 - 使用空的截止时间，在弹窗打开时动态设置
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    deadline: getDefaultDeadline(),
    important: false,
    urgent: false
  })
  
  // 使用useTasks hook
  const { tasks, isLoading, isError, createTask, updateTask, deleteTask } = useTasks()
  
  // React Query客户端
  const queryClient = useQueryClient()
  
  // 筛选待审批任务
  const pendingApprovalTasks = tasks.filter((task: Task) => task.status === "pending_approval")
  
  // 构建任务树结构
  const taskTree = React.useMemo(() => {
    // 首先创建一个任务ID到任务的映射
    const taskMap = new Map<number, Task>()
    // 保存所有顶级任务（没有parentId的任务）
    const topLevelTasks: Task[] = []
    // 保存每个任务的子任务
    const childrenMap = new Map<number, Task[]>()
    
    // 初始化映射
    pendingApprovalTasks.forEach(task => {
      taskMap.set(task.id, task)
      childrenMap.set(task.id, [])
    })
    
    // 构建父子关系
    pendingApprovalTasks.forEach(task => {
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
  }, [pendingApprovalTasks])
  
  // 重置表单函数
  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      deadline: getDefaultDeadline(),
      important: false,
      urgent: false
    })
  }
  
  // 处理审核通过
  const handleApprove = async (task: Task) => {
    await updateTask(task.id.toString(), { status: 'pending' })
  }
  
  // 处理任务调整
  const handleAdjust = (task: Task) => {
    setCurrentTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      deadline: task.dueDate || getDefaultDeadline(),
      important: task.important,
      urgent: task.urgent
    })
    setIsEditDialogOpen(true)
  }
  
  // 处理任务撤回
  const handleWithdraw = async (task: Task) => {
    await deleteTask(task.id.toString())
  }
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentTask) return
    
    try {
      // 更新任务
      await updateTask(currentTask.id.toString(), {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.deadline,
        important: taskForm.important,
        urgent: taskForm.urgent
      })
      
      // 关闭弹窗
      setIsEditDialogOpen(false)
      setCurrentTask(null)
      resetForm()
    } catch (error) {
      console.error('更新任务失败:', error)
    }
  }
  
  return (
    <div className="flex-1 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">待审核任务</h2>
            </div>
          </CardContent>
        </Card>
        
        {/* 待审核任务列表 */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6 md:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">加载任务中...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-destructive">加载任务失败，请重试</p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })} 
                  className="mt-4"
                >
                  重试
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {taskTree.topLevelTasks.length > 0 ? (
                  <div className="space-y-6">
                    {taskTree.topLevelTasks.map((task: Task) => (
                      <ApprovalTaskItem key={task.id} task={task}>
                        {taskTree.childrenMap.get(task.id) || []}
                      </ApprovalTaskItem>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>暂无待审核任务</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 任务编辑弹窗 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>调整任务</DialogTitle>
              <DialogDescription>
                调整任务详情，然后保存
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-sm font-medium">任务标题 *</Label>
                <Input
                  id="title"
                  placeholder="输入任务标题"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-sm font-medium">任务描述</Label>
                <Textarea
                  id="description"
                  placeholder="输入任务描述（可选）"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full min-h-[100px]"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="deadline" className="text-sm font-medium">截止时间 *</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="important" className="text-sm font-medium">重要</Label>
                  </div>
                  <Switch
                    id="important"
                    checked={taskForm.important}
                    onCheckedChange={(checked) => setTaskForm({ ...taskForm, important: checked || false })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="urgent" className="text-sm font-medium">紧急</Label>
                  </div>
                  <Switch
                    id="urgent"
                    checked={taskForm.urgent}
                    onCheckedChange={(checked) => setTaskForm({ ...taskForm, urgent: checked || false })}
                  />
                </div>
              </div>
            </form>
            <DialogFooter className="gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                取消
              </Button>
              <Button 
                type="submit"
                onClick={handleSubmit}
                disabled={!taskForm.title.trim()}
              >
                保存修改
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
