'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TowerDefenseGame() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(100)
  const [lives, setLives] = useState(10)
  const [wave, setWave] = useState(1)
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
      ctx.fillStyle = '#2d5016'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    canvas.width = 800
    canvas.height = 600

    // 游戏状态
    let towers: Array<{ x: number; y: number; range: number; damage: number }> = []
    let enemies: Array<{ x: number; y: number; health: number; speed: number; pathIndex: number }> = []
    let bullets: Array<{ x: number; y: number; targetX: number; targetY: number; damage: number }> = []
    
    // 路径点
    const path = [
      { x: 0, y: 300 },
      { x: 200, y: 300 },
      { x: 200, y: 150 },
      { x: 400, y: 150 },
      { x: 400, y: 450 },
      { x: 600, y: 450 },
      { x: 600, y: 250 },
      { x: 800, y: 250 },
    ]

    let enemySpawnTimer = 0
    let waveEnemiesSpawned = 0
    const enemiesPerWave = 10

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景
      ctx.fillStyle = '#2d5016'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制路径
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 40
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y)
      }
      ctx.stroke()

      // 绘制塔
      towers.forEach(tower => {
        ctx.fillStyle = '#4a90e2'
        ctx.beginPath()
        ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // 绘制敌人
      enemies.forEach(enemy => {
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2)
        ctx.fill()
        // 血条
        ctx.fillStyle = '#ff0000'
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 5)
        ctx.fillStyle = '#00ff00'
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * (enemy.health / 100), 5)
      })

      // 绘制子弹
      bullets.forEach(bullet => {
        ctx.fillStyle = '#ffff00'
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    const update = () => {
      if (isPaused) return

      // 生成敌人
      enemySpawnTimer++
      if (enemySpawnTimer > 60 && waveEnemiesSpawned < enemiesPerWave) {
        enemies.push({
          x: path[0].x,
          y: path[0].y,
          health: 100,
          speed: 1,
          pathIndex: 0
        })
        waveEnemiesSpawned++
        enemySpawnTimer = 0
      }

      // 更新敌人
      enemies = enemies.map(enemy => {
        if (enemy.pathIndex >= path.length - 1) {
          setLives(prev => prev - 1)
          return null
        }
        const nextPoint = path[enemy.pathIndex + 1]
        const dx = nextPoint.x - enemy.x
        const dy = nextPoint.y - enemy.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < enemy.speed) {
          return { ...enemy, pathIndex: enemy.pathIndex + 1, x: nextPoint.x, y: nextPoint.y }
        }
        return {
          ...enemy,
          x: enemy.x + (dx / dist) * enemy.speed,
          y: enemy.y + (dy / dist) * enemy.speed
        }
      }).filter(e => e !== null) as typeof enemies

      // 塔攻击
      towers.forEach(tower => {
        const target = enemies.find(e => {
          const dist = Math.sqrt((e.x - tower.x) ** 2 + (e.y - tower.y) ** 2)
          return dist <= tower.range
        })
        if (target && Math.random() < 0.1) {
          bullets.push({
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            damage: tower.damage
          })
        }
      })

      // 更新子弹
      bullets = bullets.map(bullet => {
        const dx = bullet.targetX - bullet.x
        const dy = bullet.targetY - bullet.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 10) {
          // 击中敌人
          const enemy = enemies.find(e => 
            Math.sqrt((e.x - bullet.targetX) ** 2 + (e.y - bullet.targetY) ** 2) < 20
          )
          if (enemy) {
            enemy.health -= bullet.damage
            if (enemy.health <= 0) {
              setScore(prev => prev + 10)
              setCoins(prev => prev + 5)
            }
          }
          return null
        }
        return {
          ...bullet,
          x: bullet.x + (dx / dist) * 10,
          y: bullet.y + (dy / dist) * 10
        }
      }).filter(b => b !== null) as typeof bullets

      // 移除死亡的敌人
      enemies = enemies.filter(e => e.health > 0)

      if (lives <= 0) {
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

    const handleCanvasClick = (e: MouseEvent) => {
      if (isPaused || gameOver) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      if (coins >= 50) {
        towers.push({ x, y, range: 100, damage: 25 })
        setCoins(prev => prev - 50)
      }
    }

    canvas.addEventListener('click', handleCanvasClick)
    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [gameOver, isPaused, lives, coins])

  const restart = () => {
    setScore(0)
    setCoins(100)
    setLives(10)
    setWave(1)
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
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div>分数: {score}</div>
        <div>金币: {coins}</div>
        <div>生命: {lives}</div>
        <div>波次: {wave}</div>
      </div>

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
        <p>点击地图放置防御塔（50金币），阻止敌人到达终点！</p>
      </div>
    </main>
  )
}
