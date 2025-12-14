import { AppType } from '@/server/api'
import { hc } from 'hono/client'
import ky from 'ky'

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL!

export const fetch = ky.extend({
  prefixUrl: baseUrl,
  timeout: 60000, // 设置60秒超时
  retry: 1, // 添加1次重试
})

export const client = hc<AppType>(baseUrl, {
  fetch: fetch,
})