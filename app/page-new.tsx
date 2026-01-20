'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GAMES } from '@/app/games/games'
import BackgroundStyle1 from '@/app/components/BackgroundStyle1'
import BackgroundStyle2 from '@/app/components/BackgroundStyle2'
import BackgroundStyle3 from '@/app/components/BackgroundStyle3'
import BackgroundSelector from '@/app/components/BackgroundSelector'

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

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userStr))
    fetchUserInfo()
  }, [router])

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
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
          🎮 游戏大厅
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

      {/* 游戏列表 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '25px',
        width: '100%',
        maxWidth: '1200px',
        padding: '20px'
      }}>
        {GAMES.map((game) => (
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
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)'
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
                height: '120px',
                background: game.color,
                opacity: 0.1,
                borderRadius: '24px 24px 0 0'
              }} />
              
              {/* 游戏图标 */}
              <div style={{
                fontSize: '80px',
                textAlign: 'center',
                marginBottom: '20px',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                position: 'relative',
                zIndex: 1
              }}>
                {game.icon}
              </div>

              {/* 游戏名称 */}
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                margin: '0 0 10px 0',
                color: '#333',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                {game.name}
              </h2>

              {/* 游戏描述 */}
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: '0 0 20px 0',
                textAlign: 'center',
                lineHeight: '1.6',
                minHeight: '44px',
                position: 'relative',
                zIndex: 1
              }}>
                {game.description}
              </p>

              {/* 游戏信息标签 */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '20px',
                position: 'relative',
                zIndex: 1
              }}>
                <span style={{
                  padding: '6px 12px',
                  background: game.color,
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  {game.category}
                </span>
                <span style={{
                  padding: '6px 12px',
                  background: game.difficulty === '简单' 
                    ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
                    : game.difficulty === '中等'
                    ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                    : 'linear-gradient(135deg, #F44336 0%, #C62828 100%)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  {game.difficulty}
                </span>
              </div>

              {/* 开始游戏按钮 */}
              <div style={{
                marginTop: '25px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  padding: '12px 30px',
                  background: game.color,
                  color: 'white',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  开始游戏 →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
