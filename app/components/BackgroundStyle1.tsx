'use client'

import { useEffect, useRef } from 'react'

// 风格1：经典紫色渐变 + 金币粒子
export default function BackgroundStyle1() {
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

    const particles: Array<{
      x: number
      y: number
      radius: number
      speedX: number
      speedY: number
      opacity: number
      color: string
    }> = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`,
      })
    }

    const goldIcons: Array<{
      x: number
      y: number
      size: number
      rotation: number
      rotationSpeed: number
      speedY: number
      opacity: number
    }> = []

    for (let i = 0; i < 8; i++) {
      goldIcons.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 15,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        speedY: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.3 + 0.1,
      })
    }

    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(particle => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
      })

      goldIcons.forEach(icon => {
        icon.y += icon.speedY
        icon.rotation += icon.rotationSpeed

        if (icon.y > canvas.height + icon.size) {
          icon.y = -icon.size
          icon.x = Math.random() * canvas.width
        }

        ctx.save()
        ctx.translate(icon.x, icon.y)
        ctx.rotate(icon.rotation)
        ctx.globalAlpha = icon.opacity
        ctx.font = `${icon.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🪙', 0, 0)
        ctx.restore()
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
