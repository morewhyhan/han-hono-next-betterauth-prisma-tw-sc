import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">欢迎使用</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          这是一个基于 Hono + Next.js + Tailwind + Shadcn 的模板项目
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="home">
              进入仪表盘
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}