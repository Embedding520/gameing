'use client'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  text?: string
}

export default function LoadingSpinner({ size = 'medium', color = '#667eea', text }: LoadingSpinnerProps) {
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '64px',
  }

  const spinnerSize = sizeMap[size]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `4px solid ${color}20`,
          borderTop: `4px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <div style={{
          color: color,
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {text}
        </div>
      )}
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        textAlign: 'center',
      }}>
        <LoadingSpinner size="large" color="#ffffff" />
        <div style={{
          marginTop: '20px',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
        }}>
          加载中...
        </div>
      </div>
    </div>
  )
}
