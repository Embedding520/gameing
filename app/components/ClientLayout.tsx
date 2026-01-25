'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // 简化过渡效果以提升性能
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div
      style={{
        opacity: isTransitioning ? 0.8 : 1,
        transition: 'opacity 0.15s ease',
        willChange: 'opacity', // 优化动画性能
      }}
    >
      {children}
    </div>
  )
}
