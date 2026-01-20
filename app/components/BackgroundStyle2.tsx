'use client'

import { useEffect, useRef } from 'react'

// 风格2：星空风格 - 深色背景 + 闪烁星星
export default function BackgroundStyle2() {
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

    const stars: Array<{
      x: number
      y: number
      radius: number
      opacity: number
      twinkleSpeed: number
      twinklePhase: number
    }> = []

    // 创建星星
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }

    // 创建流星
    const meteors: Array<{
      x: number
      y: number
      length: number
      speed: number
      angle: number
    }> = []

    for (let i = 0; i < 3; i++) {
      meteors.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        length: Math.random() * 50 + 30,
        speed: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 0.3 + Math.PI * 0.2,
      })
    }

    let animationFrameId: number
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.016

      // 绘制闪烁的星星
      stars.forEach(star => {
        star.twinklePhase += star.twinkleSpeed
        const opacity = (Math.sin(star.twinklePhase) + 1) / 2 * star.opacity

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.fill()

        // 添加光晕效果
        if (opacity > 0.5) {
          const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 3)
          gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`)
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = gradient
          ctx.fillRect(star.x - star.radius * 3, star.y - star.radius * 3, star.radius * 6, star.radius * 6)
        }
      })

      // 绘制流星
      meteors.forEach(meteor => {
        meteor.x += Math.cos(meteor.angle) * meteor.speed
        meteor.y += Math.sin(meteor.angle) * meteor.speed

        if (meteor.x > canvas.width + 50 || meteor.y > canvas.height + 50) {
          meteor.x = Math.random() * canvas.width * 0.3 - 50
          meteor.y = Math.random() * canvas.height * 0.3 - 50
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(meteor.x, meteor.y)
        ctx.lineTo(
          meteor.x - Math.cos(meteor.angle) * meteor.length,
          meteor.y - Math.sin(meteor.angle) * meteor.length
        )
        ctx.stroke()

        // 流星尾部渐变
        const gradient = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - Math.cos(meteor.angle) * meteor.length,
          meteor.y - Math.sin(meteor.angle) * meteor.length
        )
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.strokeStyle = gradient
        ctx.stroke()
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
