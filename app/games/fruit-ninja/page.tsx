'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Fruit {
  x: number
  y: number
  vx: number
  vy: number
  type: string
  rotation: number
  rotationSpeed: number
}

interface Slice {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
}

export default function FruitNinjaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const gameStateRef = useRef<{
    fruits: Fruit[]
    slices: Slice[]
    lastFruitSpawn: number
    lastMouseX: number
    lastMouseY: number
    streak: number[]
    animationId: number | null
  } | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 如果游戏结束，只绘制游戏结束画面，不运行游戏循环
    if (gameOver) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    canvas.width = 800
    canvas.height = 600

    // 初始化游戏状态
    if (!gameStateRef.current) {
      gameStateRef.current = {
        fruits: [],
        slices: [],
        lastFruitSpawn: 0,
        lastMouseX: 0,
        lastMouseY: 0,
        streak: [],
        animationId: null
      }
    }

    const gameState = gameStateRef.current
    
    // 水果类型和图标
    const fruitTypes = [
      { type: 'apple', icon: '🍎', color: '#FF6B6B', points: 10 },
      { type: 'orange', icon: '🍊', color: '#FF8E53', points: 15 },
      { type: 'banana', icon: '🍌', color: '#FFD93D', points: 20 },
      { type: 'watermelon', icon: '🍉', color: '#6BCB77', points: 25 },
      { type: 'pineapple', icon: '🍍', color: '#FFD93D', points: 30 },
      { type: 'bomb', icon: '💣', color: '#333', points: -50 }
    ]

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#87CEEB')
      gradient.addColorStop(1, '#4682B4')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制水果
      gameState.fruits.forEach(fruit => {
        const fruitData = fruitTypes.find(f => f.type === fruit.type) || fruitTypes[0]
        
        // 保存上下文
        ctx.save()
        
        // 移动到水果位置并旋转
        ctx.translate(fruit.x, fruit.y)
        ctx.rotate(fruit.rotation)
        
        // 绘制阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.beginPath()
        ctx.ellipse(0, 25, 22, 8, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // 绘制水果背景圆
        ctx.fillStyle = fruitData.color
        ctx.beginPath()
        ctx.arc(0, 0, 25, 0, Math.PI * 2)
        ctx.fill()
        
        // 绘制水果图标
        ctx.font = '30px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(fruitData.icon, 0, 0)
        
        // 恢复上下文
        ctx.restore()
      })

      // 绘制切片效果（粒子）
      gameState.slices.forEach(slice => {
        ctx.fillStyle = `rgba(255, 107, 107, ${slice.life})`
        ctx.beginPath()
        ctx.arc(slice.x, slice.y, slice.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // 绘制鼠标轨迹（刀光效果）
      if (gameState.lastMouseX && gameState.lastMouseY) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(gameState.lastMouseX, gameState.lastMouseY)
        ctx.lineTo(gameState.lastMouseX, gameState.lastMouseY)
        ctx.stroke()
      }
    }

    const update = () => {
      if (isPaused) return

      // 生成水果（根据分数调整难度）
      gameState.lastFruitSpawn++
      const spawnRate = Math.max(30, 60 - Math.floor(score / 100)) // 分数越高，生成越快
      const bombChance = Math.min(0.15, 0.05 + Math.floor(score / 200) * 0.01) // 分数越高，炸弹越多
      
      if (gameState.lastFruitSpawn > spawnRate) {
        const fruitType = Math.random() < bombChance 
          ? 'bomb' 
          : fruitTypes[Math.floor(Math.random() * (fruitTypes.length - 1))].type
        
        gameState.fruits.push({
          x: Math.random() * (canvas.width - 100) + 50,
          y: canvas.height + 30,
          vx: (Math.random() - 0.5) * 3,
          vy: -6 - Math.random() * 4,
          type: fruitType,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1
        })
        gameState.lastFruitSpawn = 0
      }

      // 更新水果位置
      gameState.fruits = gameState.fruits.map(fruit => ({
        ...fruit,
        x: fruit.x + fruit.vx,
        y: fruit.y + fruit.vy,
        vy: fruit.vy + 0.15, // 重力
        rotation: fruit.rotation + fruit.rotationSpeed
      })).filter(fruit => {
        if (fruit.y > canvas.height + 50) {
          if (fruit.type !== 'bomb') {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setGameOver(true)
                if (gameState.animationId) {
                  cancelAnimationFrame(gameState.animationId)
                  gameState.animationId = null
                }
              }
              return newLives
            })
            // 重置连击
            setCombo(0)
          }
          return false
        }
        return true
      })

      // 更新切片粒子
      gameState.slices = gameState.slices.map(slice => ({
        ...slice,
        x: slice.x + slice.vx,
        y: slice.y + slice.vy,
        vy: slice.vy + 0.1, // 重力
        life: slice.life - 0.015
      })).filter(slice => slice.life > 0)
    }

    const gameLoop = () => {
      if (gameOver || isPaused) {
        if (gameState.animationId) {
          cancelAnimationFrame(gameState.animationId)
          gameState.animationId = null
        }
        return
      }
      update()
      draw()
      gameState.animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    // 处理鼠标/触摸移动
    const handleMove = (x: number, y: number) => {
      if (isPaused || gameOver) return
      
      const rect = canvas.getBoundingClientRect()
      const canvasX = x - rect.left
      const canvasY = y - rect.top
      
      // 记录鼠标位置用于绘制轨迹
      gameState.lastMouseX = canvasX
      gameState.lastMouseY = canvasY

      // 检测切割
      gameState.fruits = gameState.fruits.filter(fruit => {
        const dist = Math.sqrt((fruit.x - canvasX) ** 2 + (fruit.y - canvasY) ** 2)
        if (dist < 35) {
          if (fruit.type === 'bomb') {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setGameOver(true)
                if (gameState.animationId) {
                  cancelAnimationFrame(gameState.animationId)
                  gameState.animationId = null
                }
              }
              return newLives
            })
            // 切到炸弹，重置连击
            setCombo(0)
          } else {
            const fruitData = fruitTypes.find(f => f.type === fruit.type) || fruitTypes[0]
            const basePoints = fruitData.points
            const comboMultiplier = Math.min(3, 1 + combo * 0.1) // 连击加成，最多3倍
            const points = Math.floor(basePoints * comboMultiplier)
            
            setScore(prev => prev + points)
            setCombo(prev => {
              const newCombo = prev + 1
              if (newCombo > maxCombo) {
                setMaxCombo(newCombo)
              }
              // 重置连击倒计时
              if (comboTimeoutRef.current) {
                clearTimeout(comboTimeoutRef.current)
              }
              comboTimeoutRef.current = setTimeout(() => {
                setCombo(0)
              }, 2000) // 2秒内没有切到水果，连击重置
              return newCombo
            })
            
            // 创建切片粒子效果
            for (let i = 0; i < 8; i++) {
              gameState.slices.push({
                x: fruit.x,
                y: fruit.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                life: 1,
                size: Math.random() * 4 + 3
              })
            }
          }
          return false
        }
        return true
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchstart', handleTouchMove, { passive: false })

    return () => {
      if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId)
        gameState.animationId = null
      }
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchstart', handleTouchMove)
    }
  }, [gameOver, isPaused, score, combo, maxCombo])

  const restart = () => {
    setScore(0)
    setLives(3)
    setGameOver(false)
    setIsPaused(false)
    setCombo(0)
    setMaxCombo(0)
    // 清除连击倒计时
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current)
      comboTimeoutRef.current = null
    }
    // 重置游戏状态
    if (gameStateRef.current) {
      gameStateRef.current.fruits = []
      gameStateRef.current.slices = []
      gameStateRef.current.lastFruitSpawn = 0
      gameStateRef.current.lastMouseX = 0
      gameStateRef.current.lastMouseY = 0
      gameStateRef.current.streak = []
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId)
        gameStateRef.current.animationId = null
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
      background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
      color: 'white'
    }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link href="/" style={{
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          textDecoration: 'none',
          color: 'white',
          fontWeight: 'bold',
        }}>
          🏠 返回大厅
        </Link>
        <button onClick={() => setIsPaused(!isPaused)} style={{
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          color: 'white',
          fontWeight: 'bold',
        }}>
          {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
        </button>
      </div>

      <h1 style={{ fontSize: '36px', textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>🍉 水果忍者</h1>
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '10px 20px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontWeight: 'bold' }}>分数: {score}</div>
        <div style={{ fontWeight: 'bold' }}>❤️ 生命: {lives}</div>
        {combo > 0 && (
          <div style={{ 
            fontWeight: 'bold',
            color: '#FFD93D',
            textShadow: '0 0 10px rgba(255, 217, 61, 0.8)',
          }}>
            🔥 连击: {combo}x
          </div>
        )}
        {maxCombo > 0 && (
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            最高连击: {maxCombo}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: '3px solid #fff',
          borderRadius: '12px',
          cursor: 'crosshair',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
        }}
      />

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
        }}>
          <h2 style={{ color: 'white', fontSize: '48px' }}>游戏结束！</h2>
          <p style={{ color: 'white', fontSize: '24px' }}>最终分数: {score}</p>
          <button onClick={restart} style={{
            padding: '15px 30px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            重新开始
          </button>
        </div>
      )}

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>移动鼠标或手指切水果，小心不要切到炸弹💣！</p>
        <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
          🍎 苹果(10分) 🍊 橙子(15分) 🍌 香蕉(20分) 🍉 西瓜(25分) 🍍 菠萝(30分)
        </p>
        <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
          连击可以获得额外分数加成！
        </p>
      </div>
    </main>
  )
}
