'use client'

import LoadingSpinner from './LoadingSpinner'

interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

export default function LoadingButton({
  loading = false,
  children,
  onClick,
  disabled,
  style,
  className,
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{
        ...style,
        opacity: loading ? 0.7 : 1,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      {loading && (
        <div style={{
          width: '16px',
          height: '16px',
          border: `2px solid ${style?.color || 'white'}40`,
          borderTop: `2px solid ${style?.color || 'white'}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      )}
      {children}
    </button>
  )
}
