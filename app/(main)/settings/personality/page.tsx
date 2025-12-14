'use client'

import React, { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { usePersonality } from '@/hooks/personality/usePersonality'

const mbtiTypes = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
]

const learningStyles = [
  { value: 'visual', label: '视觉型 (通过看学习)' },
  { value: 'auditory', label: '听觉型 (通过听学习)' },
  { value: 'kinesthetic', label: '动觉型 (通过做学习)' },
  { value: 'reading', label: '阅读型 (通过阅读学习)' }
]

const workRhythms = [
  { value: 'continuous', label: '持续型 (长时间专注工作)' },
  { value: 'burst', label: '爆发型 (短时间高强度工作)' },
  { value: 'intermittent', label: '间歇型 (工作和休息交替)' }
]

const preferredTimes = [
  { value: 'morning', label: '早上 (6:00-12:00)' },
  { value: 'afternoon', label: '下午 (12:00-18:00)' },
  { value: 'evening', label: '晚上 (18:00-24:00)' },
  { value: 'night', label: '凌晨 (0:00-6:00)' }
]

export default function PersonalitySettings() {
  // 获取个性设置
  const { personality, isLoading, isError, updatePersonality } = usePersonality()
  
  // 初始化表单数据
  const [formData, setFormData] = useState({
    mbti: 'INFP',
    learningStyle: 'visual',
    energyLevel: 5,
    workRhythm: 'burst',
    preferredTime: ['morning', 'evening']
  })
  
  // 当个性设置数据加载完成后，更新表单数据
  useEffect(() => {
    if (personality) {
      setFormData({
        mbti: personality.mbti,
        learningStyle: personality.learningStyle,
        energyLevel: personality.energyLevel,
        workRhythm: personality.workRhythm,
        preferredTime: personality.preferredTime.split(',')
      })
    }
  }, [personality])
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      setFormData(prev => {
        const currentTimes = prev.preferredTime || []
        if (checked) {
          return {
            ...prev,
            preferredTime: [...currentTimes, value]
          }
        } else {
          return {
            ...prev,
            preferredTime: currentTimes.filter(time => time !== value)
          }
        }
      })
    } else if (type === 'range') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      await updatePersonality({
        mbti: formData.mbti,
        learningStyle: formData.learningStyle,
        energyLevel: formData.energyLevel,
        workRhythm: formData.workRhythm,
        preferredTime: formData.preferredTime.join(',')
      })
      
      setIsSaving(false)
      setSaveSuccess(true)
      
      // 3秒后隐藏成功提示
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <p className="text-muted-foreground">加载个性设置中...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <p className="text-muted-foreground">加载个性设置失败，请稍后重试</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* 主要内容 */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 成功提示 */}
          {saveSuccess && (
            <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              个性设置已成功保存！
            </div>
          )}
          
          {/* 表单说明 */}
          <div className="bg-card rounded-lg shadow-sm p-4 border">
            <h2 className="text-lg font-semibold text-card-foreground">关于个性设置</h2>
            <p className="text-muted-foreground mt-1">
              请设置您的个性特点，AI将基于这些信息为您提供个性化的任务规划建议。
            </p>
          </div>
          
          {/* 表单 */}
          <div className="bg-card rounded-lg shadow-sm p-6 border space-y-6">
            {/* MBTI类型 */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                MBTI类型
              </label>
              <select 
                name="mbti" 
                value={formData.mbti}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
              >
                {mbtiTypes.map(type => (
                  <option key={type} value={type} className="bg-background text-foreground">
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 学习风格 */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                学习风格
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {learningStyles.map(style => (
                  <label key={style.value} className="flex items-center gap-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent/5 transition-colors bg-background">
                    <input 
                      type="radio" 
                      name="learningStyle" 
                      value={style.value}
                      checked={formData.learningStyle === style.value}
                      onChange={handleChange}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">{style.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* 能量水平 */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                能量水平: {formData.energyLevel}/10
              </label>
              <input 
                type="range" 
                name="energyLevel" 
                min="1" 
                max="10" 
                value={formData.energyLevel}
                onChange={handleChange}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>低能量</span>
                <span>中等能量</span>
                <span>高能量</span>
              </div>
            </div>
            
            {/* 工作节奏 */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                工作节奏
              </label>
              <div className="grid grid-cols-1 gap-3">
                {workRhythms.map(rhythm => (
                  <label key={rhythm.value} className="flex items-center gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent/5 transition-colors bg-background">
                    <input 
                      type="radio" 
                      name="workRhythm" 
                      value={rhythm.value}
                      checked={formData.workRhythm === rhythm.value}
                      onChange={handleChange}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">{rhythm.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* 偏好时间 */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                高效时间段
              </label>
              <div className="grid grid-cols-1 gap-3">
                {preferredTimes.map(time => (
                  <label key={time.value} className="flex items-center gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent/5 transition-colors bg-background">
                    <input 
                      type="checkbox" 
                      name="preferredTime" 
                      value={time.value}
                      checked={formData.preferredTime.includes(time.value)}
                      onChange={handleChange}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">{time.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* 保存按钮 */}
            <div className="flex justify-end">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : (
                  <>
                    <Save className="w-4 h-4" />
                    保存设置
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
