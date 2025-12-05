import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export const useSignOut = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error?.message || '退出登录失败，请重试')
      }

      return response.json()
    },
    onSuccess: () => {
      // 清除查询缓存
      queryClient.invalidateQueries({ queryKey: ['session'] })
      // 注销成功后跳转到登录页面
      router.push('/login')
    },
  })
}