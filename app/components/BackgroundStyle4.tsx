'use client'

import { useEffect, useRef } from 'react'

// 风格4：森林风格 - 绿色自然 + 树叶飘落
export default function BackgroundStyle4() {
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

    // 创建树叶
    const leaves: Array<{
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      rotation: number
      rotationSpeed: number
      opacity: number
    }> = []

    for (let i = 0; i < 40; i++) {
      leaves.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 15 + 10,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: Math.random() * 0.8 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        opacity: Math.random() * 0.5 + 0.3,
      })
    }

    // 创建光点（阳光透过树叶）
    const lightPoints: Array<{
      x: number
      y: number
      radius: number
      opacity: number
      pulseSpeed: number
      pulsePhase: number
    }> = []

    for (let i = 0; i < 15; i++) {
      lightPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 30 + 20,
        opacity: Math.random() * 0.3 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }

    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制光点
      lightPoints.forEach(light => {
        light.pulsePhase += light.pulseSpeed
        const opacity = (Math.sin(light.pulsePhase) + 1) / 2 * light.opacity

        const gradient = ctx.createRadialGradient(
          light.x, light.y, 0,
          light.x, light.y, light.radius
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // 绘制树叶
      leaves.forEach(leaf => {
        leaf.x += leaf.speedX
        leaf.y += leaf.speedY
        leaf.rotation += leaf.rotationSpeed

        if (leaf.x < -leaf.size) leaf.x = canvas.width + leaf.size
        if (leaf.x > canvas.width + leaf.size) leaf.x = -leaf.size
        if (leaf.y > canvas.height + leaf.size) {
          leaf.y = -leaf.size
          leaf.x = Math.random() * canvas.width
        }

        ctx.save()
        ctx.translate(leaf.x, leaf.y)
        ctx.rotate(leaf.rotation)
        ctx.globalAlpha = leaf.opacity
        ctx.font = `${leaf.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🍃', 0, 0)
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
