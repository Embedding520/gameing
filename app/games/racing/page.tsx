'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function RacingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<{
    carX: number
    obstacles: Array<{ x: number; y: number; width: number }>
    speed: number
    keys: { left: boolean; right: boolean }
  } | null>(null)
  const [score, setScore] = useState(0)
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
      ctx.fillStyle = '#333'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    canvas.width = 400
    canvas.height = 600

    // 初始化或重置游戏状态
    if (!gameStateRef.current) {
      gameStateRef.current = {
        carX: canvas.width / 2 - 25,
        obstacles: [],
        speed: 2,
        keys: { left: false, right: false }
      }
    } else {
      // 重置状态
      gameStateRef.current.carX = canvas.width / 2 - 25
      gameStateRef.current.obstacles = []
      gameStateRef.current.keys = { left: false, right: false }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 道路
      ctx.fillStyle = '#333'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 道路中线
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 4
      ctx.setLineDash([20, 20])
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2, 0)
      ctx.lineTo(canvas.width / 2, canvas.height)
      ctx.stroke()

      // 障碍物
      ctx.fillStyle = '#ff0000'
      gameStateRef.current.obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, 40)
      })

      // 玩家车辆
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(gameStateRef.current.carX, canvas.height - 80, 50, 60)
    }

    const update = () => {
      if (isPaused) return

      const state = gameStateRef.current

      // 处理键盘输入
      if (state.keys.left && state.carX > 0) {
        state.carX -= 5
      }
      if (state.keys.right && state.carX < canvas.width - 50) {
        state.carX += 5
      }

      // 生成障碍物
      if (Math.random() < 0.02) {
        state.obstacles.push({
          x: Math.random() * (canvas.width - 50),
          y: 0,
          width: 50
        })
      }

      // 移动障碍物
      state.obstacles = state.obstacles.map(obs => ({
        ...obs,
        y: obs.y + state.speed
      })).filter(obs => obs.y < canvas.height)

      // 碰撞检测
      state.obstacles.forEach(obs => {
        if (obs.y + 40 > canvas.height - 80 &&
            obs.x < state.carX + 50 &&
            obs.x + obs.width > state.carX) {
          setGameOver(true)
        }
        if (obs.y > canvas.height) {
          setScore(prev => prev + 1)
        }
      })
    }

    let animationId: number
    const gameLoop = () => {
      if (gameOver || isPaused) return
      update()
      draw()
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    // 键盘事件处理
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        gameStateRef.current.keys.left = true
        e.preventDefault()
      }
      if (e.key === 'ArrowRight') {
        gameStateRef.current.keys.right = true
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        gameStateRef.current.keys.left = false
      }
      if (e.key === 'ArrowRight') {
        gameStateRef.current.keys.right = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameOver, isPaused, score])

  const restart = () => {
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    // 重置游戏状态
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const gameState = {
        carX: canvas.width / 2 - 25,
        obstacles: [] as Array<{ x: number; y: number; width: number }>,
        speed: 2,
        keys: { left: false, right: false }
      }
      // 需要重新设置 ref，但由于 ref 在 useEffect 中，这里只是触发重新渲染
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
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
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

      <h1 style={{ fontSize: '36px' }}>🏎️ 赛车</h1>
      <div>分数: {score}</div>

      <canvas
        ref={canvasRef}
        style={{
          border: '3px solid #fff',
          borderRadius: '12px',
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
        <p>使用 ← → 方向键控制车辆，躲避障碍物</p>
      </div>
    </main>
  )
}
