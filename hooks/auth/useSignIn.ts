import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export interface SignInCredentials {
  email: string
  password: string
}

export const useSignIn = () => {
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (credentials: SignInCredentials) => {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error?.message || '登录失败，请重试')
      }

      return response.json()
    },
    onSuccess: () => {
      // 登录成功后跳转到主页
      router.push('/home')
    },
  })
}