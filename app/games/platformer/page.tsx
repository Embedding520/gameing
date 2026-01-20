'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function PlatformerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<{
    player: { x: number; y: number; width: number; height: number; velocityY: number; onGround: boolean }
    platforms: Array<{ x: number; y: number; width: number; height: number }>
    coins: Array<{ x: number; y: number; collected: boolean }>
    keys: { left: boolean; right: boolean; up: boolean }
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
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    canvas.width = 600
    canvas.height = 400

    // 初始化或重置游戏状态
    if (!gameStateRef.current) {
      gameStateRef.current = {
        player: { x: 50, y: 300, width: 30, height: 30, velocityY: 0, onGround: false },
        platforms: [
          { x: 0, y: 350, width: 200, height: 50 },
          { x: 250, y: 300, width: 150, height: 50 },
          { x: 450, y: 250, width: 150, height: 50 },
        ],
        coins: [
          { x: 100, y: 300, collected: false },
          { x: 300, y: 250, collected: false },
          { x: 500, y: 200, collected: false },
        ],
        keys: { left: false, right: false, up: false }
      }
    } else {
      // 重置状态
      gameStateRef.current.player = { x: 50, y: 300, width: 30, height: 30, velocityY: 0, onGround: false }
      gameStateRef.current.coins = [
        { x: 100, y: 300, collected: false },
        { x: 300, y: 250, collected: false },
        { x: 500, y: 200, collected: false },
      ]
      gameStateRef.current.keys = { left: false, right: false, up: false }
    }

    const draw = () => {
      if (!gameStateRef.current) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 平台
      ctx.fillStyle = '#8B4513'
      gameStateRef.current.platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      })

      // 金币
      ctx.fillStyle = '#FFD700'
      gameStateRef.current.coins.forEach(coin => {
        if (!coin.collected) {
          ctx.beginPath()
          ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // 玩家
      ctx.fillStyle = '#4CAF50'
      const player = gameStateRef.current.player
      ctx.fillRect(player.x, player.y, player.width, player.height)
    }

    const update = () => {
      if (isPaused || !gameStateRef.current) return

      const state = gameStateRef.current
      const player = state.player

      // 处理键盘输入
      if (state.keys.left) {
        player.x -= 5
      }
      if (state.keys.right) {
        player.x += 5
      }
      if (state.keys.up && player.onGround) {
        player.velocityY = -10
        state.keys.up = false // 防止连续跳跃
      }

      // 重力
      player.velocityY += 0.5
      player.y += player.velocityY

      // 平台碰撞
      player.onGround = false
      state.platforms.forEach(platform => {
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height) {
          player.y = platform.y - player.height
          player.velocityY = 0
          player.onGround = true
        }
      })

      // 收集金币
      state.coins.forEach(coin => {
        if (!coin.collected &&
            player.x < coin.x + 10 &&
            player.x + player.width > coin.x - 10 &&
            player.y < coin.y + 10 &&
            player.y + player.height > coin.y - 10) {
          coin.collected = true
          setScore(prev => prev + 10)
        }
      })

      // 掉落检测
      if (player.y > canvas.height) {
        setGameOver(true)
      }
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
      if (!gameStateRef.current) return
      if (e.key === 'ArrowLeft') {
        gameStateRef.current.keys.left = true
        e.preventDefault()
      }
      if (e.key === 'ArrowRight') {
        gameStateRef.current.keys.right = true
        e.preventDefault()
      }
      if (e.key === 'ArrowUp') {
        gameStateRef.current.keys.up = true
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!gameStateRef.current) return
      if (e.key === 'ArrowLeft') {
        gameStateRef.current.keys.left = false
      }
      if (e.key === 'ArrowRight') {
        gameStateRef.current.keys.right = false
      }
      if (e.key === 'ArrowUp') {
        gameStateRef.current.keys.up = false
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
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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

      <h1 style={{ fontSize: '36px' }}>🦘 平台跳跃</h1>
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
        <p>← → 移动，↑ 跳跃，收集所有金币</p>
      </div>
    </main>
  )
}
