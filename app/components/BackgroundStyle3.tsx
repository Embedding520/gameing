'use client'

import { useEffect, useRef } from 'react'

// 风格3：海洋风格 - 蓝色渐变 + 气泡
export default function BackgroundStyle3() {
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

    // 创建气泡
    const bubbles: Array<{
      x: number
      y: number
      radius: number
      speed: number
      opacity: number
    }> = []

    for (let i = 0; i < 30; i++) {
      bubbles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        radius: Math.random() * 30 + 10,
        speed: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      })
    }

    // 创建水波纹
    const ripples: Array<{
      x: number
      y: number
      radius: number
      maxRadius: number
      speed: number
      opacity: number
    }> = []

    for (let i = 0; i < 5; i++) {
      ripples.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0,
        maxRadius: Math.random() * 100 + 50,
        speed: Math.random() * 0.5 + 0.3,
        opacity: Math.random() * 0.2 + 0.1,
      })
    }

    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制气泡
      bubbles.forEach(bubble => {
        bubble.y -= bubble.speed

        if (bubble.y < -bubble.radius) {
          bubble.y = canvas.height + bubble.radius
          bubble.x = Math.random() * canvas.width
        }

        // 气泡主体
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          0,
          bubble.x,
          bubble.y,
          bubble.radius
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity * 0.8})`)
        gradient.addColorStop(1, `rgba(173, 216, 230, ${bubble.opacity * 0.3})`)

        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // 气泡高光
        ctx.beginPath()
        ctx.arc(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          bubble.radius * 0.3,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.6})`
        ctx.fill()
      })

      // 绘制水波纹
      ripples.forEach(ripple => {
        ripple.radius += ripple.speed
        ripple.opacity -= 0.005

        if (ripple.radius > ripple.maxRadius || ripple.opacity <= 0) {
          ripple.radius = 0
          ripple.opacity = Math.random() * 0.2 + 0.1
          ripple.x = Math.random() * canvas.width
          ripple.y = Math.random() * canvas.height
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
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
