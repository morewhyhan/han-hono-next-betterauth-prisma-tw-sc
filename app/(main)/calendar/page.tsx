'use client'

import React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import CalendarView from '@/components/calendar/CalendarView'

export default function CalendarPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* 主要内容 */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          <CalendarView />
          
          {/* 日历使用说明 */}
          <div className="mt-6 bg-primary/10 border border-primary rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              日历使用提示
            </h3>
            <ul className="text-xs text-primary space-y-1">
              <li>• 点击月视图中的日期可切换到日视图</li>
              <li>• 日视图中可查看当天详细任务安排</li>
              <li>• 不同颜色标记表示任务优先级</li>
              <li>• 红色：高优先级任务</li>
              <li>• 黄色：中优先级任务</li>
              <li>• 绿色：低优先级任务</li>
              <li>• AI会根据福格模型和您的个性特点安排任务</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
