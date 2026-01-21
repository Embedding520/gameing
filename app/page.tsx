'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GAMES, GAME_ZONES, GameZone } from '@/app/games/games'
import BackgroundStyle1 from '@/app/components/BackgroundStyle1'
import BackgroundStyle2 from '@/app/components/BackgroundStyle2'
import BackgroundStyle3 from '@/app/components/BackgroundStyle3'
import BackgroundSelector from '@/app/components/BackgroundSelector'
import Forum from '@/app/components/Forum'
import AIChat from '@/app/components/AIChat'
import VideoGenerator from '@/app/components/VideoGenerator'
import Leaderboard from '@/app/components/Leaderboard'

interface User {
  id: string
  username: string
  coins: number
  totalScore: number
  level: number
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [backgroundStyle, setBackgroundStyle] = useState<'style1' | 'style2' | 'style3'>('style1')
  const [showRecharge, setShowRecharge] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState(100)
  const [showForum, setShowForum] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showVideoGenerator, setShowVideoGenerator] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [selectedZone, setSelectedZone] = useState<GameZone | '全部'>('全部')

  useEffect(() => {
    // 从localStorage加载保存的背景风格
    const savedStyle = localStorage.getItem('backgroundStyle') as 'style1' | 'style2' | 'style3'
    if (savedStyle && ['style1', 'style2', 'style3'].includes(savedStyle)) {
      setBackgroundStyle(savedStyle)
      document.body.setAttribute('data-bg-style', savedStyle)
    } else {
      document.body.setAttribute('data-bg-style', 'style1')
    }
  }, [])

  const fetchUserInfo = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // 确保获取最新数据
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        // 更新 localStorage 中的用户信息
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userStr))
    // 立即获取最新用户信息（包括从支付页面返回后）
    fetchUserInfo()
    
    // 定期刷新用户信息（每30秒）
    const interval = setInterval(() => {
      fetchUserInfo()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [router, fetchUserInfo])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleRecharge = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // 使用 CREEM 支付创建支付链接
      const response = await fetch('/api/payment/creem/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount: rechargeAmount, // 支付金额（美元）
          coins: rechargeAmount, // 获得的金币数量
        }),
      })

      const data = await response.json()

      if (response.ok && data.checkoutUrl) {
        setShowRecharge(false)
        // 跳转到 CREEM 支付页面
        window.location.href = data.checkoutUrl
      } else {
        const errorMsg = data.message || data.error || '创建支付链接失败'
        alert(errorMsg)
        console.error('支付链接创建失败:', data)
      }
    } catch (error) {
      console.error('创建支付链接失败:', error)
      alert('创建支付链接失败，请稍后重试')
    }
  }

  if (!user) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px', 
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '30px 50px',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          加载中...
        </div>
      </div>
    )
  }

  return (
    <main style={{ 
      minHeight: '100vh', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* 背景选择器 */}
      <BackgroundSelector onStyleChange={setBackgroundStyle} />
      
      {/* 动态背景 - 根据选择的风格显示 */}
      {backgroundStyle === 'style1' && <BackgroundStyle1 />}
      {backgroundStyle === 'style2' && <BackgroundStyle2 />}
      {backgroundStyle === 'style3' && <BackgroundStyle3 />}

      {/* 顶部信息栏 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '20px 35px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        animation: 'slideIn 0.5s ease-out'
      }}>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.username}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            borderRadius: '12px',
            color: '#333',
            boxShadow: '0 4px 15px rgba(246, 211, 101, 0.4)'
          }}>
            <span style={{ fontSize: '20px' }}>🪙</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{user.coins}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 15px rgba(17, 153, 142, 0.4)'
          }}>
            <span style={{ fontSize: '18px' }}>⭐</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.totalScore}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowForum(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            💬 论坛
          </button>
          <button
            onClick={() => setShowAIChat(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(17, 153, 142, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(17, 153, 142, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(17, 153, 142, 0.4)'
            }}
          >
            🤖 AI助手
          </button>
          <button
            onClick={() => setShowVideoGenerator(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 147, 251, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(240, 147, 251, 0.4)'
            }}
          >
            🎬 视频生成
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#333',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)'
            }}
          >
            🏆 排行榜
          </button>
          <Link
            href="/profile"
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)'
            }}
          >
            👤 个人中心
          </Link>
          <button
            onClick={() => setShowRecharge(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              color: '#333',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(246, 211, 101, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(246, 211, 101, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(246, 211, 101, 0.4)'
            }}
          >
            💰 充值
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: '#333',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(250, 112, 154, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 112, 154, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(250, 112, 154, 0.4)'
            }}
          >
            🚪 退出
          </button>
        </div>
      </div>

      {/* 游戏标题 */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '10px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          textShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
          animation: 'slideIn 0.6s ease-out'
        }}>
          🎮 娱乐中心
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.9)',
          marginTop: '10px',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
          选择你喜欢的游戏开始游玩吧！
        </p>
      </div>

      {/* 游戏区域选择 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        flexWrap: 'wrap',
        marginBottom: '30px',
        padding: '0 20px'
      }}>
        <button
          onClick={() => setSelectedZone('全部')}
          style={{
            padding: '12px 24px',
            background: selectedZone === '全部'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255, 255, 255, 0.2)',
            color: selectedZone === '全部' ? 'white' : 'rgba(255, 255, 255, 0.9)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: selectedZone === '全部'
              ? '0 4px 15px rgba(102, 126, 234, 0.4)'
              : 'none',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            if (selectedZone !== '全部') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedZone !== '全部') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          🎮 全部游戏
        </button>
        {GAME_ZONES.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            style={{
              padding: '12px 24px',
              background: selectedZone === zone.id
                ? zone.color
                : 'rgba(255, 255, 255, 0.2)',
              color: selectedZone === zone.id ? 'white' : 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: selectedZone === zone.id
                ? '0 4px 15px rgba(0, 0, 0, 0.2)'
                : 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              if (selectedZone !== zone.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedZone !== zone.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            {zone.icon} {zone.name}
          </button>
        ))}
      </div>

      {/* 游戏列表 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        width: '100%',
        maxWidth: '1200px',
        padding: '20px'
      }}>
        {GAME_ZONES.map((zone) => {
          const zoneGames = GAMES.filter(game => game.zone === zone.id)
          if (selectedZone !== '全部' && selectedZone !== zone.id) return null
          if (zoneGames.length === 0) return null

          return (
            <div key={zone.id} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '30px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}>
              {/* 区域标题 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '25px',
                paddingBottom: '20px',
                borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
              }}>
                <div style={{
                  fontSize: '40px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}>
                  {zone.icon}
                </div>
                <h2 style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: zone.color,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                }}>
                  {zone.name}
                </h2>
                <span style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                }}>
                  {zoneGames.length} 款游戏
                </span>
              </div>

              {/* 该区域的游戏 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px',
              }}>
                {zoneGames.map((game) => (
                  <Link
                    key={game.id}
                    href={game.route}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '25px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)'
                    }}
                    >
                      {/* 背景渐变 */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100px',
                        background: game.color,
                        opacity: 0.1,
                        borderRadius: '20px 20px 0 0'
                      }} />
                      
                      {/* 游戏图标 */}
                      <div style={{
                        fontSize: '60px',
                        textAlign: 'center',
                        marginBottom: '15px',
                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {game.icon}
                      </div>

                      {/* 游戏名称 */}
                      <h3 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        margin: '0 0 8px 0',
                        color: '#333',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {game.name}
                      </h3>

                      {/* 游戏描述 */}
                      <p style={{
                        fontSize: '13px',
                        color: '#666',
                        margin: '0 0 15px 0',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        minHeight: '40px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {game.description}
                      </p>

                      {/* 游戏信息标签 */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '15px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <span style={{
                          fontSize: '12px',
                          padding: '4px 10px',
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          borderRadius: '8px',
                          fontWeight: 'bold'
                        }}>
                          {game.difficulty}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          padding: '4px 10px',
                          background: 'rgba(246, 211, 101, 0.1)',
                          color: '#f6d365',
                          borderRadius: '8px',
                          fontWeight: 'bold'
                        }}>
                          {game.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 充值弹窗 */}
      {showRecharge && (
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
            animation: 'slideIn 0.3s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRecharge(false)
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            padding: '40px',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            animation: 'slideIn 0.4s ease-out'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{ 
                margin: 0,
                color: '#333',
                fontSize: '28px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                💰 充值金币
              </h2>
              <button
                onClick={() => setShowRecharge(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease'
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
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                color: '#555',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                充值金额
              </label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '18px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
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
            </div>
            <div style={{ 
              marginBottom: '30px', 
              padding: '20px',
              background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(246, 211, 101, 0.3)'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>将获得</div>
              <div style={{ 
                fontSize: '32px', 
                color: '#333', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>🪙</span>
                <span>{rechargeAmount}</span>
                <span style={{ fontSize: '18px' }}>金币</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleRecharge}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                  color: '#333',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(246, 211, 101, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(246, 211, 101, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(246, 211, 101, 0.4)'
                }}
              >
                确认充值
              </button>
              <button
                onClick={() => setShowRecharge(false)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: '#666',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.borderColor = '#ccc'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 论坛弹窗 */}
      {showForum && user && (
        <Forum
          currentUserId={user.id}
          currentUsername={user.username}
          onClose={() => setShowForum(false)}
        />
      )}
      {showAIChat && (
        <AIChat onClose={() => setShowAIChat(false)} />
      )}
      {showVideoGenerator && (
        <VideoGenerator onClose={() => setShowVideoGenerator(false)} />
      )}
      {showLeaderboard && user && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} currentUserId={user.id} />
      )}
    </main>
  )
}
