'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignUp } from '@/hooks/auth/useSignUp'

export default function RegisterPage() {
  const { mutate: signUp, isPending } = useSignUp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 客户端验证：检查密码是否匹配
    if (password !== confirmPassword) {
      setError('密码不匹配，请重试')
      return
    }
    
    // 重置错误信息
    setError(null)
    
    // 调用注册函数
    signUp({ name, email, password, confirmPassword })
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg border p-8 shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">注册</h1>
        <p className="mt-2 text-muted-foreground">
          创建一个新账户
        </p>
      </div>
      
      {error && (
        <div className="text-center text-sm text-destructive">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">用户名</Label>
          <Input 
            id="name" 
            placeholder="John Doe" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="your@email.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认密码</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            placeholder="••••••••" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? '注册中...' : '注册'}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          已经有账户？
          <Link href="/login" className="ml-1 text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  )
}