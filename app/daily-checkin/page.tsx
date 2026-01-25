'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner, { PageLoader } from '@/app/components/LoadingSpinner'
import { Skeleton } from '@/app/components/Skeleton'

interface CheckinStatus {
  hasCheckedInToday: boolean
  consecutiveDays: number
  nextReward: number
  checkinHistory: string[]
}

export default function DailyCheckinPage() {
  const router = useRouter()
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchCheckinStatus()
  }, [router])

  const fetchCheckinStatus = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const handleCheckin = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setCheckingIn(true)
    try {
      const response = await fetch('/api/daily-checkin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setCheckinStatus({
          ...checkinStatus!,
          hasCheckedInToday: true,
          consecutiveDays: data.consecutiveDays,
        })
        // 刷新用户信息
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        alert(data.error || '签到失败')
      }
    } catch (error) {
      console.error('签到失败:', error)
      alert('签到失败，请稍后重试')
    } finally {
      setCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <LoadingSpinner size="large" color="#ffffff" text="加载中..." />
      </div>
    )
  }

  if (!checkinStatus) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* 返回按钮 */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        marginBottom: '20px',
      }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.transform = 'translateX(-4px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          ← 返回首页
        </Link>
      </div>

      {/* 签到卡片 */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        background: '#ffffff',
        borderRadius: '28px',
        padding: '40px',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15)',
        animation: 'slideInUp 0.5s ease-out',
      }}>
        {/* 标题 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '36px' }}>✨</span>
            <span>每日签到</span>
          </h1>
          <p style={{
            margin: '12px 0 0 0',
            fontSize: '14px',
            color: '#999',
          }}>
            每天签到领取丰厚奖励
          </p>
        </div>

        {/* 连续签到天数 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          padding: '32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          boxShadow: '0 12px 32px rgba(102, 126, 234, 0.3)',
          color: 'white',
        }}>
          <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '12px', fontWeight: '500' }}>
            连续签到
          </div>
          <div style={{ fontSize: '72px', fontWeight: 'bold', lineHeight: '1', margin: '16px 0' }}>
            {checkinStatus.consecutiveDays}
          </div>
          <div style={{ fontSize: '16px', opacity: 0.9, fontWeight: '500' }}>
            天
          </div>
        </div>

        {/* 奖励信息 */}
        <div style={{
          marginBottom: '30px',
          padding: '24px',
          background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
          borderRadius: '24px',
          boxShadow: '0 12px 32px rgba(246, 211, 101, 0.25)',
        }}>
          <div style={{ fontSize: '16px', color: 'rgba(0,0,0,0.7)', marginBottom: '12px', fontWeight: '500' }}>
            今日奖励
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span>🪙</span>
            <span>{checkinStatus.nextReward}</span>
            <span style={{ fontSize: '24px' }}>金币</span>
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.6)', marginTop: '12px', textAlign: 'center' }}>
            连续签到天数越多，奖励越丰厚！
          </div>
        </div>

        {/* 签到历史（最近7天） */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '16px', color: '#333', marginBottom: '20px', fontWeight: '600' }}>
            最近签到记录
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (6 - i))
              const dateStr = date.toISOString().split('T')[0]
              const isChecked = checkinStatus.checkinHistory.includes(dateStr)
              const isToday = dateStr === new Date().toISOString().split('T')[0]

              return (
                <div
                  key={i}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: isChecked
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isToday ? '3px solid #667eea' : isChecked ? 'none' : '2px solid #e0e0e0',
                    fontSize: '13px',
                    color: isChecked ? 'white' : '#999',
                    flexShrink: 0,
                    boxShadow: isChecked ? '0 6px 16px rgba(102, 126, 234, 0.3)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {isChecked ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 签到按钮 */}
        <button
          onClick={handleCheckin}
          disabled={checkinStatus.hasCheckedInToday || checkingIn}
          style={{
            width: '100%',
            padding: '18px',
            background: checkinStatus.hasCheckedInToday
              ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: checkinStatus.hasCheckedInToday ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: checkinStatus.hasCheckedInToday
              ? 'none'
              : '0 12px 32px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            opacity: checkingIn ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!checkinStatus.hasCheckedInToday && !checkingIn) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(102, 126, 234, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            if (!checkinStatus.hasCheckedInToday && !checkingIn) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)'
            }
          }}
        >
          {checkingIn
            ? '签到中...'
            : checkinStatus.hasCheckedInToday
            ? '✅ 今日已签到'
            : '✨ 立即签到'}
        </button>
      </div>
    </div>
  )
}
