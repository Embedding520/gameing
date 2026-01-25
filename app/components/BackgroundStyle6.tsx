'use client'

import { useEffect, useRef } from 'react'

// 风格6：极光风格 - 神秘极光 + 星空
export default function BackgroundStyle6() {
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

    // 创建星星
    const stars: Array<{
      x: number
      y: number
      radius: number
      opacity: number
      twinkleSpeed: number
      twinklePhase: number
    }> = []

    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }

    // 极光参数
    const auroraBands: Array<{
      y: number
      amplitude: number
      frequency: number
      speed: number
      color: string
      opacity: number
    }> = [
      {
        y: canvas.height * 0.2,
        amplitude: 50,
        frequency: 0.01,
        speed: 0.3,
        color: '#00ff88',
        opacity: 0.4,
      },
      {
        y: canvas.height * 0.3,
        amplitude: 80,
        frequency: 0.008,
        speed: 0.2,
        color: '#00ccff',
        opacity: 0.3,
      },
      {
        y: canvas.height * 0.4,
        amplitude: 60,
        frequency: 0.012,
        speed: 0.25,
        color: '#0088ff',
        opacity: 0.35,
      },
    ]

    let animationFrameId: number
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.016

      // 绘制极光
      auroraBands.forEach(band => {
        const gradient = ctx.createLinearGradient(0, band.y - 100, 0, band.y + 100)
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`)
        gradient.addColorStop(0.5, `${band.color}${Math.floor(band.opacity * 255).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(0, band.y)

        for (let x = 0; x <= canvas.width; x += 2) {
          const y = band.y + Math.sin(x * band.frequency + time * band.speed) * band.amplitude
          ctx.lineTo(x, y)
        }

        ctx.lineTo(canvas.width, canvas.height)
        ctx.lineTo(0, canvas.height)
        ctx.closePath()
        ctx.fill()

        // 添加光晕效果
        ctx.shadowBlur = 30
        ctx.shadowColor = band.color
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // 绘制星星
      stars.forEach(star => {
        star.twinklePhase += star.twinkleSpeed
        const opacity = (Math.sin(star.twinklePhase) + 1) / 2 * star.opacity

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.fill()

        // 添加光晕
        if (opacity > 0.5) {
          const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4)
          gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`)
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = gradient
          ctx.fillRect(star.x - star.radius * 4, star.y - star.radius * 4, star.radius * 8, star.radius * 8)
        }
      })

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
