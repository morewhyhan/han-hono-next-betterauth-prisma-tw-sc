'use client'

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="border-b px-6 py-4 flex justify-between items-center">
        {/* 选项卡 */}
        <div className="flex space-x-1">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">1</button>
          <button className="px-4 py-2 bg-background text-muted-foreground hover:bg-accent rounded-md text-sm font-medium">2</button>
          <button className="px-4 py-2 bg-background text-muted-foreground hover:bg-accent rounded-md text-sm font-medium">3</button>
        </div>
        
        {/* 用户头像信息 */}
        <div className="flex items-center space-x-4">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            U
          </div>
        </div>
      </div>
      
      {/* 主要内容 */}
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-3xl font-bold">欢迎使用仪表盘</h1>
      </main>
    </div>
  )
}