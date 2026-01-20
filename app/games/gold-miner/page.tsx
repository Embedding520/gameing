'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameEngine from '@/game/GameEngine'
import { POWER_UP_SHOP, PowerUpType } from '@/game/powerups'
import { GameStatus } from '@/game/types'
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
  powerUps?: Record<string, number>
}

export default function Home() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [wasPausedBeforeShop, setWasPausedBeforeShop] = useState(false)
  const [userPowerUps, setUserPowerUps] = useState<Record<string, number>>({})
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
        // 加载用户道具
        if (data.user.powerUps) {
          setUserPowerUps(data.user.powerUps)
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  useEffect(() => {
    if (!canvasRef.current || !user) return

    const canvas = canvasRef.current
    const engine = new GameEngine(canvas, user.coins)
    
    // 加载用户道具到游戏引擎
    if (user.powerUps) {
      Object.entries(user.powerUps).forEach(([type, count]) => {
        engine.addPowerUp(type as any, count as number)
      })
      setUserPowerUps(user.powerUps)
    }
    
    engine.start()
    setGameEngine(engine)

    // 键盘事件
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        engine.dropHook()
      }
    }

    // 鼠标/触摸事件
    const handleClick = () => {
      engine.dropHook()
    }

    window.addEventListener('keydown', handleKeyPress)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('touchstart', handleClick)

    // 定期保存游戏数据
    const saveInterval = setInterval(() => {
      if (engine) {
        const state = engine.getState()
        saveGameData(state.score, state.coins, state.level)
      }
    }, 10000) // 每10秒保存一次

    // 监听关卡完成，立即保存并更新用户数据
    const checkLevelComplete = setInterval(() => {
      if (engine) {
        const state = engine.getState()
        // 如果关卡完成，立即保存数据并更新用户界面
        if (state.status === GameStatus.LEVEL_COMPLETE) {
          saveGameData(state.score, state.coins, state.level).then(() => {
            // 更新用户界面显示的金币数
            if (user) {
              setUser({ ...user, coins: state.coins })
            }
          })
        }
      }
    }, 500) // 每0.5秒检查一次

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('touchstart', handleClick)
      clearInterval(saveInterval)
      clearInterval(checkLevelComplete)
      engine.stop()
    }
  }, [user])

  const saveGameData = async (score: number, coins: number, level: number) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await fetch('/api/game/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score, coins, level }),
      })
    } catch (error) {
      console.error('保存游戏数据失败:', error)
    }
  }

  const handlePause = () => {
    if (!gameEngine) return
    if (isPaused) {
      gameEngine.resume()
    } else {
      gameEngine.pause()
    }
    setIsPaused(!isPaused)
  }

  const handleCloseShop = () => {
    setShowShop(false)
    // 如果之前游戏是运行状态，恢复游戏
    if (!wasPausedBeforeShop && gameEngine) {
      gameEngine.resume()
      setIsPaused(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handlePurchasePowerUp = async (powerUpType: PowerUpType) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ powerUpType, quantity: 1 }),
      })

      const data = await response.json()

      if (response.ok) {
        // 更新用户信息
        setUser({ ...user!, coins: data.coins, powerUps: data.powerUps })
        setUserPowerUps(data.powerUps)
        // 同步到游戏引擎
        if (gameEngine) {
          gameEngine.addPowerUp(powerUpType, 1)
        }
        alert(data.message || '购买成功！')
      } else {
        alert(data.error || '购买失败')
      }
    } catch (error) {
      console.error('购买道具失败:', error)
      alert('购买失败，请稍后重试')
    }
  }

  const handleUsePowerUp = (powerUpType: PowerUpType) => {
    if (!gameEngine) return

    const success = gameEngine.usePowerUp(powerUpType)
    if (success) {
      // 更新本地道具数量
      const newPowerUps = { ...userPowerUps }
      newPowerUps[powerUpType] = (newPowerUps[powerUpType] || 0) - 1
      if (newPowerUps[powerUpType] <= 0) {
        delete newPowerUps[powerUpType]
      }
      setUserPowerUps(newPowerUps)
    } else {
      alert('道具数量不足')
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
        maxWidth: '900px',
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
            onClick={() => router.push('/')}
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
            🏠 返回大厅
          </button>
          <button
            onClick={() => {
              // 保存当前暂停状态
              setWasPausedBeforeShop(isPaused)
              // 如果游戏正在运行，暂停游戏
              if (!isPaused && gameEngine) {
                gameEngine.pause()
                setIsPaused(true)
              }
              setShowShop(true)
            }}
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
            🛒 商店
          </button>
          <button
            onClick={handlePause}
            style={{
              padding: '10px 20px',
              background: isPaused 
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: isPaused 
                ? '0 4px 15px rgba(17, 153, 142, 0.4)'
                : '0 4px 15px rgba(240, 147, 251, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
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

      {/* 游戏画布 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '10px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            display: 'block',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* 操作说明 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '15px 30px',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#666',
        textAlign: 'center',
        width: '100%',
        maxWidth: '900px'
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击屏幕或按空格键放下钩子 | 钩子会自动摆动并抓取物品</p>
        <p style={{ marginTop: '5px', fontSize: '12px' }}>
          小金币(100) | 中金币(300) | 大金币(500) | 钻石(1000) | 石头(0) | 袋子(200)
        </p>
      </div>

      {/* 商店弹窗 */}
      {showShop && (
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
            if (e.target === e.currentTarget) handleCloseShop()
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            padding: '40px',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '85vh',
            overflowY: 'auto',
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
                fontSize: '32px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                🛒 道具商店
              </h2>
              <button
                onClick={handleCloseShop}
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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '20px',
              marginBottom: '30px'
            }}>
              {POWER_UP_SHOP.map(powerUp => {
                const canAfford = (user?.coins || 0) >= powerUp.price
                return (
                  <div 
                    key={powerUp.id} 
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      border: '2px solid #e0e0e0',
                      borderRadius: '20px',
                      padding: '25px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                      e.currentTarget.style.borderColor = canAfford ? '#667eea' : '#ccc'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.borderColor = '#e0e0e0'
                    }}
                  >
                    <div style={{ 
                      fontSize: '60px', 
                      marginBottom: '15px',
                      filter: canAfford ? 'none' : 'grayscale(100%)',
                      opacity: canAfford ? 1 : 0.5
                    }}>
                      {powerUp.icon}
                    </div>
                    <h3 style={{ 
                      margin: '0 0 10px 0', 
                      color: '#333',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {powerUp.name}
                    </h3>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#666', 
                      margin: '0 0 15px 0',
                      lineHeight: '1.5',
                      minHeight: '40px'
                    }}>
                      {powerUp.description}
                    </p>
                    <div style={{ 
                      marginBottom: '15px',
                      padding: '12px',
                      background: canAfford 
                        ? 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
                        : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                      borderRadius: '12px',
                      boxShadow: canAfford ? '0 4px 15px rgba(246, 211, 101, 0.3)' : 'none'
                    }}>
                      <div style={{ 
                        color: canAfford ? '#333' : '#999', 
                        fontWeight: 'bold', 
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                        <span>🪙</span>
                        <span>{powerUp.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePurchasePowerUp(powerUp.type)}
                      disabled={!canAfford}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: canAfford 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        boxShadow: canAfford ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
                        transition: 'all 0.3s ease',
                        opacity: canAfford ? 1 : 0.6
                      }}
                      onMouseEnter={(e) => {
                        if (canAfford) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (canAfford) {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }
                      }}
                    >
                      {canAfford ? '购买' : '金币不足'}
                    </button>
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleCloseShop}
                style={{
                  padding: '12px 30px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: '#666',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
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
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 道具使用按钮 */}
      {gameEngine && (
        <div style={{
          position: 'fixed',
          right: '30px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 100
        }}>
          {POWER_UP_SHOP.map(powerUp => {
            const count = userPowerUps[powerUp.type] || 0
            if (count <= 0) return null
            
            return (
              <button
                key={powerUp.id}
                onClick={() => handleUsePowerUp(powerUp.type)}
                style={{
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                title={powerUp.description}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(-5px) scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
                }}
              >
                <span style={{ fontSize: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                  {powerUp.icon}
                </span>
                <span>{powerUp.name}</span>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  minWidth: '35px',
                  textAlign: 'center'
                }}>
                  ×{count}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </main>
  )
}
