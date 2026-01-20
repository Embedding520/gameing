'use client'

import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  totalScore?: number
  coins?: number
  level?: number
  score?: number
  gameId?: string
  playedAt?: string
}

interface LeaderboardProps {
  onClose: () => void
  currentUserId?: string
}

type LeaderboardType = 'totalScore' | 'coins' | 'level'
type TimeRange = 'all' | 'week' | 'month'

export default function Leaderboard({ onClose, currentUserId }: LeaderboardProps) {
  const [type, setType] = useState<LeaderboardType>('totalScore')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [gameId, setGameId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
  }, [type, timeRange, gameId])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type,
        timeRange,
        limit: '100',
      })
      if (gameId) {
        params.append('gameId', gameId)
      }

      const response = await fetch(`/api/leaderboard?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
      } else {
        console.error('获取排行榜失败:', data.error)
      }
    } catch (error) {
      console.error('获取排行榜错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayValue = (entry: LeaderboardEntry) => {
    if (entry.score !== undefined) return entry.score
    if (type === 'coins') return entry.coins || 0
    if (type === 'level') return entry.level || 1
    return entry.totalScore || 0
  }

  const getTypeLabel = () => {
    if (gameId) return '游戏排行榜'
    if (type === 'coins') return '金币排行榜'
    if (type === 'level') return '等级排行榜'
    return '总分排行榜'
  }

  const getTimeRangeLabel = () => {
    if (timeRange === 'week') return '本周'
    if (timeRange === 'month') return '本月'
    return '全部'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '25px 30px',
            borderBottom: '2px solid #e0e0e0',
          }}
        >
          <h2
            style={{
              margin: 0,
              color: '#333',
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🏆 排行榜
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.color = '#333'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#999'
            }}
          >
            ×
          </button>
        </div>

        {/* 筛选器 */}
        <div
          style={{
            padding: '20px 30px',
            borderBottom: '2px solid #e0e0e0',
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
          }}
        >
          {!gameId && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>
                  排行榜类型
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LeaderboardType)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="totalScore">总分</option>
                  <option value="coins">金币</option>
                  <option value="level">等级</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>
              时间范围
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              style={{
                padding: '8px 12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">全部</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
            </select>
          </div>
        </div>

        {/* 排行榜列表 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 30px',
          }}
        >
          <div style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#333' }}>
            {getTypeLabel()} - {getTimeRangeLabel()}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无数据</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leaderboard.map((entry) => {
                const isCurrentUser = currentUserId === entry.userId
                return (
                  <div
                    key={entry.rank}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px 20px',
                      background: isCurrentUser
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      color: isCurrentUser ? 'white' : '#333',
                      borderRadius: '12px',
                      border: isCurrentUser ? '2px solid #667eea' : '2px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentUser) {
                        e.currentTarget.style.transform = 'translateX(5px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentUser) {
                        e.currentTarget.style.transform = 'translateX(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isCurrentUser
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        marginRight: '15px',
                        flexShrink: 0,
                      }}
                    >
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                        {entry.username}
                        {isCurrentUser && <span style={{ marginLeft: '8px', fontSize: '12px' }}>(你)</span>}
                      </div>
                      {entry.gameId && (
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                          游戏: {entry.gameId}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                        {getDisplayValue(entry).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {type === 'coins' ? '金币' : type === 'level' ? '等级' : '分数'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
