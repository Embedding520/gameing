'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameShop from '@/app/components/GameShop'
import { getGamePowerUps } from '@/app/games/game-powerups'

const PADDLE_WIDTH = 100
const PADDLE_HEIGHT = 10
const BALL_SIZE = 10
const BRICK_ROWS = 5
const BRICK_COLS = 8
const BRICK_WIDTH = 70
const BRICK_HEIGHT = 20
const BRICK_PADDING = 5
const BRICK_OFFSET_TOP = 50
const BRICK_OFFSET_LEFT = 35

interface User {
  id: string
  username: string
  coins: number
  gamePowerUps?: Record<string, Record<string, number>>
}

export default function BreakoutGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [wasPausedBeforeShop, setWasPausedBeforeShop] = useState(false)

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
    alert(`使用道具: ${powerUpId}`)
    if (user?.gamePowerUps?.breakout) {
      const newPowerUps = { ...user.gamePowerUps }
      const count = (newPowerUps.breakout[powerUpId] || 0) - 1
      if (count <= 0) {
        delete newPowerUps.breakout[powerUpId]
      } else {
        newPowerUps.breakout[powerUpId] = count
      }
      setUser({ ...user, gamePowerUps: newPowerUps })
    }
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 如果游戏结束，不初始化游戏循环
    if (gameOver) {
      return
    }

    // 游戏状态
    let paddle = {
      x: canvas.width / 2 - PADDLE_WIDTH / 2,
      y: canvas.height - 30,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      dx: 0
    }

    let ball = {
      x: canvas.width / 2,
      y: paddle.y - 20, // 球初始位置在挡板上方20像素
      radius: BALL_SIZE,
      dx: 2, // 降低水平速度
      dy: -2 // 降低垂直速度
    }

    const colors = ['#FF5722', '#FF9800', '#FFC107', '#4CAF50', '#2196F3']
    let bricks: Array<{ x: number, y: number, width: number, height: number, color: string, visible: boolean }> = []

    // 初始化砖块
    const initBricks = () => {
      bricks = []
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          bricks.push({
            x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
            y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
            width: BRICK_WIDTH,
            height: BRICK_HEIGHT,
            color: colors[r],
            visible: true
          })
        }
      }
    }

    initBricks()

    // 绘制函数
    const draw = () => {
      // 清空画布
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制砖块
      bricks.forEach(brick => {
        if (brick.visible) {
          ctx.fillStyle = brick.color
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
          ctx.strokeStyle = '#fff'
          ctx.strokeRect(brick.x, brick.y, brick.width, brick.height)
        }
      })

      // 绘制挡板
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)

      // 绘制球
      ctx.fillStyle = '#FFC107'
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // 碰撞检测
    const collisionDetection = () => {
      // 检测墙壁碰撞（先检测墙壁，避免球超出边界）
      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy
      }

      // 检测砖块碰撞
      bricks.forEach(brick => {
        if (brick.visible) {
          if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
          ) {
            ball.dy = -ball.dy
            brick.visible = false
            setScore(prev => prev + 10)
            
            // 检查是否所有砖块都被击碎
            if (bricks.every(b => !b.visible)) {
              initBricks()
              ball.x = canvas.width / 2
              ball.y = paddle.y - 20 // 重置到挡板上方
              ball.dx = 2
              ball.dy = -2
            }
          }
        }
      })

      // 检测挡板碰撞（改进碰撞检测，确保球在挡板范围内且正在下落）
      if (
        ball.dy > 0 && // 只在下落时检测
        ball.x + ball.radius > paddle.x &&
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height
      ) {
        // 确保球反弹到挡板上方，避免卡在挡板内
        ball.y = paddle.y - ball.radius - 1
        const hitPos = (ball.x - paddle.x) / paddle.width
        ball.dx = 4 * (hitPos - 0.5) // 降低反弹速度
        ball.dy = -Math.abs(ball.dy) // 确保向上反弹
        return // 碰撞后直接返回，避免继续检测掉落
      }

      // 检测球掉落（只有当球的底部完全掉出画布底部时才游戏结束）
      // 注意：这个检测在挡板碰撞检测之后，所以如果球在挡板上反弹了，就不会执行到这里
      if (ball.y + ball.radius > canvas.height) {
        setGameOver(true)
      }
    }

    // 更新游戏
    let animationId: number
    const update = () => {
      // 如果游戏结束，停止循环
      if (gameOver) {
        return
      }

      if (isPaused) {
        draw()
        animationId = requestAnimationFrame(update)
        return
      }

      // 移动挡板
      paddle.x += paddle.dx
      if (paddle.x < 0) paddle.x = 0
      if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width

      // 移动球
      ball.x += ball.dx
      ball.y += ball.dy

      collisionDetection()
      draw()
      animationId = requestAnimationFrame(update)
    }

    // 键盘控制
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          paddle.dx = -7
          break
        case 'ArrowRight':
          paddle.dx = 7
          break
        case ' ':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        paddle.dx = 0
      }
    }

    // 鼠标控制
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      paddle.x = mouseX - paddle.width / 2
      if (paddle.x < 0) paddle.x = 0
      if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('mousemove', handleMouseMove)
    
    draw()
    animationId = requestAnimationFrame(update)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('mousemove', handleMouseMove)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [gameOver, isPaused])

  const restart = () => {
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    // 强制重新渲染以重置游戏状态
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
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
        maxWidth: '700px',
        padding: '20px'
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
            background: 'linear-gradient(135deg, #E91E63 0%, #880E4F 100%)',
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
          width={700}
          height={500}
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
              background: 'linear-gradient(135deg, #E91E63 0%, #880E4F 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(233, 30, 99, 0.4)'
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
        maxWidth: '700px'
      }}>
        <p><strong>操作说明：</strong></p>
        <p>使用 ← → 方向键或鼠标移动挡板 | 空格键暂停/继续</p>
        <p>用挡板反弹球来击碎所有砖块</p>
      </div>

      {/* 商店弹窗 */}
      {showShop && user && (
        <GameShop
          gameId="breakout"
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
          {getGamePowerUps('breakout').map(powerUp => {
            const count = user.gamePowerUps?.breakout?.[powerUp.id] || 0
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
