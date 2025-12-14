'use client'

import React from 'react'
import AiChat from '@/components/chat/AiChat'

export default function AiChatPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {/* 页面标题 */}
          <h1 className="text-2xl font-bold text-card-foreground mb-6">FoogTask 助手</h1>
          
          {/* AI聊天组件 */}
          <AiChat />
        </div>
      </main>
    </div>
  )
}