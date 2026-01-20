'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameShop from '@/app/components/GameShop'

const GRID_SIZE = 4
const CELL_SIZE = 80
const CELL_GAP = 10

interface User {
  id: string
  username: string
  coins: number
  gamePowerUps?: Record<string, Record<string, number>>
}

export default function Game2048() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [grid, setGrid] = useState<number[][]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [wasPausedBeforeShop, setWasPausedBeforeShop] = useState(false)
  const [history, setHistory] = useState<number[][][]>([])

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
    if (powerUpId === '2048-undo' && history.length > 0) {
      const prevState = history[history.length - 1]
      setGrid(prevState)
      setHistory(history.slice(0, -1))
    } else if (powerUpId === '2048-bomb') {
      // 随机消除一个方块
      const emptyCells: [number, number][] = []
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (grid[i][j] !== 0) {
            emptyCells.push([i, j])
          }
        }
      }
      if (emptyCells.length > 0) {
        const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
        const newGrid = grid.map(row => [...row])
        newGrid[row][col] = 0
        setGrid(newGrid)
      }
    }
    
    if (user?.gamePowerUps?.game2048) {
      const newPowerUps = { ...user.gamePowerUps }
      const count = (newPowerUps.game2048[powerUpId] || 0) - 1
      if (count <= 0) {
        delete newPowerUps.game2048[powerUpId]
      } else {
        newPowerUps.game2048[powerUpId] = count
      }
      setUser({ ...user, gamePowerUps: newPowerUps })
    }
  }

  // 初始化游戏
  const initGame = () => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
    addRandomTile(newGrid)
    addRandomTile(newGrid)
    setGrid(newGrid)
    setScore(0)
    setGameOver(false)
    setHistory([])
  }

  // 添加随机方块
  const addRandomTile = (grid: number[][]) => {
    const emptyCells: [number, number][] = []
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) {
          emptyCells.push([i, j])
        }
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      grid[row][col] = Math.random() < 0.9 ? 2 : 4
    }
  }

  // 移动方块
  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || isPaused) return

    const newGrid = grid.map(row => [...row])
    let moved = false
    let newScore = score

    // 保存历史
    setHistory([...history, grid.map(row => [...row])])

    if (direction === 'left') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const row = newGrid[i].filter(val => val !== 0)
        for (let j = 0; j < row.length - 1; j++) {
          if (row[j] === row[j + 1]) {
            row[j] *= 2
            newScore += row[j]
            row[j + 1] = 0
          }
        }
        const merged = row.filter(val => val !== 0)
        while (merged.length < GRID_SIZE) merged.push(0)
        if (JSON.stringify(newGrid[i]) !== JSON.stringify(merged)) moved = true
        newGrid[i] = merged
      }
    } else if (direction === 'right') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const row = newGrid[i].filter(val => val !== 0)
        for (let j = row.length - 1; j > 0; j--) {
          if (row[j] === row[j - 1]) {
            row[j] *= 2
            newScore += row[j]
            row[j - 1] = 0
          }
        }
        const merged = row.filter(val => val !== 0)
        while (merged.length < GRID_SIZE) merged.unshift(0)
        if (JSON.stringify(newGrid[i]) !== JSON.stringify(merged)) moved = true
        newGrid[i] = merged
      }
    } else if (direction === 'up') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const col = []
        for (let i = 0; i < GRID_SIZE; i++) {
          if (newGrid[i][j] !== 0) col.push(newGrid[i][j])
        }
        for (let i = 0; i < col.length - 1; i++) {
          if (col[i] === col[i + 1]) {
            col[i] *= 2
            newScore += col[i]
            col[i + 1] = 0
          }
        }
        const merged = col.filter(val => val !== 0)
        while (merged.length < GRID_SIZE) merged.push(0)
        for (let i = 0; i < GRID_SIZE; i++) {
          if (newGrid[i][j] !== merged[i]) moved = true
          newGrid[i][j] = merged[i]
        }
      }
    } else if (direction === 'down') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const col = []
        for (let i = 0; i < GRID_SIZE; i++) {
          if (newGrid[i][j] !== 0) col.push(newGrid[i][j])
        }
        for (let i = col.length - 1; i > 0; i--) {
          if (col[i] === col[i - 1]) {
            col[i] *= 2
            newScore += col[i]
            col[i - 1] = 0
          }
        }
        const merged = col.filter(val => val !== 0)
        while (merged.length < GRID_SIZE) merged.unshift(0)
        for (let i = 0; i < GRID_SIZE; i++) {
          if (newGrid[i][j] !== merged[i]) moved = true
          newGrid[i][j] = merged[i]
        }
      }
    }

    if (moved) {
      addRandomTile(newGrid)
      setGrid(newGrid)
      setScore(newScore)
      checkGameOver(newGrid)
    }
  }

  // 检查游戏是否结束
  const checkGameOver = (grid: number[][]) => {
    // 检查是否有空格
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) return
        // 检查是否可以合并
        if (i < GRID_SIZE - 1 && grid[i][j] === grid[i + 1][j]) return
        if (j < GRID_SIZE - 1 && grid[i][j] === grid[i][j + 1]) return
      }
    }
    setGameOver(true)
  }

  // 初始化
  useEffect(() => {
    initGame()
  }, [])

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver || isPaused) return
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          move('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          move('down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          move('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          move('right')
          break
        case ' ':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [grid, gameOver, isPaused])

  // 绘制游戏
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制背景
      ctx.fillStyle = '#bbada0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制网格
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          const x = j * (CELL_SIZE + CELL_GAP) + CELL_GAP
          const y = i * (CELL_SIZE + CELL_GAP) + CELL_GAP

          ctx.fillStyle = '#cdc1b4'
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)

          const value = grid[i]?.[j] || 0
          if (value !== 0) {
            // 根据数值设置颜色
            const colors: Record<number, string> = {
              2: '#eee4da',
              4: '#ede0c8',
              8: '#f2b179',
              16: '#f59563',
              32: '#f67c5f',
              64: '#f65e3b',
              128: '#edcf72',
              256: '#edcc61',
              512: '#edc850',
              1024: '#edc53f',
              2048: '#edc22e',
            }
            ctx.fillStyle = colors[value] || '#3c3a32'
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)

            // 绘制数字
            ctx.fillStyle = value <= 4 ? '#776e65' : '#f9f6f2'
            ctx.font = 'bold 36px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(value.toString(), x + CELL_SIZE / 2, y + CELL_SIZE / 2)
          }
        }
      }
    }

    draw()
  }, [grid])

  const restart = () => {
    initGame()
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
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #C92A2A 100%)',
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
          width={GRID_SIZE * (CELL_SIZE + CELL_GAP) + CELL_GAP}
          height={GRID_SIZE * (CELL_SIZE + CELL_GAP) + CELL_GAP}
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
              background: 'linear-gradient(135deg, #FF6B6B 0%, #C92A2A 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
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
        <p>使用方向键移动方块 | 空格键暂停/继续</p>
        <p>相同数字的方块会合并，目标是达到2048！</p>
      </div>

      {/* 商店弹窗 */}
      {showShop && user && (
        <GameShop
          gameId="game2048"
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
