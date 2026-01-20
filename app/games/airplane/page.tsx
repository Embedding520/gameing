'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameShop from '@/app/components/GameShop'

interface Position {
  x: number
  y: number
}

interface Bullet extends Position {
  id: number
}

interface Enemy extends Position {
  id: number
  speed: number
}

interface User {
  id: string
  username: string
  coins: number
  gamePowerUps?: Record<string, Record<string, number>>
}

export default function AirplaneGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [wasPausedBeforeShop, setWasPausedBeforeShop] = useState(false)

  const PLANE_SIZE = 40
  const BULLET_SIZE = 5
  const ENEMY_SIZE = 30
  const BULLET_SPEED = 5
  const ENEMY_SPEED = 2
  const ENEMY_SPAWN_RATE = 0.02

  // 获取用户信息
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchUserInfo = async () => {
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

    fetchUserInfo()
  }, [router])

  // 购买道具
  const handlePurchase = async (powerUpId: string, gameId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/shop/purchase-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ powerUpId, gameId, quantity: 1 }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser({ ...user!, coins: data.coins, gamePowerUps: data.gamePowerUps })
        alert(data.message || '购买成功！')
      } else {
        alert(data.error || '购买失败')
      }
    } catch (error) {
      console.error('购买道具失败:', error)
      alert('购买失败，请稍后重试')
    }
  }

  // 使用道具
  const handleUsePowerUp = (powerUpId: string) => {
    if (powerUpId === 'airplane-shield') {
      // 护盾效果（在碰撞检测中处理）
      alert('护盾已激活！')
    } else if (powerUpId === 'airplane-life') {
      setLives(prev => prev + 1)
    }
    
    if (user?.gamePowerUps?.airplane) {
      const newPowerUps = { ...user.gamePowerUps }
      const count = (newPowerUps.airplane[powerUpId] || 0) - 1
      if (count <= 0) {
        delete newPowerUps.airplane[powerUpId]
      } else {
        newPowerUps.airplane[powerUpId] = count
      }
      setUser({ ...user, gamePowerUps: newPowerUps })
    }
  }

  useEffect(() => {
    if (!canvasRef.current || gameOver) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let plane: Position = { x: canvas.width / 2, y: canvas.height - 60 }
    let bullets: Bullet[] = []
    let enemies: Enemy[] = []
    let bulletId = 0
    let enemyId = 0
    let lastBulletTime = 0
    let keys: Set<string> = new Set()
    let hasShield = false

    const draw = () => {
      // 清空画布
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制星星背景
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width
        const y = (i * 53 + Date.now() * 0.1) % canvas.height
        ctx.fillRect(x, y, 2, 2)
      }

      // 绘制飞机
      ctx.fillStyle = '#00D2FF'
      ctx.beginPath()
      ctx.moveTo(plane.x, plane.y)
      ctx.lineTo(plane.x - PLANE_SIZE / 2, plane.y + PLANE_SIZE)
      ctx.lineTo(plane.x, plane.y + PLANE_SIZE * 0.7)
      ctx.lineTo(plane.x + PLANE_SIZE / 2, plane.y + PLANE_SIZE)
      ctx.closePath()
      ctx.fill()

      // 绘制护盾
      if (hasShield) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(plane.x, plane.y + PLANE_SIZE / 2, PLANE_SIZE, 0, Math.PI * 2)
        ctx.stroke()
      }

      // 绘制子弹
      ctx.fillStyle = '#FFD700'
      bullets.forEach(bullet => {
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, BULLET_SIZE, 0, Math.PI * 2)
        ctx.fill()
      })

      // 绘制敌机
      ctx.fillStyle = '#FF0000'
      enemies.forEach(enemy => {
        ctx.beginPath()
        ctx.moveTo(enemy.x, enemy.y)
        ctx.lineTo(enemy.x - ENEMY_SIZE / 2, enemy.y + ENEMY_SIZE)
        ctx.lineTo(enemy.x, enemy.y + ENEMY_SIZE * 0.7)
        ctx.lineTo(enemy.x + ENEMY_SIZE / 2, enemy.y + ENEMY_SIZE)
        ctx.closePath()
        ctx.fill()
      })
    }

    const update = () => {
      if (isPaused || gameOver) {
        draw()
        requestAnimationFrame(update)
        return
      }

      // 移动飞机
      if (keys.has('ArrowLeft') && plane.x > PLANE_SIZE / 2) {
        plane.x -= 5
      }
      if (keys.has('ArrowRight') && plane.x < canvas.width - PLANE_SIZE / 2) {
        plane.x += 5
      }
      if (keys.has('ArrowUp') && plane.y > PLANE_SIZE / 2) {
        plane.y -= 5
      }
      if (keys.has('ArrowDown') && plane.y < canvas.height - PLANE_SIZE) {
        plane.y += 5
      }

      // 发射子弹
      const now = Date.now()
      if (now - lastBulletTime > 200) {
        bullets.push({
          id: bulletId++,
          x: plane.x,
          y: plane.y,
        })
        lastBulletTime = now
      }

      // 更新子弹
      bullets = bullets.filter(bullet => {
        bullet.y -= BULLET_SPEED
        return bullet.y > 0
      })

      // 生成敌机
      if (Math.random() < ENEMY_SPAWN_RATE) {
        enemies.push({
          id: enemyId++,
          x: Math.random() * (canvas.width - ENEMY_SIZE) + ENEMY_SIZE / 2,
          y: -ENEMY_SIZE,
          speed: ENEMY_SPEED + Math.random() * 2,
        })
      }

      // 更新敌机
      enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed
        return enemy.y < canvas.height
      })

      // 碰撞检测：子弹击中敌机
      bullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
          const dx = bullet.x - enemy.x
          const dy = bullet.y - enemy.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < ENEMY_SIZE / 2 + BULLET_SIZE) {
            bullets.splice(bi, 1)
            enemies.splice(ei, 1)
            setScore(prev => prev + 10)
          }
        })
      })

      // 碰撞检测：敌机撞击飞机
      enemies.forEach((enemy, ei) => {
        const dx = plane.x - enemy.x
        const dy = plane.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < PLANE_SIZE / 2 + ENEMY_SIZE / 2) {
          if (hasShield) {
            hasShield = false
            enemies.splice(ei, 1)
          } else {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setGameOver(true)
              }
              return newLives
            })
            enemies.splice(ei, 1)
          }
        }
      })

      draw()
      requestAnimationFrame(update)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused(prev => !prev)
        return
      }
      keys.add(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    draw()
    requestAnimationFrame(update)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameOver, isPaused])

  const restart = () => {
    setScore(0)
    setLives(3)
    setGameOver(false)
    setIsPaused(false)
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '600px',
        padding: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
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
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            🏠 返回大厅
          </button>
          <button
            onClick={() => {
              setWasPausedBeforeShop(isPaused)
              if (!isPaused) {
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
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            🛒 商店
          </button>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {user && (
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
          )}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span>❤️</span>
              <span>{lives}</span>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              分数: {score}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '10px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
      }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={700}
          style={{
            display: 'block',
            borderRadius: '8px'
          }}
        />
      </div>

      {gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          zIndex: 1000
        }}>
          <h2 style={{ fontSize: '48px', margin: 0 }}>游戏结束！</h2>
          <p style={{ fontSize: '24px' }}>最终分数: {score}</p>
          <button
            onClick={restart}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0, 210, 255, 0.4)'
            }}
          >
            重新开始
          </button>
        </div>
      )}

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '10px',
        fontSize: '14px',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <p><strong>操作说明：</strong></p>
        <p>使用方向键控制飞机移动 | 空格键暂停/继续</p>
        <p>自动发射子弹，躲避红色敌机并击毁它们！</p>
      </div>

      {/* 商店弹窗 */}
      {showShop && user && (
        <GameShop
          gameId="airplane"
          userCoins={user.coins}
          userPowerUps={user.gamePowerUps || {}}
          onPurchase={handlePurchase}
          onUse={handleUsePowerUp}
          onClose={() => {
            setShowShop(false)
            if (!wasPausedBeforeShop) {
              setIsPaused(false)
            }
          }}
        />
      )}
    </main>
  )
}
