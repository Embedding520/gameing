'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
}

interface AIChatProps {
  onClose: () => void
}

// 简洁的加载动画
function TypingAnimation() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#667eea',
            animation: `typing 1.2s infinite`,
            animationDelay: `${i * 0.2}s`,
            opacity: 0.6,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default function AIChat({ onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是AI助手，很高兴为你服务！有什么我可以帮助你的吗？',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showReasoning, setShowReasoning] = useState<{ [key: number]: boolean }>({})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('请先登录')
        return
      }

      // 构建消息历史（只保留最近的对话）
      const conversationMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: conversationMessages,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          reasoning: data.reasoning,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // 显示更详细的错误信息
        let errorMsg = data.error || '发送失败，请稍后重试'
        let details = data.details ? `\n\n详情: ${data.details}` : ''
        
        // 针对 401 错误提供特殊提示
        if (response.status === 401) {
          if (data.error === '未授权' || data.error === '无效的令牌') {
            errorMsg = '登录已过期，请重新登录'
            details = '\n\n请刷新页面或重新登录后重试'
            // 清除过期的 token
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            // 延迟跳转，让用户看到错误信息
            setTimeout(() => {
              window.location.href = '/login'
            }, 2000)
          } else {
            errorMsg = 'API密钥无效或已过期'
            details = '\n\n请检查 OPENROUTER_API_KEY 配置，或联系管理员'
          }
        }
        
        const status = `\n\n状态码: ${response.status}`
        const fullError = `${errorMsg}${details}${status}`
        
        console.error('AI 聊天错误:', {
          status: response.status,
          error: data.error,
          details: data.details,
          fullResponse: data,
        })
        
        alert(fullError)
        // 移除用户消息，因为发送失败
        setMessages((prev) => prev.slice(0, -1))
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      alert('发送失败，请稍后重试')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const toggleReasoning = (index: number) => {
    setShowReasoning((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

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
        @keyframes messageSlide {
          from {
            transform: translateX(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
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
              🤖
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
                AI 智能助手
              </h2>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px' }}>
                随时为你解答问题
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* 消息列表 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#f8f9fa',
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '14px',
                animation: 'messageSlide 0.3s ease-out',
              }}
            >
              {message.role === 'assistant' && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                  }}
                >
                  🤖
                </div>
              )}
              <div
                style={{
                  maxWidth: '80%',
                  background:
                    message.role === 'user'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#ffffff',
                  color: message.role === 'user' ? 'white' : '#333',
                  padding: '12px 16px',
                  borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                  boxShadow: message.role === 'user'
                    ? '0 2px 8px rgba(102, 126, 234, 0.25)'
                    : '0 1px 4px rgba(0, 0, 0, 0.08)',
                  border: message.role === 'assistant' ? '1px solid rgba(102, 126, 234, 0.1)' : 'none',
                  position: 'relative',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                {message.reasoning && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => toggleReasoning(index)}
                      style={{
                        background: 'transparent',
                        border: '1px solid',
                        borderColor: message.role === 'user' ? 'rgba(255,255,255,0.5)' : '#667eea',
                        color: message.role === 'user' ? 'white' : '#667eea',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      {showReasoning[index] ? '隐藏' : '显示'}思考过程
                    </button>
                    {showReasoning[index] && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '12px',
                          background: message.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(102, 126, 234, 0.1)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                          border: `1px solid ${message.role === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(102, 126, 234, 0.2)'}`,
                        }}
                      >
                        {message.reasoning}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(246, 211, 101, 0.25)',
                  }}
                >
                  👤
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                }}
              >
                🤖
              </div>
              <div
                style={{
                  background: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  fontSize: '14px',
                  border: '1px solid rgba(102, 126, 234, 0.1)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                }}
              >
                <TypingAnimation />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #e0e0e0',
            background: '#ffffff',
            borderRadius: '0 0 20px 20px',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的问题..."
                maxLength={2000}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                style={{
                  flex: 1,
                  minHeight: '50px',
                  maxHeight: '100px',
                  padding: '12px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: '#f8f9fa',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  e.currentTarget.style.background = '#ffffff'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.background = '#f8f9fa'
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  padding: '12px 24px',
                  background:
                    input.trim() && !loading
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#e0e0e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  boxShadow:
                    input.trim() && !loading
                      ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                      : 'none',
                  transition: 'all 0.3s ease',
                  opacity: input.trim() && !loading ? 1 : 0.6,
                  height: '50px',
                }}
                onMouseEnter={(e) => {
                  if (input.trim() && !loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (input.trim() && !loading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                {loading ? '发送中...' : '发送'}
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#999' }}>
                按 Enter 发送，Shift + Enter 换行
              </span>
              <span style={{ fontSize: '11px', color: '#999' }}>
                {input.length}/2000
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
