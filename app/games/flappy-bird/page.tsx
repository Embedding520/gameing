'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FlappyBirdGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const gameStateRef = useRef<{
    bird: { x: number; y: number; width: number; height: number; velocity: number }
    pipes: Array<{ x: number; top: number; bottom: number; width: number; passed?: boolean }>
    frameCount: number
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

    canvas.width = 400
    canvas.height = 600

    // 初始化游戏状态
    if (!gameStateRef.current) {
      gameStateRef.current = {
        bird: { x: 50, y: 250, width: 30, height: 30, velocity: 0 },
        pipes: [],
        frameCount: 0,
        animationId: null
      }
    }

    const gameState = gameStateRef.current
    const pipeGap = 150
    const pipeWidth = 60

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 地面
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50)

      // 管道
      ctx.fillStyle = '#228B22'
      gameState.pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.top)
        ctx.fillRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom)
      })

      // 小鸟
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(gameState.bird.x, gameState.bird.y, gameState.bird.width, gameState.bird.height)

      // 分数
      ctx.fillStyle = '#000'
      ctx.font = '24px Arial'
      ctx.fillText(`分数: ${score}`, 10, 30)
    }

    const update = () => {
      if (isPaused) return

      gameState.frameCount++
      // 进一步降低重力加速度，让下降更慢
      gameState.bird.velocity += 0.15
      gameState.bird.y += gameState.bird.velocity

      // 生成管道
      if (gameState.frameCount % 150 === 0) {
        const topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50
        gameState.pipes.push({
          x: canvas.width,
          top: topHeight,
          bottom: topHeight + pipeGap,
          width: pipeWidth
        })
      }

      // 移动管道
      gameState.pipes = gameState.pipes
        .map(pipe => ({ ...pipe, x: pipe.x - 1.2 }))
        .filter(pipe => pipe.x + pipe.width > 0)

      // 碰撞检测
      if (gameState.bird.y + gameState.bird.height > canvas.height - 50 || gameState.bird.y < 0) {
        setGameOver(true)
        return
      }

      gameState.pipes.forEach((pipe) => {
        if (gameState.bird.x < pipe.x + pipe.width &&
            gameState.bird.x + gameState.bird.width > pipe.x &&
            (gameState.bird.y < pipe.top || gameState.bird.y + gameState.bird.height > pipe.bottom)) {
          setGameOver(true)
        }
        if (pipe.x + pipe.width < gameState.bird.x && !pipe.passed) {
          setScore((prev: number) => prev + 1)
          pipe.passed = true
        }
      })
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

    return () => {
      if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId)
        gameState.animationId = null
      }
    }
  }, [gameOver, isPaused, score])

  // 处理点击事件 - 使用独立的 useEffect 确保事件监听器正确绑定
  useEffect(() => {
    if (!canvasRef.current) return
    if (gameOver) return

    const canvas = canvasRef.current

    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      if (!gameStateRef.current || gameOver || isPaused) return
      
      // 点击时让小鸟向上飞
      gameStateRef.current.bird.velocity = -5
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (!gameStateRef.current || gameOver || isPaused) return
        
        // 空格键也让小鸟向上飞
        gameStateRef.current.bird.velocity = -5
      }
    }

    canvas.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      canvas.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [gameOver, isPaused])

  const restart = () => {
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    // 重置游戏状态
    if (gameStateRef.current) {
      gameStateRef.current.bird = { x: 50, y: 250, width: 30, height: 30, velocity: 0 }
      gameStateRef.current.pipes = []
      gameStateRef.current.frameCount = 0
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
      background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
    }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link href="/" style={{
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          textDecoration: 'none',
          color: '#333',
          fontWeight: 'bold',
        }}>
          🏠 返回大厅
        </Link>
        <button onClick={() => setIsPaused(!isPaused)} style={{
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}>
          {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          border: '3px solid #333',
          borderRadius: '12px',
          background: '#87CEEB',
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
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击屏幕让小鸟向上飞，穿越管道获得分数！</p>
      </div>
    </main>
  )
}
