'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function FruitNinjaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

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

    canvas.width = 600
    canvas.height = 400

    let fruits: Array<{ x: number; y: number; vx: number; vy: number; type: string }> = []
    let slices: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = []
    let lastFruitSpawn = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 水果
      fruits.forEach(fruit => {
        ctx.fillStyle = fruit.type === 'bomb' ? '#000' : '#FF6B6B'
        ctx.beginPath()
        ctx.arc(fruit.x, fruit.y, 20, 0, Math.PI * 2)
        ctx.fill()
        if (fruit.type !== 'bomb') {
          ctx.fillStyle = '#fff'
          ctx.font = '20px Arial'
          ctx.fillText('🍎', fruit.x - 10, fruit.y + 5)
        } else {
          ctx.fillStyle = '#fff'
          ctx.font = '20px Arial'
          ctx.fillText('💣', fruit.x - 10, fruit.y + 5)
        }
      })

      // 切片效果
      slices.forEach(slice => {
        ctx.fillStyle = `rgba(255, 107, 107, ${slice.life})`
        ctx.beginPath()
        ctx.arc(slice.x, slice.y, 5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    const update = () => {
      if (isPaused) return

      lastFruitSpawn++
      if (lastFruitSpawn > 60) {
        fruits.push({
          x: Math.random() * canvas.width,
          y: canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: -5 - Math.random() * 3,
          type: Math.random() < 0.1 ? 'bomb' : 'fruit'
        })
        lastFruitSpawn = 0
      }

      fruits = fruits.map(fruit => ({
        ...fruit,
        x: fruit.x + fruit.vx,
        y: fruit.y + fruit.vy,
        vy: fruit.vy + 0.2
      })).filter(fruit => {
        if (fruit.y > canvas.height) {
          if (fruit.type === 'fruit') {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setGameOver(true)
              }
              return newLives
            })
          }
          return false
        }
        return true
      })

      slices = slices.map(slice => ({
        ...slice,
        x: slice.x + slice.vx,
        y: slice.y + slice.vy,
        life: slice.life - 0.02
      })).filter(slice => slice.life > 0)
    }

    let animationId: number
    const gameLoop = () => {
      if (gameOver || isPaused) return
      update()
      draw()
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPaused || gameOver) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      fruits = fruits.filter(fruit => {
        const dist = Math.sqrt((fruit.x - x) ** 2 + (fruit.y - y) ** 2)
        if (dist < 30) {
          if (fruit.type === 'bomb') {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setGameOver(true)
              }
              return newLives
            })
          } else {
            setScore(prev => prev + 10)
            for (let i = 0; i < 5; i++) {
              slices.push({
                x: fruit.x,
                y: fruit.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1
              })
            }
          }
          return false
        }
        return true
      })
    }

    canvas.addEventListener('mousemove', handleMouseMove as any)
    return () => canvas.removeEventListener('mousemove', handleMouseMove as any)
  }, [gameOver, isPaused, lives, score])

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

      <h1 style={{ fontSize: '36px' }}>🍉 水果忍者</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>分数: {score}</div>
        <div>生命: {lives}</div>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: '3px solid #fff',
          borderRadius: '12px',
          cursor: 'crosshair',
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
        <p>移动鼠标切水果，小心不要切到炸弹！</p>
      </div>
    </main>
  )
}
