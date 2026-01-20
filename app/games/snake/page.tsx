'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameShop from '@/app/components/GameShop'
import { getGamePowerUps } from '@/app/games/game-powerups'

interface Position {
  x: number
  y: number
}

interface User {
  id: string
  username: string
  coins: number
  gamePowerUps?: Record<string, Record<string, number>>
}

export default function SnakeGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [wasPausedBeforeShop, setWasPausedBeforeShop] = useState(false)
  
  const GRID_SIZE = 20
  const TILE_COUNT = 20
  const GAME_SPEED = 150

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
    // TODO: 实现道具使用逻辑
    alert(`使用道具: ${powerUpId}`)
    // 更新道具数量
    if (user?.gamePowerUps?.snake) {
      const newPowerUps = { ...user.gamePowerUps }
      const count = (newPowerUps.snake[powerUpId] || 0) - 1
      if (count <= 0) {
        delete newPowerUps.snake[powerUpId]
      } else {
        newPowerUps.snake[powerUpId] = count
      }
      setUser({ ...user, gamePowerUps: newPowerUps })
    }
  }

  useEffect(() => {
    if (!canvasRef.current || gameOver) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 游戏状态
    let snake: Position[] = [{ x: 10, y: 10 }]
    let direction: Position = { x: 1, y: 0 }
    let food: Position = { x: 15, y: 15 }
    let gameLoop: ReturnType<typeof setInterval>

    // 绘制函数
    const draw = () => {
      // 清空画布
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制网格
      ctx.strokeStyle = '#16213e'
      ctx.lineWidth = 1
      for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath()
        ctx.moveTo(i * GRID_SIZE, 0)
        ctx.lineTo(i * GRID_SIZE, canvas.height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i * GRID_SIZE)
        ctx.lineTo(canvas.width, i * GRID_SIZE)
        ctx.stroke()
      }

      // 绘制蛇
      ctx.fillStyle = '#4CAF50'
      snake.forEach((segment, index) => {
        if (index === 0) {
          // 蛇头
          ctx.fillStyle = '#2E7D32'
        } else {
          ctx.fillStyle = '#4CAF50'
        }
        ctx.fillRect(
          segment.x * GRID_SIZE + 1,
          segment.y * GRID_SIZE + 1,
          GRID_SIZE - 2,
          GRID_SIZE - 2
        )
      })

      // 绘制食物
      ctx.fillStyle = '#FF5722'
      ctx.beginPath()
      ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }

    // 更新游戏
    const update = () => {
      if (isPaused) return

      // 移动蛇头
      let head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y,
      }

      // 穿墙效果：从对面出来
      if (head.x < 0) {
        head.x = TILE_COUNT - 1
      } else if (head.x >= TILE_COUNT) {
        head.x = 0
      }
      if (head.y < 0) {
        head.y = TILE_COUNT - 1
      } else if (head.y >= TILE_COUNT) {
        head.y = 0
      }

      // 检查是否撞到自己
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true)
        return
      }

      snake.unshift(head)

      // 检查是否吃到食物
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10)
        // 生成新食物
        do {
          food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT),
          }
        } while (snake.some(segment => segment.x === food.x && segment.y === food.y))
      } else {
        snake.pop()
      }

      draw()
    }

    // 键盘控制
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isPaused && e.key !== ' ') return
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) direction = { x: 0, y: -1 }
          break
        case 'ArrowDown':
          if (direction.y === 0) direction = { x: 0, y: 1 }
          break
        case 'ArrowLeft':
          if (direction.x === 0) direction = { x: -1, y: 0 }
          break
        case 'ArrowRight':
          if (direction.x === 0) direction = { x: 1, y: 0 }
          break
        case ' ':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    draw()
    gameLoop = setInterval(update, GAME_SPEED)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      clearInterval(gameLoop)
    }
  }, [gameOver, isPaused])

  const restart = () => {
    setScore(0)
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
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            🏠 返回大厅
          </button>
          <button
            onClick={() => {
              // 保存当前暂停状态
              setWasPausedBeforeShop(isPaused)
              // 如果游戏正在运行，暂停游戏
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
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            分数: {score}
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
          width={400}
          height={400}
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
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)'
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
        <p>使用方向键控制蛇的移动 | 空格键暂停/继续</p>
        <p>吃到红色食物可以增长并获得分数</p>
      </div>

      {/* 商店弹窗 */}
      {showShop && user && (
        <GameShop
          gameId="snake"
          userCoins={user.coins}
          userPowerUps={user.gamePowerUps || {}}
          onPurchase={handlePurchase}
          onUse={handleUsePowerUp}
          onClose={() => {
            setShowShop(false)
            // 如果之前游戏是运行状态，恢复游戏
            if (!wasPausedBeforeShop) {
              setIsPaused(false)
            }
          }}
        />
      )}

      {/* 道具快捷使用按钮 */}
      {user && (
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
          {getGamePowerUps('snake').map(powerUp => {
            const count = user.gamePowerUps?.snake?.[powerUp.id] || 0
            if (count <= 0) return null
            
            return (
              <button
                key={powerUp.id}
                onClick={() => handleUsePowerUp(powerUp.id)}
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
