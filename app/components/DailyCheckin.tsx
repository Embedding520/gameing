'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CheckinStatus {
  hasCheckedInToday: boolean
  consecutiveDays: number
  nextReward: number
  checkinHistory: string[]
}

export default function DailyCheckin() {
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null)

  useEffect(() => {
    fetchCheckinStatus()
  }, [])

  const fetchCheckinStatus = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/daily-checkin', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCheckinStatus(data)
      }
    } catch (error) {
      console.error('获取签到状态失败:', error)
    }
  }

  if (!checkinStatus) {
    return null
  }

  return (
    <Link
      href="/daily-checkin"
      style={{
        padding: '10px 20px',
        background: checkinStatus.hasCheckedInToday
          ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: checkinStatus.hasCheckedInToday
          ? 'none'
          : '0 4px 15px rgba(102, 126, 234, 0.4)',
        transition: 'all 0.3s ease',
        textDecoration: 'none',
        display: 'inline-block',
      }}
      onMouseEnter={(e) => {
        if (!checkinStatus.hasCheckedInToday) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
        }
      }}
      onMouseLeave={(e) => {
        if (!checkinStatus.hasCheckedInToday) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
        }
      }}
    >
      {checkinStatus.hasCheckedInToday ? '✅ 已签到' : '📅 每日签到'}
      {checkinStatus.consecutiveDays > 0 && (
        <span style={{
          marginLeft: '8px',
          background: 'rgba(255, 255, 255, 0.3)',
          padding: '2px 8px',
          borderRadius: '10px',
          fontSize: '12px',
        }}>
          {checkinStatus.consecutiveDays}天
        </span>
      )}
    </Link>
  )
}
