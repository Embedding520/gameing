'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BackgroundStyle1 from '@/app/components/BackgroundStyle1'
import BackgroundStyle2 from '@/app/components/BackgroundStyle2'
import BackgroundStyle3 from '@/app/components/BackgroundStyle3'
import BackgroundStyle4 from '@/app/components/BackgroundStyle4'
import BackgroundStyle5 from '@/app/components/BackgroundStyle5'
import BackgroundStyle6 from '@/app/components/BackgroundStyle6'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [backgroundStyle, setBackgroundStyle] = useState<'style1' | 'style2' | 'style3' | 'style4' | 'style5' | 'style6'>('style1')

  useEffect(() => {
    // 从localStorage加载保存的背景风格
    const savedStyle = localStorage.getItem('backgroundStyle') as 'style1' | 'style2' | 'style3' | 'style4' | 'style5' | 'style6'
    if (savedStyle && ['style1', 'style2', 'style3', 'style4', 'style5', 'style6'].includes(savedStyle)) {
      setBackgroundStyle(savedStyle)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '操作失败')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      backgroundAttachment: 'fixed',
      padding: '20px',
      position: 'relative'
    }}>
      {/* 动态背景 - 根据选择的风格显示 */}
      {backgroundStyle === 'style1' && <BackgroundStyle1 />}
      {backgroundStyle === 'style2' && <BackgroundStyle2 />}
      {backgroundStyle === 'style3' && <BackgroundStyle3 />}
      {backgroundStyle === 'style4' && <BackgroundStyle4 />}
      {backgroundStyle === 'style5' && <BackgroundStyle5 />}
      {backgroundStyle === 'style6' && <BackgroundStyle6 />}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        padding: '50px',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(10px)',
        animation: 'slideIn 0.5s ease-out'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '15px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
          }}>
            ⛏️
          </div>
          <h1 style={{
            fontSize: '36px',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            {isLogin ? '欢迎回来' : '开始游戏'}
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px'
          }}>
            {isLogin ? '登录您的账户' : '创建新账户'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              color: '#555',
              fontSize: '15px',
              fontWeight: '600'
            }}>
              👤 用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              color: '#555',
              fontSize: '15px',
              fontWeight: '600'
            }}>
              🔒 密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '15px',
              background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
              color: '#c62828',
              borderRadius: '12px',
              marginBottom: '25px',
              fontSize: '14px',
              border: '1px solid #ef9a9a',
              boxShadow: '0 4px 15px rgba(198, 40, 40, 0.2)'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading 
                ? 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              boxShadow: loading 
                ? 'none'
                : '0 6px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
              }
            }}
          >
            {loading ? '⏳ 处理中...' : (isLogin ? '🚀 登录' : '✨ 注册')}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          fontSize: '15px', 
          color: '#666',
          paddingTop: '20px',
          borderTop: '1px solid #e0e0e0'
        }}>
          {isLogin ? (
            <>
              <span>还没有账号？</span>{' '}
              <button
                onClick={() => setIsLogin(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#764ba2'
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#667eea'
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              <span>已有账号？</span>{' '}
              <button
                onClick={() => setIsLogin(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#764ba2'
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#667eea'
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                立即登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
