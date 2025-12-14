'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FoggDashboardProps {
  motivation: number
  ability: number
  prompt: number
}

const FoggDashboard: React.FC<FoggDashboardProps> = ({ motivation, ability, prompt }) => {
  const data = [
    { name: '动机', value: motivation * 100, color: 'var(--chart-1)' },
    { name: '能力', value: ability * 100, color: 'var(--chart-2)' },
    { name: '提示', value: prompt * 100, color: 'var(--chart-3)' },
  ]

  return (
    <div className="bg-card rounded-lg shadow-sm p-4 border">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground">福格三要素健康度</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" stroke="var(--muted-foreground)" />
          <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" />
          <Tooltip 
            formatter={(value) => [`${value}分`, '评分']}
            contentStyle={{ 
              borderRadius: 'var(--radius)', 
              border: '1px solid var(--border)', 
              boxShadow: 'var(--shadow)',
              backgroundColor: 'var(--background)'
            }}
            labelStyle={{ color: 'var(--foreground)' }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-primary/10 rounded-lg border">
          <div className="text-sm text-primary">动机</div>
          <div className="text-xl font-bold text-primary">{Math.round(motivation * 10) / 10}</div>
        </div>
        <div className="p-2 bg-secondary/10 rounded-lg border">
          <div className="text-sm text-secondary">能力</div>
          <div className="text-xl font-bold text-secondary">{Math.round(ability * 10) / 10}</div>
        </div>
        <div className="p-2 bg-accent/10 rounded-lg border">
          <div className="text-sm text-accent">提示</div>
          <div className="text-xl font-bold text-accent">{Math.round(prompt * 10) / 10}</div>
        </div>
      </div>
    </div>
  )
}

export default FoggDashboard
