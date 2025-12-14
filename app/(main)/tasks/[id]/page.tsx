'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, Weight, Bell, Lightbulb } from 'lucide-react'
import { useTasks } from '@/hooks/tasks/useTasks'

// 简化的福格要素展示组件
const IconMap: Record<string, React.ReactNode> = {
  '动机': <Flame className="w-5 h-5 text-primary" />,
  '能力': <Weight className="w-5 h-5 text-primary" />,
  '提示': <Bell className="w-5 h-5 text-primary" />
}

const FoggElement = ({ name, value }: { name: string; value: number }) => {
  const percentage = Math.round(value * 100)
  return (
    <div className="bg-secondary rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div>{IconMap[name]}</div>
          <h4 className="font-medium text-card-foreground">{name}</h4>
        </div>
        <span className="text-sm font-medium text-primary">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

export default function TaskDetail() {
  const params = useParams()
  const taskId = params.id as string

  // 使用useTasks hook
  const { getTask, toggleTaskStatus } = useTasks()

  // 获取单个任务详情
  const { data: task, isLoading, isError } = getTask(taskId)

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isError || !task) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-destructive">加载任务详情失败</p>
              <Link href="/home">
                <Button className="mt-4">返回首页</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 返回按钮和任务标题 */}
          <div className="space-y-2">
            <Link 
              href="/home" 
              className="inline-flex items-center space-x-1 text-sm text-primary hover:underline"
            >
              <span>←</span>
              <span>返回任务列表</span>
            </Link>
            <h1 className="text-2xl font-bold text-card-foreground">{task.title}</h1>
          </div>

          {/* 任务基本信息 */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">任务描述</h3>
                  <p>{task.description || '无描述'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">重要/紧急</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`}>
                      {task.important && task.urgent ? '重要且紧急' :
                       task.important && !task.urgent ? '重要不紧急' :
                       !task.important && task.urgent ? '紧急不重要' : '不紧急不重要'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">状态</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {task.status === "completed" ? "已完成" : "进行中"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">创建时间</h3>
                    <p className="text-sm">{new Date(task.createdAt).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">截止日期</h3>
                    <p className="text-sm">{task.dueDate ? new Date(task.dueDate).toLocaleString('zh-CN') : '无'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 福格行为模型三要素 - 模拟数据，实际项目中应该从API获取 */}
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">福格行为模型三要素</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FoggElement 
                  name="动机" 
                  value={0.8} 
                />
                <FoggElement 
                  name="能力" 
                  value={0.6} 
                />
                <FoggElement 
                  name="提示" 
                  value={0.9} 
                />
              </div>
            </CardContent>
          </Card>

          {/* AI建议 - 模拟数据，实际项目中应该从API获取 */}
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">AI优化建议</h2>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-primary mt-1" />
                  <p>建议将任务分解为更小的步骤，每天完成一个部分</p>
                </li>
                <li className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-primary mt-1" />
                  <p>在精力充沛的时候完成重要任务，比如早上9-11点</p>
                </li>
                <li className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-primary mt-1" />
                  <p>设置明确的提示，比如闹钟或日历提醒</p>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3">
            <Button variant="secondary">
              编辑任务
            </Button>
            <Button
              onClick={() => {
                toggleTaskStatus(task.id.toString(), task.status)
              }}
            >
              {task.status === "completed" ? "标记为未完成" : "标记为已完成"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}