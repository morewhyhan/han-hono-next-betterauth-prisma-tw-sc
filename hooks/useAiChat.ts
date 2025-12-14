'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetch } from '@/lib/api-client'

export interface ChatMessage {
  id: string
  content: string
  sender: 'ai' | 'user'
  timestamp: Date
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
}

export interface ChatResponse {
  message: string
}

export const useAiChat = () => {
  const queryClient = useQueryClient()

  // AI聊天消息生成
  const generateAiResponse = useMutation({
    mutationFn: async (messages: Array<{ role: string; content: string }>) => {
      // 添加userId字段，使用默认值
      const result = await fetch.post('api/ai-task', { json: { messages, userId: 'default-user-id' } }).json<ChatResponse>()
      return result
    },
    onError: (error) => {
      console.error('AI聊天请求失败:', error)
    }
  })

  return {
    generateAiResponse
  }
}
