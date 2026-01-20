'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameShop from '@/app/components/GameShop'

const GRID_SIZE = 8
const CELL_SIZE = 60
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']

interface Position {
  row: number
  col: number
}

interface Animation {
  type: 'remove' | 'fall' | 'swap'
  row: number
  col: number
  progress: number
  targetRow?: number
  swapTarget?: Position
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
}

interface User {
  id: string
  username: string
  coins: number
  gamePowerUps?: Record<string, Record<string, number>>
}

export default function Match3Game() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [grid, setGrid] = useState<number[][]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120) // 2分钟
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [wasPausedBeforeShop, setWasPausedBeforeShop] = useState(false)
  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [animations, setAnimations] = useState<Animation[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [swapAnimation, setSwapAnimation] = useState<{ pos1: Position, pos2: Position, progress: number } | null>(null)
  const animationFrameRef = useRef<number>()

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
    if (powerUpId === 'match3-shuffle') {
      // 洗牌
      const newGrid = generateGrid()
      setGrid(newGrid)
    } else if (powerUpId === 'match3-bomb') {
      // 炸弹：消除一个区域
      if (grid.length > 0) {
        const newGrid = grid.map(row => [...row])
        const centerRow = Math.floor(GRID_SIZE / 2)
        const centerCol = Math.floor(GRID_SIZE / 2)
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const r = centerRow + i
            const c = centerCol + j
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
              newGrid[r][c] = -1
            }
          }
        }
        setGrid(newGrid)
        fillEmptyCells(newGrid)
      }
    } else if (powerUpId === 'match3-time') {
      setTimeLeft(prev => prev + 30)
    }
    
    if (user?.gamePowerUps?.match3) {
      const newPowerUps = { ...user.gamePowerUps }
      const count = (newPowerUps.match3[powerUpId] || 0) - 1
      if (count <= 0) {
        delete newPowerUps.match3[powerUpId]
      } else {
        newPowerUps.match3[powerUpId] = count
      }
      setUser({ ...user, gamePowerUps: newPowerUps })
    }
  }

  // 生成网格
  const generateGrid = (): number[][] => {
    const newGrid: number[][] = []
    for (let i = 0; i < GRID_SIZE; i++) {
      const row: number[] = []
      for (let j = 0; j < GRID_SIZE; j++) {
        row.push(Math.floor(Math.random() * COLORS.length))
      }
      newGrid.push(row)
    }
    return newGrid
  }

  // 填充空单元格
  const fillEmptyCells = (grid: number[][]) => {
    for (let j = 0; j < GRID_SIZE; j++) {
      let writeIndex = GRID_SIZE - 1
      for (let i = GRID_SIZE - 1; i >= 0; i--) {
        if (grid[i][j] !== -1) {
          grid[writeIndex][j] = grid[i][j]
          if (writeIndex !== i) grid[i][j] = -1
          writeIndex--
        }
      }
      for (let i = writeIndex; i >= 0; i--) {
        grid[i][j] = Math.floor(Math.random() * COLORS.length)
      }
    }
  }

  // 创建粒子效果
  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        color,
        life: 1,
        maxLife: 1
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }

  // 检查匹配
  const checkMatches = (grid: number[][]): boolean => {
    let hasMatch = false
    const toRemove: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))

    // 检查水平匹配
    for (let i = 0; i < GRID_SIZE; i++) {
      let count = 1
      for (let j = 1; j < GRID_SIZE; j++) {
        if (grid[i][j] === grid[i][j - 1] && grid[i][j] !== -1) {
          count++
        } else {
          if (count >= 3) {
            for (let k = j - count; k < j; k++) {
              toRemove[i][k] = true
              hasMatch = true
            }
          }
          count = 1
        }
      }
      if (count >= 3) {
        for (let k = GRID_SIZE - count; k < GRID_SIZE; k++) {
          toRemove[i][k] = true
          hasMatch = true
        }
      }
    }

    // 检查垂直匹配
    for (let j = 0; j < GRID_SIZE; j++) {
      let count = 1
      for (let i = 1; i < GRID_SIZE; i++) {
        if (grid[i][j] === grid[i - 1][j] && grid[i][j] !== -1) {
          count++
        } else {
          if (count >= 3) {
            for (let k = i - count; k < i; k++) {
              toRemove[k][j] = true
              hasMatch = true
            }
          }
          count = 1
        }
      }
      if (count >= 3) {
        for (let k = GRID_SIZE - count; k < GRID_SIZE; k++) {
          toRemove[k][j] = true
          hasMatch = true
        }
      }
    }

    if (hasMatch) {
      let removedCount = 0
      const removeAnimations: Animation[] = []
      
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (toRemove[i][j]) {
            const x = j * CELL_SIZE + CELL_SIZE / 2
            const y = i * CELL_SIZE + CELL_SIZE / 2
            createParticles(x, y, COLORS[grid[i][j]])
            removeAnimations.push({
              type: 'remove',
              row: i,
              col: j,
              progress: 0
            })
            grid[i][j] = -1
            removedCount++
          }
        }
      }
      
      setAnimations(removeAnimations)
      setScore(prev => prev + removedCount * 10)
      
      // 延迟填充，等待动画完成
      setTimeout(() => {
        fillEmptyCells(grid)
        setAnimations([])
      }, 400)
      
      return true
    }
    return false
  }

  // 交换方块
  const swapCells = (pos1: Position, pos2: Position) => {
    // 开始交换动画
    let progress = 0
    const animateSwap = () => {
      const animate = () => {
        progress += 0.08
        setSwapAnimation({ pos1, pos2, progress })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          // 动画完成，实际交换
          const newGrid = grid.map(row => [...row])
          const temp = newGrid[pos1.row][pos1.col]
          newGrid[pos1.row][pos1.col] = newGrid[pos2.row][pos2.col]
          newGrid[pos2.row][pos2.col] = temp
          setGrid(newGrid)
          setSwapAnimation(null)

          // 检查是否有匹配
          setTimeout(() => {
            if (!checkMatches(newGrid.map(row => [...row]))) {
              // 如果没有匹配，交换回来（带动画）
              let backProgress = 0
              const animateBack = () => {
                const animateBackLoop = () => {
                  backProgress += 0.08
                  setSwapAnimation({ pos1: pos2, pos2: pos1, progress: backProgress })
                  
                  if (backProgress < 1) {
                    requestAnimationFrame(animateBackLoop)
                  } else {
                    const revertGrid = newGrid.map(row => [...row])
                    const temp2 = revertGrid[pos1.row][pos1.col]
                    revertGrid[pos1.row][pos1.col] = revertGrid[pos2.row][pos2.col]
                    revertGrid[pos2.row][pos2.col] = temp2
                    setGrid(revertGrid)
                    setSwapAnimation(null)
                  }
                }
                animateBackLoop()
              }
              animateBack()
            } else {
              // 继续检查连锁反应
              setTimeout(() => {
                const currentGrid = newGrid.map(row => [...row])
                let hasMoreMatches = true
                let iterations = 0
                while (hasMoreMatches && iterations < 50) {
                  hasMoreMatches = checkMatches(currentGrid)
                  iterations++
                }
                setGrid(currentGrid)
              }, 500)
            }
          }, 50)
        }
      }
      animate()
    }
    animateSwap()
  }

  // 初始化
  useEffect(() => {
    let newGrid = generateGrid()
    // 确保初始没有匹配
    let attempts = 0
    while (checkMatches(newGrid.map(row => [...row]))) {
      newGrid = generateGrid()
      attempts++
      if (attempts > 100) break // 防止无限循环
    }
    setGrid(newGrid)
  }, [])

  // 计时器
  useEffect(() => {
    if (gameOver || isPaused) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameOver, isPaused])

  // 更新动画和粒子
  useEffect(() => {
    if (isPaused || gameOver) return

    const updateAnimations = () => {
      // 更新消除动画
      setAnimations(prev => 
        prev.map(anim => ({
          ...anim,
          progress: Math.min(anim.progress + 0.05, 1)
        })).filter(anim => anim.progress < 1)
      )

      // 更新粒子
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.2, // 重力
          life: Math.max(0, p.life - 0.02)
        })).filter(p => p.life > 0)
      )

      animationFrameRef.current = requestAnimationFrame(updateAnimations)
    }

    animationFrameRef.current = requestAnimationFrame(updateAnimations)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPaused, gameOver])

  // 绘制游戏
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(0.5, '#16213e')
      gradient.addColorStop(1, '#0f3460')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制网格线
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath()
        ctx.moveTo(i * CELL_SIZE, 0)
        ctx.lineTo(i * CELL_SIZE, canvas.height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, i * CELL_SIZE)
        ctx.lineTo(canvas.width, i * CELL_SIZE)
        ctx.stroke()
      }

      // 绘制方块
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          const value = grid[i]?.[j]
          if (value === undefined || value === -1) continue

          let x = j * CELL_SIZE
          let y = i * CELL_SIZE
          let scale = 1
          let alpha = 1

          // 处理交换动画
          if (swapAnimation) {
            const { pos1, pos2, progress } = swapAnimation
            if ((pos1.row === i && pos1.col === j) || (pos2.row === i && pos2.col === j)) {
              const isPos1 = pos1.row === i && pos1.col === j
              const startX = isPos1 ? pos1.col * CELL_SIZE : pos2.col * CELL_SIZE
              const startY = isPos1 ? pos1.row * CELL_SIZE : pos2.row * CELL_SIZE
              const endX = isPos1 ? pos2.col * CELL_SIZE : pos1.col * CELL_SIZE
              const endY = isPos1 ? pos2.row * CELL_SIZE : pos1.row * CELL_SIZE
              
              const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2
              
              x = startX + (endX - startX) * easeProgress
              y = startY + (endY - startY) * easeProgress
            }
          }

          // 处理消除动画
          const removeAnim = animations.find(a => a.row === i && a.col === j && a.type === 'remove')
          if (removeAnim) {
            scale = 1 - removeAnim.progress
            alpha = 1 - removeAnim.progress
          }

          // 绘制选中效果（脉冲动画）
          if (selectedCell && selectedCell.row === i && selectedCell.col === j) {
            const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.3
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
            
            // 绘制发光边框
            ctx.strokeStyle = `rgba(255, 255, 255, ${pulse + 0.2})`
            ctx.lineWidth = 3
            ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
          }

          // 绘制方块（带阴影和渐变）
          if (alpha > 0) {
            ctx.save()
            ctx.globalAlpha = alpha
            
            // 绘制阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.fillRect(x + 4, y + 4, (CELL_SIZE - 4) * scale, (CELL_SIZE - 4) * scale)
            
            // 绘制方块主体（带渐变）
            const cellGradient = ctx.createLinearGradient(
              x + 2, y + 2,
              x + CELL_SIZE - 2, y + CELL_SIZE - 2
            )
            const baseColor = COLORS[value]
            cellGradient.addColorStop(0, baseColor)
            cellGradient.addColorStop(1, baseColor + '80')
            ctx.fillStyle = cellGradient
            
            const size = (CELL_SIZE - 4) * scale
            const offsetX = x + 2 + (CELL_SIZE - 4 - size) / 2
            const offsetY = y + 2 + (CELL_SIZE - 4 - size) / 2
            
            // 绘制圆角矩形
            const radius = 8 * scale
            ctx.beginPath()
            ctx.moveTo(offsetX + radius, offsetY)
            ctx.lineTo(offsetX + size - radius, offsetY)
            ctx.quadraticCurveTo(offsetX + size, offsetY, offsetX + size, offsetY + radius)
            ctx.lineTo(offsetX + size, offsetY + size - radius)
            ctx.quadraticCurveTo(offsetX + size, offsetY + size, offsetX + size - radius, offsetY + size)
            ctx.lineTo(offsetX + radius, offsetY + size)
            ctx.quadraticCurveTo(offsetX, offsetY + size, offsetX, offsetY + size - radius)
            ctx.lineTo(offsetX, offsetY + radius)
            ctx.quadraticCurveTo(offsetX, offsetY, offsetX + radius, offsetY)
            ctx.closePath()
            ctx.fill()
            
            // 绘制高光
            const highlightGradient = ctx.createLinearGradient(
              offsetX, offsetY,
              offsetX, offsetY + size / 2
            )
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = highlightGradient
            ctx.fill()
            
            // 绘制边框
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
            ctx.lineWidth = 2
            ctx.stroke()
            
            ctx.restore()
          }
        }
      }

      // 绘制粒子
      particles.forEach(particle => {
        ctx.save()
        ctx.globalAlpha = particle.life
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
    }

    const animate = () => {
      draw()
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [grid, selectedCell, animations, particles, swapAnimation])

  // 鼠标点击
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || isPaused) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const col = Math.floor(x / CELL_SIZE)
    const row = Math.floor(y / CELL_SIZE)

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      if (selectedCell) {
        // 检查是否相邻
        const rowDiff = Math.abs(row - selectedCell.row)
        const colDiff = Math.abs(col - selectedCell.col)
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
          swapCells(selectedCell, { row, col })
        }
        setSelectedCell(null)
      } else {
        setSelectedCell({ row, col })
      }
    }
  }

  const restart = () => {
    let newGrid = generateGrid()
    let attempts = 0
    while (checkMatches(newGrid.map(row => [...row]))) {
      newGrid = generateGrid()
      attempts++
      if (attempts > 100) break // 防止无限循环
    }
    setGrid(newGrid)
    setScore(0)
    setTimeLeft(120)
    setGameOver(false)
    setIsPaused(false)
    setSelectedCell(null)
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
        maxWidth: '500px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'right' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              分数: {score}
            </div>
            <div style={{ fontSize: '16px', color: timeLeft < 30 ? '#ff0000' : '#fff' }}>
              时间: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
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
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            borderRadius: '8px',
            cursor: 'pointer'
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
              background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)'
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
        maxWidth: '500px'
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击两个相邻的方块交换位置 | 空格键暂停/继续</p>
        <p>消除三个或更多相同颜色的方块获得分数！</p>
      </div>

      {/* 商店弹窗 */}
      {showShop && user && (
        <GameShop
          gameId="match3"
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
