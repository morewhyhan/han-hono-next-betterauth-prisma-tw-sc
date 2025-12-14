'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, User, Bot } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAiChat } from '@/hooks/useAiChat'

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
      content: '您好！我是您的FoogTask助手。请问您想要完成什么长期目标呢？',
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { generateAiResponse } = useAiChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages([...messages, newMessage])
    setInput('')
    
    // 调用实际的AI生成函数
    setIsTyping(true)
    try {
      // 准备API请求格式的消息
      const apiMessages = [...messages, newMessage].map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }))
      
      // 调用AI API获取真实回复
      const response = await generateAiResponse.mutateAsync(apiMessages)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'ai',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI聊天请求失败:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，AI服务暂时不可用，请稍后重试。',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <Card className="h-[700px] flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="border-b bg-muted/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">FoogTask 助手</h3>
            <p className="text-xs text-muted-foreground">基于福格行为模型</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
            在线
          </span>
        </div>
      </div>
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-background to-muted/50">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`flex items-start ${message.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.sender === 'ai' && (
                  <div className="mt-1 p-2 bg-primary/10 rounded-full shadow-sm">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div 
                  className={`p-4 rounded-2xl ${message.sender === 'ai' ? 'bg-card text-card-foreground shadow-md hover:shadow-lg' : 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'} transition-all duration-200`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2 opacity-80">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.sender === 'user' && (
                  <div className="mt-1 p-2 bg-primary/10 rounded-full shadow-sm">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start justify-start">
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="mt-1 p-2 bg-primary/10 rounded-full shadow-sm">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="p-4 rounded-2xl bg-card text-card-foreground shadow-md">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div className="border-t p-6 bg-card">
          <div className="flex gap-3">
            <Input 
              placeholder="输入您的问题或目标..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 h-12 text-sm shadow-sm hover:shadow-md transition-all duration-200"
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-12 w-12 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button 
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm text-muted-foreground transition-all duration-200 hover:shadow-sm"
              onClick={() => setInput('帮我制定一个学习计划')}
            >
              帮我制定一个学习计划
            </button>
            <button 
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm text-muted-foreground transition-all duration-200 hover:shadow-sm"
              onClick={() => setInput('如何提高我的行动力')}
            >
              如何提高我的行动力
            </button>
            <button 
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm text-muted-foreground transition-all duration-200 hover:shadow-sm"
              onClick={() => setInput('分析我的任务优先级')}
            >
              分析我的任务优先级
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AiChat