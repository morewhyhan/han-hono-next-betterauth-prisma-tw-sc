import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`[Middleware] Processing request: ${pathname}`)
  
  // 认证相关路由直接放行
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // 检查是否存在会话cookie
  const cookies = request.cookies
  const sessionCookie = cookies.get('better-auth.session_token')
  const hasSessionCookie = !!sessionCookie
  
  console.log(`[Middleware] Session cookie present: ${hasSessionCookie}`)
  
  const isApiRequest = pathname.startsWith('/api/')
  // 未登录用户访问受保护路由
  if (!hasSessionCookie) {
    console.log(`[Middleware] No session cookie, blocking`)
    return isApiRequest
      ? NextResponse.json({ message: '未登录或会话缺失' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
  }
  
  // 验证会话有效性
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
        Host: request.nextUrl.host,
      },
      credentials: 'include',
    })
    
    const sessionData = await response.json()
    
    console.log(`[Middleware] Session validation response: ${response.status}, data: ${JSON.stringify(sessionData)}`)
    
    // 会话无效
    if (!sessionData?.session) {
      console.log(`[Middleware] Invalid session, blocking`)
      return isApiRequest
        ? NextResponse.json({ message: '会话已失效，请重新登录' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (error) {
    console.error(`[Middleware] Session validation error: ${error}`)
    // 验证失败
    return isApiRequest
      ? NextResponse.json({ message: '会话验证失败' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
  }
  
  console.log(`[Middleware] Valid session, allowing access`)
  return NextResponse.next()
}

// 配置中间件应用的路径
export const config = {
  matcher: ['/home/:path*', '/settings/:path*', '/api/:path*'],
}