'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GAMES } from '@/app/games/games'

interface UserStats {
  totalGames: number
  bestScore: number
  totalPlayTime: number
  gameStats: Array<{
    gameId: string
    playCount: number
    bestScore: number
    totalScore: number
    lastPlayed: string | null
  }>
  recentGames?: Array<{
    gameId: string
    score: number
    playedAt: string
  }>
  ranks: {
    totalScore: number
    coins: number
    level: number
  }
}

interface User {
  id: string
  username: string
  coins: number
  totalScore: number
  level: number
  avatarUrl?: string | null
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUserStats()
  }, [router])

  const fetchUserStats = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch('/api/user/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setStats(data.stats)
      } else {
        console.error('获取用户统计失败')
      }
    } catch (error) {
      console.error('获取用户统计错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  }

  // 获取游戏信息
  const getGameInfo = (gameId: string) => {
    return GAMES.find(g => g.id === gameId) || {
      name: gameId,
      icon: '🎮',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }
  }

  // 计算等级进度
  const getLevelProgress = () => {
    if (!user) return { current: 0, next: 1000, progress: 0, currentLevel: 1, nextLevel: 2 }
    const currentScore = user.totalScore || 0
    // 根据分数计算当前等级（每1000分1级）
    const calculatedLevel = Math.max(1, Math.floor(currentScore / 1000) + 1)
    const currentLevelMin = (calculatedLevel - 1) * 1000
    const nextLevelMin = calculatedLevel * 1000
    const currentProgress = currentScore - currentLevelMin
    const progressNeeded = nextLevelMin - currentLevelMin
    const progress = (currentProgress / progressNeeded) * 100
    
    return {
      current: currentProgress,
      next: progressNeeded,
      progress: Math.min(100, Math.max(0, progress)),
      currentLevel: calculatedLevel,
      nextLevel: calculatedLevel + 1,
    }
  }

  // 获取最喜爱的游戏（游玩次数最多的）
  const getFavoriteGame = () => {
    if (!stats || !stats.gameStats || stats.gameStats.length === 0) return null
    return stats.gameStats.reduce((prev, current) => 
      current.playCount > prev.playCount ? current : prev
    )
  }

  // 所有成就定义
  const allAchievements = [
    { icon: '🌟', name: '高分大师', desc: '总分数达到10000', condition: (u: User, s: UserStats) => (u.totalScore || 0) >= 10000 },
    { icon: '💫', name: '分数之王', desc: '总分数达到50000', condition: (u: User, s: UserStats) => (u.totalScore || 0) >= 50000 },
    { icon: '🔥', name: '分数传奇', desc: '总分数达到100000', condition: (u: User, s: UserStats) => (u.totalScore || 0) >= 100000 },
    { icon: '🎯', name: '游戏达人', desc: '游玩100局游戏', condition: (u: User, s: UserStats) => (s.totalGames || 0) >= 100 },
    { icon: '🏆', name: '游戏大师', desc: '游玩500局游戏', condition: (u: User, s: UserStats) => (s.totalGames || 0) >= 500 },
    { icon: '🎮', name: '游戏传奇', desc: '游玩1000局游戏', condition: (u: User, s: UserStats) => (s.totalGames || 0) >= 1000 },
    { icon: '⭐', name: '等级高手', desc: '达到10级', condition: (u: User, s: UserStats) => (u.level || 1) >= 10 },
    { icon: '👑', name: '等级之王', desc: '达到50级', condition: (u: User, s: UserStats) => (u.level || 1) >= 50 },
    { icon: '💎', name: '等级传说', desc: '达到100级', condition: (u: User, s: UserStats) => (u.level || 1) >= 100 },
    { icon: '💰', name: '金币富翁', desc: '拥有10000金币', condition: (u: User, s: UserStats) => (u.coins || 0) >= 10000 },
    { icon: '💵', name: '金币大亨', desc: '拥有50000金币', condition: (u: User, s: UserStats) => (u.coins || 0) >= 50000 },
    { icon: '⏰', name: '时间玩家', desc: '游戏时长超过1小时', condition: (u: User, s: UserStats) => (s.totalPlayTime || 0) >= 3600 },
    { icon: '🕐', name: '时间大师', desc: '游戏时长超过10小时', condition: (u: User, s: UserStats) => (s.totalPlayTime || 0) >= 36000 },
    { icon: '🎪', name: '全游戏玩家', desc: '游玩过所有游戏', condition: (u: User, s: UserStats) => (s.gameStats?.length || 0) >= 20 },
  ]

  // 计算成就（包括已解锁和未解锁的）
  const getAchievements = () => {
    if (!user || !stats) return allAchievements.map(a => ({ ...a, unlocked: false }))
    return allAchievements.map(achievement => ({
      ...achievement,
      unlocked: achievement.condition(user, stats),
    }))
  }

  const handleAvatarUpload = async () => {
    if (!avatarUrl.trim()) {
      alert('请输入图片URL')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setUploading(true)
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: avatarUrl.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : null)
        setShowAvatarUpload(false)
        setAvatarUrl('')
        alert('头像更新成功！')
      } else {
        alert(data.error || '更新头像失败')
      }
    } catch (error) {
      console.error('更新头像错误:', error)
      alert('更新头像失败，请稍后重试')
    } finally {
      setUploading(false)
    }
  }

  const levelProgress = getLevelProgress()
  const favoriteGame = getFavoriteGame()
  const achievements = getAchievements()

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '24px', color: '#666' }}>加载中...</div>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 返回按钮 */}
        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: '20px',
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            textDecoration: 'none',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          ← 返回大厅
        </Link>

        {/* 用户信息卡片 */}
        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: user?.avatarUrl 
                    ? 'transparent'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '56px',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                  border: '4px solid white',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setShowAvatarUpload(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      // 如果图片加载失败，显示默认头像
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.innerHTML = user?.username.charAt(0).toUpperCase() || 'U'
                      }
                    }}
                  />
                ) : (
                  user?.username.charAt(0).toUpperCase()
                )}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: 'white',
                  cursor: 'pointer',
                  border: '3px solid white',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setShowAvatarUpload(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                title="更换头像"
              >
                📷
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ margin: 0, fontSize: '36px', color: '#333', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user?.username}
                <span style={{ 
                  fontSize: '20px', 
                  padding: '4px 12px', 
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  borderRadius: '12px',
                  color: '#333',
                  fontWeight: 'bold'
                }}>
                  Lv.{user?.level || 1}
                </span>
              </h1>
              <div style={{ color: '#666', fontSize: '16px', marginBottom: '15px' }}>
                注册时间: {user?.createdAt ? formatDate(user.createdAt) : '未知'}
              </div>
              
              {/* 等级进度条 */}
              <div style={{ marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                  <span>等级进度 (Lv.{levelProgress.currentLevel} → Lv.{levelProgress.nextLevel})</span>
                  <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                    {levelProgress.current} / {levelProgress.next} 分
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '12px',
                    background: '#e0e0e0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div
                    style={{
                      width: `${levelProgress.progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '6px',
                      transition: 'width 0.5s ease',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  {levelProgress.progress >= 100 
                    ? '已达到当前等级上限，继续游戏可提升等级！'
                    : `距离下一级还需 ${levelProgress.next - levelProgress.current} 分`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 数据概览 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>总分数</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{user?.totalScore.toLocaleString() || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                排名: #{stats?.ranks.totalScore || '?'}
              </div>
            </div>
            <div
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                borderRadius: '16px',
                color: '#333',
              }}
            >
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>金币</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{user?.coins.toLocaleString() || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                排名: #{stats?.ranks.coins || '?'}
              </div>
            </div>
            <div
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                borderRadius: '16px',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>等级</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{user?.level || 1}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                排名: #{stats?.ranks.level || '?'}
              </div>
            </div>
            <div
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '16px',
                color: 'white',
              }}
            >
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>总游戏数</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.totalGames || 0}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                最佳分数: {stats?.bestScore.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>

        {/* 游戏时长统计 */}
        {stats && stats.totalPlayTime > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '30px',
              marginBottom: '30px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h2 style={{ margin: 0, marginBottom: '20px', fontSize: '24px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⏰ 游戏时长
            </h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              {formatTime(stats.totalPlayTime)}
            </div>
            <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
              累计游戏时长
            </div>
          </div>
        )}

        {/* 最喜爱的游戏 */}
        {favoriteGame && (
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '30px',
              marginBottom: '30px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h2 style={{ margin: 0, marginBottom: '20px', fontSize: '24px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ❤️ 最喜爱的游戏
            </h2>
            {(() => {
              const gameInfo = getGameInfo(favoriteGame.gameId)
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: gameInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {gameInfo.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                      {gameInfo.name}
                    </div>
                    <div style={{ fontSize: '16px', color: '#666' }}>
                      游玩 {favoriteGame.playCount} 次 · 最佳分数 {favoriteGame.bestScore.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* 成就徽章 */}
        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h2 style={{ margin: 0, marginBottom: '20px', fontSize: '24px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏅 成就徽章
          </h2>
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
            已解锁: {achievements.filter(a => a.unlocked).length} / {achievements.length}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {achievements.map((achievement, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  background: achievement.unlocked
                    ? 'linear-gradient(135deg, #fff9e6 0%, #ffe6f2 100%)'
                    : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                  borderRadius: '12px',
                  border: achievement.unlocked ? '2px solid #ffd700' : '2px solid #999',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  opacity: achievement.unlocked ? 1 : 0.6,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (achievement.unlocked) {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 215, 0, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (achievement.unlocked) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {achievement.unlocked && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      fontSize: '20px',
                    }}
                  >
                    ✓
                  </div>
                )}
                <div style={{ fontSize: '48px', marginBottom: '10px', filter: achievement.unlocked ? 'none' : 'grayscale(100%)' }}>
                  {achievement.icon}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: achievement.unlocked ? '#333' : '#666', marginBottom: '5px' }}>
                  {achievement.name}
                </div>
                <div style={{ fontSize: '12px', color: achievement.unlocked ? '#666' : '#999' }}>{achievement.desc}</div>
                {!achievement.unlocked && (
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '8px', fontStyle: 'italic' }}>
                    未解锁
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 最近游戏记录 */}
        {stats && stats.recentGames && stats.recentGames.length > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '30px',
              marginBottom: '30px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h2 style={{ margin: 0, marginBottom: '20px', fontSize: '24px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📜 最近游戏记录
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentGames.slice(0, 10).map((game, index) => {
                const gameInfo = getGameInfo(game.gameId)
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '15px',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)'
                      e.currentTarget.style.borderColor = '#667eea'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.borderColor = '#e0e0e0'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        background: gameInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        flexShrink: 0,
                      }}
                    >
                      {gameInfo.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333', marginBottom: '4px' }}>
                        {gameInfo.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        分数: {game.score.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', textAlign: 'right' }}>
                      {formatDateTime(game.playedAt)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 游戏统计 */}
        {stats && stats.gameStats.length > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h2 style={{ margin: 0, marginBottom: '30px', fontSize: '28px', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📊 详细游戏统计
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {stats.gameStats.map((game) => {
                const gameInfo = getGameInfo(game.gameId)
                return (
                  <div
                    key={game.gameId}
                    style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.borderColor = '#667eea'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = '#e0e0e0'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: gameInfo.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                        }}
                      >
                        {gameInfo.icon}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>
                        {gameInfo.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#666' }}>
                      <div>🎮 游玩次数: <strong>{game.playCount}</strong></div>
                      <div>⭐ 最佳分数: <strong>{game.bestScore.toLocaleString()}</strong></div>
                      <div>📈 总分数: <strong>{game.totalScore.toLocaleString()}</strong></div>
                      {game.lastPlayed && (
                        <div>🕐 最后游玩: {formatDateTime(game.lastPlayed)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 头像上传模态框 */}
        {showAvatarUpload && (
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
              if (e.target === e.currentTarget) setShowAvatarUpload(false)
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: 0, marginBottom: '20px', fontSize: '24px', color: '#333' }}>
                更换头像
              </h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  图片URL
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="请输入图片URL（支持网络图片链接）"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                  提示：你可以使用图片托管服务（如 imgur、imgbb 等）上传图片后获取URL
                </div>
              </div>
              {avatarUrl && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>预览：</div>
                  <img
                    src={avatarUrl}
                    alt="预览"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid #e0e0e0',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleAvatarUpload}
                  disabled={!avatarUrl.trim() || uploading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: avatarUrl.trim() && !uploading
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: avatarUrl.trim() && !uploading ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {uploading ? '上传中...' : '确认更换'}
                </button>
                <button
                  onClick={() => {
                    setShowAvatarUpload(false)
                    setAvatarUrl('')
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'rgba(0, 0, 0, 0.05)',
                    color: '#666',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
