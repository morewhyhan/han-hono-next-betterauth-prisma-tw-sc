import { useQuery } from '@tanstack/react-query'

export const useSession = () => {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/get-session', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('获取会话信息失败')
      }

      const data = await response.json()
      
      // 如果响应体为null，说明会话无效，抛出错误
      if (!data) {
        throw new Error('会话已过期，请重新登录')
      }

      return data
    },
    staleTime: 5 * 60 * 1000, // 5分钟后数据过期
  })
}