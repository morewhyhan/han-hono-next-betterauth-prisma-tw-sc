import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export interface SignUpCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export const useSignUp = () => {
  const router = useRouter()
  
  return useMutation({
    mutationFn: async (credentials: SignUpCredentials) => {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error?.message || '注册失败，请重试')
      }

      return response.json()
    },
    onSuccess: () => {
      // 注册成功后跳转到主页
      router.push('/home')
    },
  })
}