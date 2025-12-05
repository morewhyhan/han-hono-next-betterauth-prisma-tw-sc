'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignIn } from '@/hooks/auth/useSignIn'

export default function LoginPage() {
  const { mutate: signIn, isPending } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    signIn({ email, password })
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg border p-8 shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">登录</h1>
        <p className="mt-2 text-muted-foreground">
          登录到您的账户
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">密码</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              忘记密码？
            </Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? '登录中...' : '登录'}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          还没有账户？
          <Link href="/register" className="ml-1 text-primary hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  )
}