'use client'

import React, { useState, useEffect } from 'react'
import { Bot, Calendar, ChevronRight, MoreHorizontal, CheckIcon, ListIcon, GridIcon, PlusIcon, BrainIcon, Clock, Star, User, Send, Edit, Trash2, Copy, Flag, Clock as ClockIcon2, Bell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTasks, Task } from '@/hooks/tasks/useTasks'
import { useAiChat } from '@/hooks/useAiChat'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { fetch } from '@/lib/api-client'



export default function Dashboard() {
  // 视图切换状态
  const [view, setView] = useState<'list' | 'quadrant'>('quadrant')
  
  // 新建任务弹窗状态
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  // 手动新建任务表单弹窗状态
  const [isManualTaskDialogOpen, setIsManualTaskDialogOpen] = useState(false)
  
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
  
  // 表单字段状态 - 使用空的截止时间，在弹窗打开时动态设置
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    deadline: '', // 初始化为空，在弹窗打开时设置
    important: false,
    urgent: false
  })
  
  // AI指导弹窗状态
  const [isAiGuideDialogOpen, setIsAiGuideDialogOpen] = useState(false)
  
  // AI聊天消息状态
  const [aiMessages, setAiMessages] = useState([
    {
      id: '1',
      content: '您好！我是您的AI任务规划助手。请告诉我您想要完成的任务或目标，我会帮您规划。',
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  
  // AI聊天输入状态
  const [aiInput, setAiInput] = useState('')
  
  // 生成的任务状态
  interface GeneratedTask {
    title: string;
    description?: string;
    deadline?: string;
    important?: boolean;
    urgent?: boolean;
    period?: string;
    children?: GeneratedTask[];
  }
  
  const [generatedTask, setGeneratedTask] = useState<GeneratedTask | null>(null)
  const [showTaskReview, setShowTaskReview] = useState(false)
  
  // AI主动询问弹窗状态
  const [isAiInquiryOpen, setIsAiInquiryOpen] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [userInput, setUserInput] = useState('')
  
  // AI审查功能状态
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false)
  
  interface AiReviewChange {
    title?: string;
    description?: string;
    dueDate?: string;
    important?: boolean;
    urgent?: boolean;
    difficulty?: number;
    motivation?: number;
  }
  
  interface AiReviewTask {
    title: string;
    description?: string;
    dueDate?: string;
    important: boolean;
    urgent: boolean;
    difficulty?: number;
    motivation?: number;
  }
  
  interface FailedTask {
    taskId: number | string | 'new-task';
    error: string;
  }
  
  interface AiReviewResult {
    summary: string;
    suggestions: string[];
    optimizationPlan: Array<{
      type: 'update' | 'create';
      taskId?: number | string;
      changes?: AiReviewChange;
      task?: AiReviewTask;
    }>;
  }
  
  const [aiReviewResult, setAiReviewResult] = useState<AiReviewResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  
  // 使用useTasks hook
  const { tasks, isLoading, isError, createTask, toggleTaskStatus, deleteTask, updateTask } = useTasks()
  
  // 使用useAiChat hook
  const { generateAiResponse } = useAiChat()
  
  // React Query客户端
  const queryClient = useQueryClient()
  
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
    try {
      // 调用AI API获取建议
      const response = await fetch.post('api/ai-task', { 
        json: { 
          messages: [
            {
              role: 'user',
              content: '请根据我之前的任务完成情况，为我生成今日的任务安排建议'
            }
          ],
          userId: 'default-user-id' // 实际应该获取当前用户ID
        } 
      })
      const data = await response.json() as { message?: string }
      setAiSuggestion(data.message || '')
    } catch (error) {
      console.error('获取AI建议失败:', error)
      setAiSuggestion('根据您之前的任务完成情况，建议您今天继续专注于未完成的重要任务。')
    }
  }
  
  // 提交用户反馈
  const submitInquiry = async () => {
    try {
      // 调用AI API提交反馈
      await fetch.post('api/ai-task', { 
        json: { 
          messages: [
            {
              role: 'assistant',
              content: aiSuggestion
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          userId: 'default-user-id' // 实际应该获取当前用户ID
        } 
      })
      
      // 记录今天已询问
      localStorage.setItem('lastAiInquiry', new Date().toDateString())
      // 关闭弹窗
      setIsAiInquiryOpen(false)
    } catch (error) {
      console.error('提交反馈失败:', error)
      // 即使失败也关闭弹窗
      localStorage.setItem('lastAiInquiry', new Date().toDateString())
      setIsAiInquiryOpen(false)
    }
  }
  
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
  
  // 取消按钮点击事件
  const handleCancel = () => {
    resetForm()
    setIsManualTaskDialogOpen(false)
  }
  
  // 监听弹窗打开状态，当弹窗打开时更新截止时间
  useEffect(() => {
    if (isManualTaskDialogOpen) {
      // 弹窗打开时，重置所有字段并设置正确的截止时间
      const newDeadline = getDefaultDeadline()
      setTaskForm({
        title: '',
        description: '',
        deadline: newDeadline,
        important: false,
        urgent: false
      })
    } else {
      // 弹窗关闭时重置表单
      setTaskForm({
        title: '',
        description: '',
        deadline: '',
        important: false,
        urgent: false
      })
    }
  }, [isManualTaskDialogOpen])
  
  // 过滤今日任务（使用本地时间，避免时区差异）
  const todayTasks = tasks.filter((task: Task) => {
    if (!task.dueDate) return false
    
    // 创建日期对象
    const taskDate = new Date(task.dueDate)
    const today = new Date()
    
    // 比较年、月、日是否相同
    return (
      taskDate.getFullYear() === today.getFullYear() &&
      taskDate.getMonth() === today.getMonth() &&
      taskDate.getDate() === today.getDate()
    )
  })

  // 四象限数据分组（仅今日任务）
  const quadrantTasks = {
    importantUrgent: todayTasks.filter((task: Task) => task.important && task.urgent),
    importantNotUrgent: todayTasks.filter((task: Task) => task.important && !task.urgent),
    notImportantUrgent: todayTasks.filter((task: Task) => !task.important && task.urgent),
    notImportantNotUrgent: todayTasks.filter((task: Task) => !task.important && !task.urgent)
  }
  
  // 发送AI聊天消息
  const handleAiSendMessage = async () => {
    if (!aiInput.trim()) return
    
    // 添加用户消息
    const userMessage = {
      id: Date.now().toString(),
      content: aiInput,
      sender: 'user',
      timestamp: new Date()
    }
    
    const updatedMessages = [...aiMessages, userMessage]
    setAiMessages(updatedMessages)
    setAiInput('')
    
    // 准备API请求格式的消息
    const apiMessages = updatedMessages.map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }))
    
    // 调用AI API获取真实回复
    try {
      const response = await generateAiResponse.mutateAsync(apiMessages)
      
      // 解析AI回复
      const aiResponse = response.message
      
      // 检查是否包含任务生成标记
      if (aiResponse.includes('```task')) {
        // 提取任务信息
        const taskMatch = aiResponse.match(/```task([\s\S]*?)```/)
        if (taskMatch && taskMatch[1]) {
          try {
            const taskData = JSON.parse(taskMatch[1].trim()) as GeneratedTask
            setGeneratedTask(taskData)
            setShowTaskReview(true)
            
            // 显示任务生成完成消息
            const aiMessage = {
              id: (Date.now() + 1).toString(),
              content: '我已经为您生成了一个任务计划，请查看并确认是否符合您的需求。',
              sender: 'ai',
              timestamp: new Date()
            }
            setAiMessages([...updatedMessages, aiMessage])
          } catch (error) {
            console.error('解析生成的任务失败:', error)
            // 显示错误消息
            const aiMessage = {
              id: (Date.now() + 1).toString(),
              content: '抱歉，任务生成过程中出现了问题，请重试。',
              sender: 'ai',
              timestamp: new Date()
            }
            setAiMessages([...updatedMessages, aiMessage])
          }
        }
      } else {
        // 普通聊天回复
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        }
        setAiMessages([...updatedMessages, aiMessage])
      }
    } catch (error) {
      console.error('AI聊天请求失败:', error)
      // 显示错误消息
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，AI服务暂时不可用，请稍后重试。',
        sender: 'ai',
        timestamp: new Date()
      }
      setAiMessages([...updatedMessages, errorMessage])
    }
  }
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 创建任务
      await createTask({
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.deadline,
        important: taskForm.important,
        urgent: taskForm.urgent
      })
      
      // 重置表单，使用当日晚上12点作为新的默认截止时间
      setTaskForm({
        title: '',
        description: '',
        deadline: getDefaultDeadline(),
        important: false,
        urgent: false
      })
      
      // 关闭弹窗
      setIsManualTaskDialogOpen(false)
      
      // 确保任务列表刷新
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch (error) {
      console.error('创建任务失败:', error)
      // 可以添加错误提示逻辑
    }
  }
  
  // 递归创建父子任务
  const createTaskRecursive = async (taskData: GeneratedTask, parentId?: number) => {
    // 严格的数据验证和默认值处理
    const taskTitle = taskData.title?.trim() || '未命名任务'
    const taskDescription = taskData.description?.trim() || ''
    const taskDeadline = taskData.deadline || getDefaultDeadline()
    const taskImportant = typeof taskData.important === 'boolean' ? taskData.important : false
    const taskUrgent = typeof taskData.urgent === 'boolean' ? taskData.urgent : false
    const taskStatus = 'pending_approval' // 所有AI生成的任务初始状态为待审批
    const taskPeriod = taskData.period || ''
    
    // 创建任务
    const createdTask = await createTask({
      title: taskTitle,
      description: taskDescription,
      dueDate: taskDeadline,
      important: taskImportant,
      urgent: taskUrgent,
      status: taskStatus,
      period: taskPeriod,
      parentId: parentId || undefined
    })
    
    // 如果有子任务，递归创建
    if (taskData.children && Array.isArray(taskData.children)) {
      for (const childTask of taskData.children) {
        await createTaskRecursive(childTask, createdTask.id)
      }
    }
    
    return createdTask
  }

  // 处理AI生成任务的审核通过
  const handleTaskApproval = async () => {
    if (!generatedTask) return
    
    try {
      // 递归创建父子任务链
      await createTaskRecursive(generatedTask)
      
      // 关闭审核界面和AI弹窗
      setShowTaskReview(false)
      setGeneratedTask(null)
      setIsAiGuideDialogOpen(false)
      
      // 确保任务列表刷新
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch (error) {
      console.error('创建AI生成的任务失败:', error)
      // 可以添加错误提示逻辑
    }
  }
  
  // 处理AI生成任务的拒绝
  const handleTaskRejection = () => {
    setShowTaskReview(false)
    setGeneratedTask(null)
    
    // 继续AI对话
    const aiMessage = {
      id: Date.now().toString(),
      content: '好的，让我们重新讨论任务规划。请告诉我您对之前生成的任务有什么不满意的地方，或者您有什么新的想法。',
      sender: 'ai',
      timestamp: new Date()
    }
    setAiMessages([...aiMessages, aiMessage])
  }
  
  // 处理AI审查按钮点击
  const handleAiReview = async () => {
    setIsAnalyzing(true)
    setAiReviewResult(null)
    setIsAiReviewOpen(true)
    
    try {
      // 收集最近的任务数据（最近7天）
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const recentTasks = tasks.filter((task: Task) => {
        if (!task.createdAt) return false
        return new Date(task.createdAt) >= sevenDaysAgo
      })
      
      // 准备任务数据供AI分析
      const taskStats = {
        totalTasks: recentTasks.length,
        completedTasks: recentTasks.filter((task: Task) => task.status === 'completed').length,
        pendingTasks: recentTasks.filter((task: Task) => task.status === 'pending').length,
        avgDifficulty: recentTasks.length > 0 ? 
          recentTasks.reduce((sum, task) => (sum + (task.difficulty || 0)), 0) / recentTasks.length : 0,
        avgMotivation: recentTasks.length > 0 ? 
          recentTasks.reduce((sum, task) => (sum + (task.motivation || 0)), 0) / recentTasks.length : 0,
        recentTasks: recentTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate,
          important: task.important,
          urgent: task.urgent,
          difficulty: task.difficulty,
          motivation: task.motivation
        }))
      }
      
      // 构建AI分析请求（只发送用户消息，API会自动添加系统提示）
      const aiMessages = [
        {
          role: 'user',
          content: `请分析以下任务数据，并提供优化建议。请严格以JSON格式返回优化建议，包含优化计划、任务修改方案和新增任务方案。\n优化计划格式：\n{\n  "summary": "分析总结",\n  "suggestions": ["建议1", "建议2"],\n  "optimizationPlan": [\n    {\n      "type": "update",\n      "taskId": "任务ID",\n      "changes": {\n        "title": "可选：新任务标题",\n        "description": "可选：新任务描述",\n        "dueDate": "可选：新截止时间，格式YYYY-MM-DDTHH:mm:ss",\n        "important": true/false,\n        "urgent": true/false,\n        "difficulty": 1-10,\n        "motivation": 1-10\n      }\n    },\n    {\n      "type": "create",\n      "task": {\n        "title": "新任务标题",\n        "description": "新任务描述",\n        "dueDate": "截止时间，格式YYYY-MM-DDTHH:mm:ss",\n        "important": true/false,\n        "urgent": true/false,\n        "difficulty": 1-10,\n        "motivation": 1-10\n      }\n    }\n  ]\n}\n\n任务数据：\n${JSON.stringify(taskStats, null, 2)}`
        }
      ]
      
      // 调用AI API获取分析结果
      const response = await generateAiResponse.mutateAsync(aiMessages)
      
      // 处理AI返回结果
      try {
        // 提取JSON部分
        const jsonMatch = response.message.match(/```json([\s\S]*?)```/) || response.message.match(/(\{[\s\S]*\})/)
        if (jsonMatch && jsonMatch[1]) {
          const jsonStr = jsonMatch[1].trim()
          const parsedResult = JSON.parse(jsonStr)
          
          setAiReviewResult({
            summary: parsedResult.summary || response.message,
            suggestions: parsedResult.suggestions || [],
            optimizationPlan: parsedResult.optimizationPlan || []
          })
        } else {
          // 如果没有JSON，使用原始消息
          setAiReviewResult({
            summary: response.message,
            suggestions: [],
            optimizationPlan: []
          })
        }
      } catch (parseError) {
        console.error('解析AI结果失败:', parseError)
        // 解析失败时使用原始消息
        setAiReviewResult({
          summary: response.message,
          suggestions: [],
          optimizationPlan: []
        })
      }
    } catch (error) {
      console.error('AI审查失败:', error)
      setAiReviewResult({
        summary: 'AI审查失败，请稍后重试。',
        suggestions: [],
        optimizationPlan: []
      })
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  // 处理任务优化
  const handleOptimizeTasks = async () => {
    setIsOptimizing(true)
    
    try {
      let successCount = 0
      let failCount = 0
      const failedTasks: FailedTask[] = []
      
      // 如果有AI生成的优化计划，使用计划优化
      if (aiReviewResult?.optimizationPlan && aiReviewResult.optimizationPlan.length > 0) {
        // 使用AI优化计划
        for (const plan of aiReviewResult.optimizationPlan) {
          try {
            if (plan.type === 'update') {
              // 查找对应的任务
              const taskToUpdate = tasks.find((t: Task) => {
                // 处理不同的ID类型比较
                const planId = String(plan.taskId)
                const taskId = String(t.id)
                return planId === taskId
              })
              
              if (taskToUpdate) {
                await updateTask(taskToUpdate.id.toString(), plan.changes || {})
                successCount++
              } else {
                failCount++
                failedTasks.push({ taskId: plan.taskId || 'unknown', error: '任务不存在' })
              }
            } else if (plan.type === 'create' && plan.task) {
              // 新增任务
              await createTask(plan.task)
              successCount++
            } else if (plan.type === 'create') {
              // 如果没有任务数据，跳过
              failCount++
              failedTasks.push({ taskId: 'new-task', error: '任务数据不完整' })
            }
          } catch (error) {
            failCount++
            failedTasks.push({ 
              taskId: plan.type === 'update' ? (plan.taskId || 'unknown') : 'new-task', 
              error: (error as Error).message 
            })
          }
        }
      } else {
        // 没有优化计划时，使用默认优化策略
        // 将所有未完成的重要任务设置为更紧急
        const tasksToOptimize = tasks.filter((task: Task) => task.status === 'pending' && task.important)
        
        for (const task of tasksToOptimize) {
          try {
            await updateTask(task.id.toString(), { urgent: true })
            successCount++
          } catch (error) {
            failCount++
            failedTasks.push({ taskId: task.id, error: (error as Error).message })
          }
        }
      }
      
      // 刷新任务列表
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      // 显示优化结果
      alert(`任务优化完成！\n成功：${successCount}个\n失败：${failCount}个`)
      
      // 关闭弹窗
      setIsAiReviewOpen(false)
    } catch (error) {
      console.error('任务优化失败:', error)
      alert('任务优化失败，请稍后重试。')
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* 主要内容 */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* 欢迎信息 */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">欢迎回来！</h2>
                  <p className="text-muted-foreground mt-2 text-base">
                    {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* 提醒图标 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                        <Bell className="h-5 w-5" />
                        {/* 未读提醒数量 */}
                        {tasks.filter((task: Task) => task.remindAt && new Date(task.remindAt) < new Date() && !task.isReminded).length > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-primary-foreground text-xs flex items-center justify-center">
                            {tasks.filter((task: Task) => task.remindAt && new Date(task.remindAt) < new Date() && !task.isReminded).length}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="p-2">
                        <h4 className="font-medium mb-3">任务提醒</h4>
                        {tasks.filter((task: Task) => task.remindAt && !task.isReminded).length > 0 ? (
                          <div className="space-y-2">
                            {tasks.filter((task: Task) => task.remindAt && !task.isReminded).map((task: Task) => (
                              <div key={task.id} className="p-3 bg-secondary rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-medium">{task.title}</h5>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      提醒时间：{new Date(task.remindAt!).toLocaleString('zh-CN')}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      // 标记为已提醒
                                      updateTask(task.id.toString(), { isReminded: true })
                                    }}
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">暂无未读提醒</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button 
                    size="lg" 
                    className="shadow-sm hover:shadow-md transition-all duration-200"
                    onClick={() => setIsNewTaskDialogOpen(true)}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    新建任务
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="shadow-sm hover:shadow-md transition-all duration-200"
                    onClick={handleAiReview}
                  >
                    <BrainIcon className="h-5 w-5 mr-2" />
                    AI审查
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 任务视图切换 */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold">今日任务</h3>
                <Tabs value={view} onValueChange={(v: string) => setView(v as 'list' | 'quadrant')}>
                  <TabsList className="grid grid-cols-2 w-[180px]">
                    <TabsTrigger value="quadrant" className="flex items-center gap-2">
                      <GridIcon className="h-4 w-4" />
                      四象限
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <ListIcon className="h-4 w-4" />
                      列表
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* 加载状态 */}
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
                <>
                  {/* 四象限视图 */}
                  {view === 'quadrant' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 grid-rows-auto grid-flow-dense">
                      {/* 定义象限配置 */}
                      {
                        [
                          {
                            id: 'importantUrgent',
                            title: '重要且紧急',
                            color: 'gray',
                            borderColor: 'gray-400',
                            borderColorDark: 'gray-500',
                          },
                          {
                            id: 'importantNotUrgent',
                            title: '重要不紧急',
                            color: 'gray',
                            borderColor: 'gray-400',
                            borderColorDark: 'gray-500',
                          },
                          {
                            id: 'notImportantUrgent',
                            title: '紧急不重要',
                            color: 'gray',
                            borderColor: 'gray-400',
                            borderColorDark: 'gray-500',
                          },
                          {
                            id: 'notImportantNotUrgent',
                            title: '不紧急不重要',
                            color: 'gray',
                            borderColor: 'gray-400',
                            borderColorDark: 'gray-500',
                          }
                        ].map((quadrant) => (
                          <div key={quadrant.id} className="flex flex-col">
                            <Card className={`border-l-2 border-${quadrant.borderColor} rounded-lg transition-all duration-200 hover:shadow-sm dark:border-${quadrant.borderColorDark} flex-grow`}>
                              <CardContent className="p-3 sm:p-4 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className={`text-sm font-medium text-gray-700 dark:text-gray-300`}>
                                    {quadrant.title}
                                  </h4>
                                  <span className="text-xs text-muted-foreground">
                                    {quadrantTasks[quadrant.id as keyof typeof quadrantTasks].length} 项
                                  </span>
                                </div>
                                
                                <div className="space-y-1.5 flex-grow">
                                  {quadrantTasks[quadrant.id as keyof typeof quadrantTasks].length > 0 ? (
                                    quadrantTasks[quadrant.id as keyof typeof quadrantTasks].map((task: Task) => (
                                      <div 
                                        key={task.id} 
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50/50 transition-colors duration-150 dark:hover:bg-gray-800/40"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <Checkbox 
                                              checked={task.status === "completed"} 
                                              className={`h-3.5 w-3.5 border-gray-300 checked:bg-gray-600 checked:border-gray-600 dark:border-gray-700 dark:checked:bg-gray-500 dark:checked:border-gray-500`}
                                              onCheckedChange={() => {
                                                toggleTaskStatus(task.id.toString(), task.status)
                                              }}
                                            />
                                          <div className="flex-1 min-w-0">
                                            <h5 className={`text-xs font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground opacity-60" : "text-foreground"}`}>
                                              {task.title}
                                            </h5>
                                          </div>
                                        </div>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10">
                                              <MoreHorizontal className="h-3.5 w-3.5" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-48">
                                            <div className="grid gap-1 p-2">
                                              <Button variant="ghost" className="w-full justify-start gap-2">
                                                <Edit className="h-4 w-4" />
                                                <span>编辑</span>
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                className="w-full justify-start gap-2"
                                                onClick={() => {
                                                  deleteTask(task.id.toString())
                                                }}
                                              >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                <span className="text-destructive">删除</span>
                                              </Button>
                                              <Button variant="ghost" className="w-full justify-start gap-2">
                                                <Copy className="h-4 w-4" />
                                                <span>复制</span>
                                              </Button>
                                              <Button variant="ghost" className="w-full justify-start gap-2">
                                                <Flag className="h-4 w-4" />
                                                <span>标记</span>
                                              </Button>
                                              <Button variant="ghost" className="w-full justify-start gap-2">
                                                <ClockIcon2 className="h-4 w-4" />
                                                <span>设置提醒</span>
                                              </Button>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-3 text-muted-foreground text-xs">
                                      <p>暂无任务</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))
                      }
                    </div>
                  )}
                  
                  {/* 列表视图 */}
                  {view === 'list' && (
                    <div className="space-y-3">
                      {todayTasks.length > 0 ? (
                        todayTasks.map((task: Task) => (
                          <div 
                            key={task.id} 
                            className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-all duration-200 hover:shadow-md"
                          >
                            <div className="flex items-center space-x-4">
                              <Checkbox 
                              checked={task.status === "completed"} 
                              className="h-5 w-5"
                              onCheckedChange={() => {
                                toggleTaskStatus(task.id.toString(), task.status)
                              }}
                            />
                              <div className="flex-1">
                                <h4 className={`font-semibold ${task.status === "completed" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                                  {task.title}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-sm text-muted-foreground">
                                    {task.description || '无描述'}
                                  </p>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                    {task.important && task.urgent ? '重要且紧急' : 
                                     task.important && !task.urgent ? '重要不紧急' : 
                                     !task.important && task.urgent ? '紧急不重要' : '不紧急不重要'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48">
                                  <div className="grid gap-1 p-2">
                                    <Button variant="ghost" className="w-full justify-start gap-2">
                                      <Edit className="h-4 w-4" />
                                      <span>编辑</span>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      className="w-full justify-start gap-2"
                                      onClick={() => {
                                        deleteTask(task.id.toString())
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                      <span className="text-destructive">删除</span>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-2">
                                      <Copy className="h-4 w-4" />
                                      <span>复制</span>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-2">
                                      <Flag className="h-4 w-4" />
                                      <span>标记</span>
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-2">
                                      <ClockIcon2 className="h-4 w-4" />
                                      <span>设置提醒</span>
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          <p>今日暂无任务</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* 快速操作 */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold mb-6">快速操作</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Link 
                  href="/ai-chat" 
                  className="flex items-center space-x-4 p-5 bg-secondary rounded-lg hover:bg-secondary/80 transition-all duration-200 hover:shadow-sm group"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                    <Bot className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold">AI助手</h4>
                    <p className="text-sm text-muted-foreground mt-1">获取智能任务建议</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </Link>
                <Link 
                  href="/calendar" 
                  className="flex items-center space-x-4 p-5 bg-secondary rounded-lg hover:bg-secondary/80 transition-all duration-200 hover:shadow-sm group"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                    <Calendar className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold">日历视图</h4>
                    <p className="text-sm text-muted-foreground mt-1">查看任务日历</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 新建任务弹窗 */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">新建任务</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              选择一种方式创建您的任务
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <button 
              className="flex flex-col items-center p-6 bg-card border-2 border-primary/10 rounded-xl hover:border-primary hover:shadow-lg transition-all duration-200 w-full"
              onClick={() => {
                setIsNewTaskDialogOpen(false)
                setIsManualTaskDialogOpen(true)
              }}
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-md">
                <PlusIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">手动新建</h3>
              <p className="text-sm text-muted-foreground text-center">
                直接创建任务，设置详细信息
              </p>
            </button>
            <button 
              className="flex flex-col items-center p-6 bg-card border-2 border-primary/10 rounded-xl hover:border-primary hover:shadow-lg transition-all duration-200 w-full"
              onClick={() => {
                setIsNewTaskDialogOpen(false)
                setIsAiGuideDialogOpen(true)
              }}
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-md">
                <BrainIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">AI指导</h3>
              <p className="text-sm text-muted-foreground text-center">
                通过AI对话，智能生成任务计划
              </p>
            </button>
          </div>
          <DialogFooter className="justify-center">
            <Button 
              variant="secondary" 
              onClick={() => setIsNewTaskDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手动新建任务表单弹窗 */}
      <Dialog open={isManualTaskDialogOpen} onOpenChange={setIsManualTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">手动新建任务</DialogTitle>
            <DialogDescription>
              填写任务详情，创建新任务
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
                  <Star className="h-5 w-5 text-primary" />
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
                  <Clock className="h-5 w-5 text-primary" />
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
              onClick={handleCancel}
            >
              取消
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmit}
              disabled={!taskForm.title.trim()}
            >
              创建任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI指导弹窗 */}
      <Dialog open={isAiGuideDialogOpen} onOpenChange={setIsAiGuideDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">AI任务指导</DialogTitle>
            <DialogDescription>
              与AI对话，获取科学的任务规划建议
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[60vh]">
            {!showTaskReview ? (
              // AI聊天界面
              <>
                {/* AI聊天消息区域 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 rounded-lg">
                  {aiMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex items-start ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex items-start gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        {message.sender === 'ai' && (
                          <div className="mt-1 p-2 bg-primary/10 rounded-full shadow-sm">
                            <BrainIcon className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div 
                          className={`p-4 rounded-lg ${message.sender === 'ai' ? 'bg-card text-card-foreground shadow-sm' : 'bg-primary text-primary-foreground shadow-sm'} transition-all duration-200`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-1 opacity-80">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {message.sender === 'user' && (
                          <div className="mt-1 p-2 bg-primary/10 rounded-full shadow-sm">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* AI聊天输入区域 */}
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="告诉AI您想要完成的任务或目标..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSendMessage()}
                    className="flex-1 h-12 text-sm"
                  />
                  <Button 
                    onClick={handleAiSendMessage}
                    disabled={!aiInput.trim()}
                    className="h-12 w-12"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              // 任务审核界面
              <div className="flex flex-col h-full p-4 bg-background/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">AI生成的任务计划</h3>
                
                <div className="flex-1 bg-card rounded-lg p-6 shadow-sm">
                  {generatedTask && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">任务标题</Label>
                        <p className="text-xl font-bold mt-1">{generatedTask.title}</p>
                      </div>
                      
                      {generatedTask.description && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">任务描述</Label>
                          <p className="text-base mt-1 whitespace-pre-wrap">{generatedTask.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">截止时间</Label>
                          <p className="text-base mt-1">
                            {generatedTask.deadline ? new Date(generatedTask.deadline).toLocaleString('zh-CN') : '无截止时间'}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">优先级</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${generatedTask.important ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                              {generatedTask.important ? '重要' : '一般'}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${generatedTask.urgent ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                              {generatedTask.urgent ? '紧急' : '不紧急'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-center gap-4">
                  <Button 
                    variant="secondary" 
                    onClick={handleTaskRejection}
                    className="w-32"
                  >
                    重新生成
                  </Button>
                  <Button 
                    onClick={handleTaskApproval}
                    className="w-32"
                  >
                    确认创建
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4 justify-center">
            <Button 
              variant="secondary" 
              onClick={() => setIsAiGuideDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI主动询问弹窗 */}
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
            <Button variant="secondary" onClick={() => {
              // 稍后再说，记录今天已询问
              localStorage.setItem('lastAiInquiry', new Date().toDateString())
              setIsAiInquiryOpen(false)
            }}>
              稍后再说
            </Button>
            <Button onClick={submitInquiry}>
              确认并生成任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI审查弹窗 */}
      <Dialog open={isAiReviewOpen} onOpenChange={setIsAiReviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>AI任务审查</DialogTitle>
            <DialogDescription>
              基于您最近的任务完成情况，AI为您提供的分析和优化建议
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-y-auto max-h-[60vh]">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">AI正在分析您的任务数据...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3">分析结果</h3>
                    <div className="bg-secondary p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{aiReviewResult?.summary || '暂无分析结果'}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3">优化建议</h3>
                    <div className="space-y-2">
                      {(aiReviewResult?.suggestions || []).length > 0 ? (
                    (aiReviewResult!.suggestions || []).map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="mt-1 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm">{suggestion}</p>
                          </div>
                        </div>
                      ))
                      ) : (
                        <p className="text-sm text-muted-foreground">AI暂未提供具体建议</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAiReviewOpen(false)}>
              关闭
            </Button>
            <Button 
              onClick={handleOptimizeTasks}
              disabled={isOptimizing}
            >
              {isOptimizing ? '正在优化...' : '自动优化任务'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}