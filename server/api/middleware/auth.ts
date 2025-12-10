import { Context, Next } from 'hono'
import { getPrismaClient } from '@/lib/db'

const prisma = getPrismaClient()

function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return {} as Record<string, string>
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=')
    if (!key) return acc
    acc[key] = decodeURIComponent(rest.join('='))
    return acc
  }, {} as Record<string, string>)
}

/**
 * 基于 better-auth 的 session cookie 校验，验证通过后将 userId 写入 context
 */
export async function requireAuth(c: Context, next: Next) {
  const cookies = parseCookies(c.req.header('cookie'))
  const sessionToken = cookies['better-auth.session_token']

  if (!sessionToken) {
    return c.json({ message: '未登录或会话缺失' }, 401)
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    select: { userId: true, expiresAt: true },
  })

  const isExpired = session?.expiresAt && session.expiresAt < new Date()
  if (!session || isExpired) {
    return c.json({ message: '会话已失效，请重新登录' }, 401)
  }

  c.set('userId', session.userId)
  return next()
}

