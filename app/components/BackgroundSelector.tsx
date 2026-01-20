'use client'

import { useState, useEffect } from 'react'

type BackgroundStyle = 'style1' | 'style2' | 'style3'

interface BackgroundSelectorProps {
  onStyleChange?: (style: BackgroundStyle) => void
}

export default function BackgroundSelector({ onStyleChange }: BackgroundSelectorProps) {
  const [currentStyle, setCurrentStyle] = useState<BackgroundStyle>('style1')
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    // 从localStorage加载保存的背景风格
    const savedStyle = localStorage.getItem('backgroundStyle') as BackgroundStyle
    if (savedStyle && ['style1', 'style2', 'style3'].includes(savedStyle)) {
      setCurrentStyle(savedStyle)
      if (onStyleChange) {
        onStyleChange(savedStyle)
      }
    }
  }, [onStyleChange])

  const handleStyleChange = (style: BackgroundStyle) => {
    setCurrentStyle(style)
    localStorage.setItem('backgroundStyle', style)
    document.body.setAttribute('data-bg-style', style)
    if (onStyleChange) {
      onStyleChange(style)
    }
  }

  const styles = [
    {
      id: 'style1' as BackgroundStyle,
      name: '经典风格',
      description: '紫色渐变 + 金币粒子',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      icon: '✨',
    },
    {
      id: 'style2' as BackgroundStyle,
      name: '星空风格',
      description: '深色星空 + 闪烁星星',
      gradient: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2d1b4e 100%)',
      icon: '⭐',
    },
    {
      id: 'style3' as BackgroundStyle,
      name: '海洋风格',
      description: '蓝色海洋 + 气泡',
      gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4a90e2 100%)',
      icon: '🌊',
    },
  ]

  return (
    <>
      {/* 背景选择按钮 */}
      <button
        onClick={() => setShowSelector(!showSelector)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
        }}
      >
        <span>🎨</span>
        <span>背景风格</span>
      </button>

      {/* 背景选择器弹窗 */}
      {showSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            animation: 'slideIn 0.3s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSelector(false)
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              padding: '40px',
              borderRadius: '24px',
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              animation: 'slideIn 0.4s ease-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: '#333',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                🎨 选择背景风格
              </h2>
              <button
                onClick={() => setShowSelector(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.color = '#333'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#999'
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '20px',
              }}
            >
              {styles.map((style) => (
                <div
                  key={style.id}
                  onClick={() => {
                    handleStyleChange(style.id)
                    setShowSelector(false)
                  }}
                  style={{
                    background: style.gradient,
                    padding: '25px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow:
                      currentStyle === style.id
                        ? '0 8px 25px rgba(0, 0, 0, 0.3)'
                        : '0 4px 15px rgba(0, 0, 0, 0.2)',
                    transform: currentStyle === style.id ? 'scale(1.05)' : 'scale(1)',
                    border: currentStyle === style.id ? '3px solid #fff' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (currentStyle !== style.id) {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentStyle !== style.id) {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  <div style={{ fontSize: '50px', marginBottom: '15px' }}>{style.icon}</div>
                  <div
                    style={{
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                    }}
                  >
                    {style.name}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '13px',
                    }}
                  >
                    {style.description}
                  </div>
                  {currentStyle === style.id && (
                    <div
                      style={{
                        marginTop: '15px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓ 当前使用
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
