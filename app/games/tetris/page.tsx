'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameShop from '@/app/components/GameShop'
import { getGamePowerUps } from '@/app/games/game-powerups'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 30

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]], // L
]

const COLORS = ['#FF5722', '#2196F3', '#FFC107', '#4CAF50', '#9C27B0', '#00BCD4', '#FF9800']

interface User {
  id: string
  username: string
  coins: number
  gamePowerUps?: Record<string, Record<string, number>>
}

export default function TetrisGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
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
    if (user?.gamePowerUps?.tetris) {
      const newPowerUps = { ...user.gamePowerUps }
      const count = (newPowerUps.tetris[powerUpId] || 0) - 1
      if (count <= 0) {
        delete newPowerUps.tetris[powerUpId]
      } else {
        newPowerUps.tetris[powerUpId] = count
      }
      setUser({ ...user, gamePowerUps: newPowerUps })
    }
  }

  useEffect(() => {
    if (!canvasRef.current || gameOver) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let board: number[][] = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
    let currentPiece: { shape: number[][], x: number, y: number, color: string } | null = null
    let dropCounter = 0
    let dropInterval = 1000
    let lastTime = 0

    const createPiece = () => {
      const shapeIndex = Math.floor(Math.random() * SHAPES.length)
      return {
        shape: SHAPES[shapeIndex],
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0,
        color: COLORS[shapeIndex]
      }
    }

    const draw = () => {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制网格
      ctx.strokeStyle = '#16213e'
      ctx.lineWidth = 1
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }

      // 绘制已放置的方块
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          if (board[y][x]) {
            ctx.fillStyle = board[y][x] as any
            ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
          }
        }
      }

      // 绘制当前方块
      if (currentPiece) {
        ctx.fillStyle = currentPiece.color
        for (let y = 0; y < currentPiece.shape.length; y++) {
          for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
              ctx.fillRect(
                (currentPiece.x + x) * CELL_SIZE + 1,
                (currentPiece.y + y) * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
              )
            }
          }
        }
      }
    }

    const collide = (piece: typeof currentPiece, dx: number, dy: number, newShape?: number[][]) => {
      if (!piece) return true
      const shape = newShape || piece.shape
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const newX = piece.x + x + dx
            const newY = piece.y + y + dy
            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true
            if (newY >= 0 && board[newY][newX]) return true
          }
        }
      }
      return false
    }

    const rotate = (shape: number[][]) => {
      const rows = shape.length
      const cols = shape[0].length
      const rotated: number[][] = Array(cols).fill(null).map(() => Array(rows).fill(0))
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          rotated[x][rows - 1 - y] = shape[y][x]
        }
      }
      return rotated
    }

    const clearLines = () => {
      let linesCleared = 0
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
          board.splice(y, 1)
          board.unshift(Array(BOARD_WIDTH).fill(0))
          linesCleared++
          y++
        }
      }
      if (linesCleared > 0) {
        setLines(prev => prev + linesCleared)
        setScore(prev => prev + linesCleared * 100)
      }
    }

    const placePiece = () => {
      if (!currentPiece) return
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color as any
          }
        }
      }
      clearLines()
      currentPiece = createPiece()
      if (collide(currentPiece, 0, 0)) {
        setGameOver(true)
      }
    }

    const update = (time: number) => {
      if (isPaused) {
        lastTime = time
        requestAnimationFrame(update)
        return
      }

      const deltaTime = time - lastTime
      dropCounter += deltaTime

      if (dropCounter > dropInterval) {
        if (!currentPiece) {
          currentPiece = createPiece()
        } else if (!collide(currentPiece, 0, 1)) {
          currentPiece.y++
        } else {
          placePiece()
        }
        dropCounter = 0
      }

      lastTime = time
      draw()
      requestAnimationFrame(update)
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentPiece || isPaused) return

      switch (e.key) {
        case 'ArrowLeft':
          if (!collide(currentPiece, -1, 0)) currentPiece.x--
          break
        case 'ArrowRight':
          if (!collide(currentPiece, 1, 0)) currentPiece.x++
          break
        case 'ArrowDown':
          if (!collide(currentPiece, 0, 1)) currentPiece.y++
          break
        case 'ArrowUp':
          const rotated = rotate(currentPiece.shape)
          if (!collide(currentPiece, 0, 0, rotated)) {
            currentPiece.shape = rotated
          }
          break
        case ' ':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    currentPiece = createPiece()
    requestAnimationFrame(update)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [gameOver, isPaused])

  const restart = () => {
    setScore(0)
    setLines(0)
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
        maxWidth: '400px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>分数: {score}</div>
            <div style={{ fontSize: '16px' }}>消除: {lines} 行</div>
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
          width={BOARD_WIDTH * CELL_SIZE}
          height={BOARD_HEIGHT * CELL_SIZE}
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
          <p style={{ fontSize: '18px' }}>消除行数: {lines}</p>
          <button
            onClick={restart}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #2196F3 0%, #0D47A1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)'
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
        maxWidth: '400px'
      }}>
        <p><strong>操作说明：</strong></p>
        <p>← → 移动 | ↓ 加速下降 | ↑ 旋转 | 空格 暂停</p>
        <p>消除完整行获得分数</p>
      </div>

      {/* 商店弹窗 */}
      {showShop && user && (
        <GameShop
          gameId="tetris"
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
          {getGamePowerUps('tetris').map(powerUp => {
            const count = user.gamePowerUps?.tetris?.[powerUp.id] || 0
            if (count <= 0) return null
            
            return (
              <button
                key={powerUp.id}
                onClick={() => handleUsePowerUp(powerUp.id)}
                style={{
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
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
