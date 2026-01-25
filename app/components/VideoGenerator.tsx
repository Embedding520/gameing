'use client'

import { useState, useRef, useEffect } from 'react'

interface VideoGeneratorProps {
  onClose: () => void
}

export default function VideoGenerator({ onClose }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)
  const [apiProvider, setApiProvider] = useState<'mock' | 'sisif' | 'veo'>('mock')
  const videoRef = useRef<HTMLVideoElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const pollTaskStatus = async (taskId: string, provider: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // 根据provider选择不同的路由
      let apiRoute = `/api/video/generate?taskId=${taskId}&provider=${provider}`
      if (provider === 'sisif') {
        apiRoute = `/api/video/generate-sisif?taskId=${taskId}`
      } else if (provider === 'veo') {
        apiRoute = `/api/video/generate-veo?taskId=${taskId}`
      }

      const response = await fetch(apiRoute, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setStatus(data.status)

        if (data.status === 'succeeded' && data.videoUrl) {
          setVideoUrl(data.videoUrl)
          setLoading(false)
          stopPolling()
        } else if (data.status === 'failed' || data.status === 'canceled') {
          setError(data.error || '视频生成失败')
          setLoading(false)
          stopPolling()
        }
        // 如果状态是 'starting' 或 'processing'，继续轮询
      } else {
        setError(data.error || '检查任务状态失败')
        setLoading(false)
        stopPolling()
      }
    } catch (error) {
      console.error('轮询错误:', error)
      setError('检查任务状态时出错')
      setLoading(false)
      stopPolling()
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return

    setLoading(true)
    setError(null)
    setVideoUrl(null)
    setTaskId(null)
    setStatus(null)
    stopPolling()

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('请先登录')
        return
      }

      // 根据选择的API提供商选择不同的路由
      let apiRoute = '/api/video/generate'
      if (apiProvider === 'sisif') {
        apiRoute = '/api/video/generate-sisif'
      } else if (apiProvider === 'veo') {
        apiRoute = '/api/video/generate-veo'
      }

      const response = await fetch(apiRoute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: duration,
          width: 1024,
          height: 576,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.videoUrl) {
          // 如果直接返回视频URL（演示模式）
          setVideoUrl(data.videoUrl)
          setLoading(false)
        } else if (data.taskId) {
          // 如果需要轮询任务状态
          setTaskId(data.taskId)
          setProvider(data.provider || 'replicate')
          setStatus(data.status || 'starting')

          // 开始轮询
          const pollProvider = data.provider || apiProvider
          pollingIntervalRef.current = setInterval(() => {
            pollTaskStatus(data.taskId, pollProvider)
          }, 3000) // 每3秒轮询一次
        } else {
          setError(data.message || '未知错误')
          setLoading(false)
        }
      } else {
        // 显示详细的错误信息
        const errorMsg = data.error || data.message || '生成失败，请稍后重试'
        console.error('API返回错误:', data)
        setError(errorMsg)
        setLoading(false)
      }
    } catch (error) {
      console.error('生成视频失败:', error)
      const errorMessage = error instanceof Error ? error.message : '生成失败，请稍后重试'
      setError(`网络错误: ${errorMessage}`)
      setLoading(false)
    }
  }

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  // 组件打开时自动滚动到输入框
  useEffect(() => {
    if (inputRef.current && containerRef.current) {
      // 延迟一下确保DOM已渲染
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        // 聚焦输入框
        inputRef.current?.focus()
      }, 100)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopPolling()
          onClose()
        }
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(30px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '600px',
          height: '80vh',
          maxHeight: '700px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid #e0e0e0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '20px 20px 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              🎬
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                AI 视频生成
              </h2>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px' }}>
                使用AI生成视频内容
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              stopPolling()
              onClose()
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'white',
              padding: '0',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
            }}
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            background: '#f8f9fa',
          }}
        >
          {/* 输入表单 */}
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                视频描述
              </label>
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要生成的视频内容，例如：一只可爱的小猫在花园里玩耍..."
                maxLength={500}
                required
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.3s ease',
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
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999', textAlign: 'right' }}>
                {prompt.length}/500
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                视频时长（秒）
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                min="1"
                max="10"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
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

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                API提供商
              </label>
              <select
                value={apiProvider}
                onChange={(e) => setApiProvider(e.target.value as 'mock' | 'sisif' | 'veo')}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'white',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <option value="mock">演示模式（无需API密钥）</option>
                <option value="sisif">Sisif（注册送35 credits）</option>
                <option value="veo">Veo 3.1（每月100免费credits）</option>
              </select>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                {apiProvider === 'mock' && '• 使用示例视频，无需配置'}
                {apiProvider === 'sisif' && '• 需配置 SISIF_API_KEY 环境变量'}
                {apiProvider === 'veo' && '• 需配置 VEO_API_KEY 环境变量'}
              </div>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              style={{
                padding: '14px 28px',
                background:
                  prompt.trim() && !loading
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: prompt.trim() && !loading ? 'pointer' : 'not-allowed',
                boxShadow:
                  prompt.trim() && !loading
                    ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                    : 'none',
                transition: 'all 0.3s ease',
                opacity: prompt.trim() && !loading ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (prompt.trim() && !loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (prompt.trim() && !loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              {loading ? (status ? `生成中... (${status})` : '生成中...') : '生成视频'}
            </button>
          </form>

          {/* 错误提示 */}
          {error && (
            <div
              style={{
                padding: '15px',
                background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                color: '#c62828',
                borderRadius: '12px',
                fontSize: '14px',
                border: '1px solid #ef9a9a',
                wordBreak: 'break-word',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>错误：</div>
                  <div>{error}</div>
                  <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
                    提示：请检查浏览器控制台（F12）和服务器日志以获取更多详细信息
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 视频预览 */}
          {videoUrl && (
            <div>
              <h3
                style={{
                  marginBottom: '15px',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                生成的视频
              </h3>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }}
              />
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <a
                  href={videoUrl}
                  download
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'inline-block',
                  }}
                >
                  下载视频
                </a>
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div
            style={{
              padding: '15px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#1565c0',
            }}
          >
            💡 <strong>提示：</strong>
            <br />
            • 视频生成可能需要几分钟时间，请耐心等待
            <br />
            • 目前为演示模式，如需使用真实API，请在服务器端配置相应的API密钥
            <br />
            • 支持的API提供商：Replicate、Stability AI等
          </div>
        </div>
      </div>
    </div>
  )
}
