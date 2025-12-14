'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from '@/hooks/auth/useSession'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { User, Palette, Bell, Lock, Sun, Moon, ChevronRight, Lightbulb, CalendarDays, Key, Shield, Activity, LayoutGrid, List, Globe, ChevronDown } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

const SettingsPage = () => {
  const { data: session, isLoading } = useSession()
  const signOut = useSignOut()
  
  // 暗色模式状态管理
  const [isDark, setIsDark] = useState(false)
  
  // 初始化暗色模式状态
  useEffect(() => {
    // 检查系统偏好和本地存储
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    
    setIsDark(initialTheme === 'dark')
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])
  
  // 切换暗色模式
  const toggleDarkMode = () => {
    const newTheme = !isDark ? 'dark' : 'light'
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark', !isDark)
    localStorage.setItem('theme', newTheme)
  }
  
  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-background">
        <main className="p-6">
          <h1 className="text-2xl font-bold text-card-foreground">设置</h1>
          <div className="mt-6">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <main className="p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-card-foreground">设置</h1>
            <p className="text-muted-foreground mt-2">管理您的账户和应用偏好</p>
          </div>

          {/* 设置卡片列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 账户信息 */}
            <div className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border hover:border-primary/50">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">账户信息</h2>
                    <p className="text-sm text-muted-foreground">查看和管理您的个人信息</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </div>
                {session?.user && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                      <span className="text-sm text-muted-foreground">用户名</span>
                      <span className="text-sm font-medium">{session.user.name || session.user.email?.split('@')[0]}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                      <span className="text-sm text-muted-foreground">邮箱</span>
                      <span className="text-sm font-medium">{session.user.email}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                      <span className="text-sm text-muted-foreground">账户类型</span>
                      <span className="text-sm font-medium">标准账户</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 个性设置 */}
            <a 
              href="/settings/personality" 
              className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border hover:border-primary/50 block group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">个性设置</h2>
                    <p className="text-sm text-muted-foreground">设置您的MBTI类型和工作习惯</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">AI将基于您的个性特点提供个性化任务建议</p>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform duration-200">
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
            </a>

            {/* 通知设置 */}
            <div className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border hover:border-primary/50">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">通知设置</h2>
                    <p className="text-sm text-muted-foreground">管理任务提醒和通知偏好</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">任务提醒</span>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded-lg border-gray-300 text-primary focus:ring-primary shadow-sm cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lightbulb className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">AI建议通知</span>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded-lg border-gray-300 text-primary focus:ring-primary shadow-sm cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">每日总结</span>
                    </div>
                    <input type="checkbox" className="h-5 w-5 rounded-lg border-gray-300 text-primary focus:ring-primary shadow-sm cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 安全设置 */}
            <div className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border hover:border-primary/50">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">安全设置</h2>
                    <p className="text-sm text-muted-foreground">管理账户安全和隐私</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <button className="w-full flex justify-between items-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Key className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">更改密码</h3>
                        <p className="text-xs text-muted-foreground">更新您的账户密码</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </button>
                  <button className="w-full flex justify-between items-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">隐私设置</h3>
                        <p className="text-xs text-muted-foreground">管理数据隐私偏好</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </button>
                  <button className="w-full flex justify-between items-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">登录历史</h3>
                        <p className="text-xs text-muted-foreground">查看账户登录记录</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-primary" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* 外观设置 */}
            <div className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border hover:border-primary/50">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">外观设置</h2>
                    <p className="text-sm text-muted-foreground">自定义应用外观</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                        {isDark ? (
                          <Moon className="h-5 w-5 text-primary" />
                        ) : (
                          <Sun className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">暗色模式</h3>
                        <p className="text-xs text-muted-foreground">切换应用主题</p>
                      </div>
                    </div>
                    <Switch 
                      checked={isDark} 
                      onCheckedChange={toggleDarkMode}
                      className="h-6 w-12"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                        <LayoutGrid className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">布局风格</h3>
                        <p className="text-xs text-muted-foreground">选择应用布局</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button className="h-8 w-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 语言设置 */}
            <div className="bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border hover:border-primary/50">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">语言设置</h2>
                    <p className="text-sm text-muted-foreground">选择应用语言</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">简体中文</span>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 退出登录 */}
          <div className="mt-8 bg-card rounded-xl shadow-md border p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">账户管理</h2>
                <p className="text-sm text-muted-foreground mt-1">管理您的账户状态</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-lg">
                <div>
                  <h3 className="font-semibold text-destructive">退出登录</h3>
                  <p className="text-sm text-destructive/80">退出当前登录会话</p>
                </div>
                <button 
                  className="px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => signOut.mutate()}
                  disabled={signOut.isPending}
                >
                  {signOut.isPending ? '退出中...' : '退出登录'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage