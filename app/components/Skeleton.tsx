'use client'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', className }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '25px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
    }}>
      <div style={{ margin: '0 auto 15px', width: '60px', height: '60px' }}>
        <Skeleton width={60} height={60} borderRadius="50%" />
      </div>
      <div style={{ margin: '0 auto 10px', width: '80%' }}>
        <Skeleton width="100%" height={24} />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <Skeleton width="100%" height={16} />
      </div>
      <div style={{ margin: '0 auto', width: '70%' }}>
        <Skeleton width="100%" height={16} />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' }}>
        <Skeleton width={60} height={24} borderRadius="8px" />
        <Skeleton width={60} height={24} borderRadius="8px" />
      </div>
    </div>
  )
}

export function SkeletonGameList() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
