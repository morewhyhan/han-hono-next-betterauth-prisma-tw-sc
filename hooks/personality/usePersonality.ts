import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetch } from '../../lib/api-client'

// 类型定义
export interface Personality {
  id: number
  mbti: string
  learningStyle: string
  energyLevel: number
  workRhythm: string
  preferredTime: string
  createdAt: string
  updatedAt: string
  userId: string
}

// Personality update request type
export interface PersonalityUpdateRequest {
  mbti: string
  learningStyle: string
  energyLevel: number
  workRhythm: string
  preferredTime: string
}

// Hooks implementation
export const usePersonality = () => {
  const queryClient = useQueryClient()

  // Get personality settings
  const { data: personality, isLoading, isError } = useQuery({
    queryKey: ['personality'],
    queryFn: async () => await fetch.get('api/personality').json<Personality | null>()
  })

  // Update personality settings
  const updatePersonality = async (data: PersonalityUpdateRequest) => {
    const result = await fetch.put('api/personality', { json: data }).json<Personality>()
    queryClient.invalidateQueries({ queryKey: ['personality'] })
    return result
  }

  return {
    personality,
    isLoading,
    isError,
    updatePersonality
  }
}