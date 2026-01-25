'use client'

import { useEffect, useRef } from 'react'

// 风格5：霓虹风格 - 赛博朋克 + 霓虹线条
export default function BackgroundStyle5() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 创建霓虹线条
    const lines: Array<{
      x1: number
      y1: number
      x2: number
      y2: number
      speed: number
      color: string
      opacity: number
      pulsePhase: number
    }> = []

    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#0080ff']
    
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      lines.push({
        x1: x,
        y1: y,
        x2: x + (Math.random() - 0.5) * 200,
        y2: y + (Math.random() - 0.5) * 200,
        speed: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }

    // 创建粒子
    const particles: Array<{
      x: number
      y: number
      radius: number
      speedX: number
      speedY: number
      color: string
      opacity: number
    }> = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.8 + 0.2,
      })
    }

    let animationFrameId: number
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.016

      // 绘制霓虹线条
      lines.forEach(line => {
        line.pulsePhase += 0.05
        const opacity = (Math.sin(line.pulsePhase) + 1) / 2 * line.opacity

        // 移动线条
        line.x1 += (Math.random() - 0.5) * line.speed
        line.y1 += (Math.random() - 0.5) * line.speed
        line.x2 += (Math.random() - 0.5) * line.speed
        line.y2 += (Math.random() - 0.5) * line.speed

        // 边界检查
        if (line.x1 < 0 || line.x1 > canvas.width) line.x1 = Math.random() * canvas.width
        if (line.y1 < 0 || line.y1 > canvas.height) line.y1 = Math.random() * canvas.height
        if (line.x2 < 0 || line.x2 > canvas.width) line.x2 = Math.random() * canvas.width
        if (line.y2 < 0 || line.y2 > canvas.height) line.y2 = Math.random() * canvas.height

        ctx.strokeStyle = line.color
        ctx.globalAlpha = opacity
        ctx.lineWidth = 2
        ctx.shadowBlur = 10
        ctx.shadowColor = line.color
        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.stroke()
      })

      // 绘制粒子
      particles.forEach(particle => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

        ctx.globalAlpha = particle.opacity
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 5
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
