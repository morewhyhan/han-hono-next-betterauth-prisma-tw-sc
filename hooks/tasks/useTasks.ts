import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetch } from '../../lib/api-client'

// 类型定义
export interface Task {
  id: number
  title: string
  description?: string | null
  dueDate?: string | null
  important: boolean
  urgent: boolean
  status: 'pending' | 'pending_approval' | 'completed'
  createdAt: string
  updatedAt: string
  userId: string
  period?: string
  parentId?: number
  isArchived?: boolean
  archivedBy?: string
  archivedAt?: string
  archiveReason?: string
  difficulty?: number
  motivation?: number
  completionRate?: number
  feedback?: string
  // 任务提醒相关字段
  remindAt?: string
  remindType?: string
  isReminded?: boolean
}

// Task create request type
export interface TaskCreateRequest {
  title: string
  description?: string
  dueDate?: string
  important: boolean
  urgent: boolean
  remindAt?: string
  remindType?: string
  parentId?: number | null
  period?: string
  status?: 'pending' | 'pending_approval' | 'completed'
}

// Task update request type
export interface TaskUpdateRequest {
  title?: string
  description?: string
  status?: 'pending' | 'pending_approval' | 'completed'
  dueDate?: string | null
  important?: boolean
  urgent?: boolean
  period?: string
  parentId?: number | null
  isArchived?: boolean
  archivedBy?: string
  archivedAt?: string
  archiveReason?: string
  difficulty?: number
  motivation?: number
  completionRate?: number
  feedback?: string
  // 任务提醒相关字段
  remindAt?: string
  remindType?: string
  isReminded?: boolean
}

// Hooks implementation
export const useTasks = () => {
  const queryClient = useQueryClient()

  // Get all tasks
  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const tasks = await fetch.get('api/tasks').json<Task[]>()
      
      // 确保任务数据中的日期格式一致
      return tasks.map(task => ({
        ...task,
        // 确保dueDate是字符串格式
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null
      }))
    }
  })

  // Get single task by id
  const getTask = (id: string) => useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => await fetch.get(`api/tasks/${id}`).json<Task>()
  })

  // Create a new task
  const createTask = async (taskData: TaskCreateRequest & { status?: 'pending' | 'pending_approval' | 'completed' }) => {
    // 如果没有指定状态，默认为pending_approval
    const result = await fetch.post('api/tasks', { 
      json: { 
        ...taskData, 
        status: taskData.status || 'pending_approval' 
      } 
    }).json<Task>()
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    return result
  }
  
  // Archive a task
  const archiveTask = async (id: string, reason: string, userId: string) => {
    const result = await fetch.put(`api/tasks/${id}`, { 
      json: { 
        isArchived: true, 
        archivedBy: userId, 
        archivedAt: new Date().toISOString(), 
        archiveReason: reason 
      } 
    }).json<Task>()
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    return result
  }

  // Toggle task status
  const toggleTaskStatus = async (id: string, currentStatus: 'pending' | 'pending_approval' | 'completed') => {
    let newStatus: 'pending' | 'completed' = currentStatus === 'pending' ? 'completed' : 'pending'
    // 如果当前是待审核状态，默认切换到待处理状态
    if (currentStatus === 'pending_approval') {
      newStatus = 'pending'
    }
    const result = await fetch.put(`api/tasks/${id}`, { 
      json: { status: newStatus } 
    }).json<Task>()
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    return result
  }

  // Delete a task
  const deleteTask = async (id: string) => {
    await fetch.delete(`api/tasks/${id}`)
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  // Update a task
  const updateTask = async (id: string, data: TaskUpdateRequest) => {
    const result = await fetch.put(`api/tasks/${id}`, { json: data }).json<Task>()
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    return result
  }

  return {
    tasks,
    isLoading,
    isError,
    getTask,
    createTask,
    toggleTaskStatus,
    deleteTask,
    updateTask,
    archiveTask
  }
}