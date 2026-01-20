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

    let bird = { x: 50, y: 250, width: 30, height: 30, velocity: 0 }
    let pipes: Array<{ x: number; top: number; bottom: number; width: number }> = []
    let pipeGap = 150
    let pipeWidth = 60
    let frameCount = 0
    let animationId: number

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
      pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.top)
        ctx.fillRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom)
      })

      // 小鸟
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(bird.x, bird.y, bird.width, bird.height)

      // 分数
      ctx.fillStyle = '#000'
      ctx.font = '24px Arial'
      ctx.fillText(`分数: ${score}`, 10, 30)
    }

    const update = () => {
      if (isPaused) return

      frameCount++
      bird.velocity += 0.5
      bird.y += bird.velocity

      // 生成管道
      if (frameCount % 100 === 0) {
        const topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50
        pipes.push({
          x: canvas.width,
          top: topHeight,
          bottom: topHeight + pipeGap,
          width: pipeWidth
        })
      }

      // 移动管道
      pipes = pipes.map(pipe => ({ ...pipe, x: pipe.x - 2 })).filter(pipe => pipe.x + pipe.width > 0)

      // 碰撞检测
      if (bird.y + bird.height > canvas.height - 50 || bird.y < 0) {
        setGameOver(true)
        return
      }

      pipes.forEach((pipe, index) => {
        if (bird.x < pipe.x + pipe.width &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.top || bird.y + bird.height > pipe.bottom)) {
          setGameOver(true)
        }
        const pipeWithPassed = pipe as any
        if (pipe.x + pipe.width < bird.x && !pipeWithPassed.passed) {
          setScore((prev: number) => prev + 1)
          pipeWithPassed.passed = true
        }
      })
    }

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

    const handleClick = () => {
      if (!gameOver) {
        bird.velocity = -8
      }
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [gameOver, isPaused, score])

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
