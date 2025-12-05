'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/auth/useSession'
import { useSignOut } from '@/hooks/auth/useSignOut'

export default function SettingsPage() {
  const { data: session, isLoading, error } = useSession()
  const signOut = useSignOut()
  
  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <h1 className="text-3xl font-bold">设置管理</h1>
          <div className="mt-6">
            <p>加载中...</p>
          </div>
        </main>
      </div>
    )
  }
  
  if (error || !session?.user) {
    return (
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <h1 className="text-3xl font-bold">设置管理</h1>
          <div className="mt-6">
            <p>获取用户信息失败，请刷新页面重试</p>
          </div>
        </main>
      </div>
    )
  }
  
  const { user } = session
  
  return (
    <div className="flex-1 overflow-auto">
      <main className="p-6">
        <h1 className="text-3xl font-bold">设置管理</h1>
        
        {/* 用户信息展示 */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>用户信息</CardTitle>
              <CardDescription>查看和管理您的个人信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                {/* 用户头像 */}
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-xl">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                {/* 用户信息 */}
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">用户名</div>
                    <div className="text-base font-semibold">{user.name || user.email.split('@')[0]}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">邮箱</div>
                    <div className="text-base font-semibold">{user.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">注册时间</div>
                    <div className="text-base font-semibold">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* 账户管理 */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>账户管理</CardTitle>
              <CardDescription>管理您的账户设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">退出登录</h3>
                  <p className="text-sm text-muted-foreground">退出当前登录会话</p>
                </div>
                <Button variant="destructive" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
                  {signOut.isPending ? '退出中...' : '退出登录'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}