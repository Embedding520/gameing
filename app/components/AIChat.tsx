'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
}

interface AIChatProps {
  onClose: () => void
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
        alert(data.error || '发送失败，请稍后重试')
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
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '25px 30px',
            borderBottom: '2px solid #e0e0e0',
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
            🤖 AI助手
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
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

        {/* 消息列表 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              {message.role === 'assistant' && (
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}
                >
                  🤖
                </div>
              )}
              <div
                style={{
                  maxWidth: '70%',
                  background:
                    message.role === 'user'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  color: message.role === 'user' ? 'white' : '#333',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
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
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                🤖
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  fontSize: '15px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ 
                    opacity: 0.4,
                    fontSize: '12px',
                  }}>正在思考</span>
                  <span style={{ 
                    opacity: 0.3,
                    fontSize: '8px',
                  }}>●</span>
                  <span style={{ 
                    opacity: 0.5,
                    fontSize: '8px',
                  }}>●</span>
                  <span style={{ 
                    opacity: 0.7,
                    fontSize: '8px',
                  }}>●</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div
          style={{
            padding: '20px 30px',
            borderTop: '2px solid #e0e0e0',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
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
                  minHeight: '60px',
                  maxHeight: '120px',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'none',
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
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  padding: '12px 24px',
                  background:
                    input.trim() && !loading
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  boxShadow:
                    input.trim() && !loading
                      ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                      : 'none',
                  transition: 'all 0.3s ease',
                  opacity: input.trim() && !loading ? 1 : 0.6,
                  height: '60px',
                }}
                onMouseEnter={(e) => {
                  if (input.trim() && !loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (input.trim() && !loading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
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
                marginTop: '8px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#999' }}>
                按 Enter 发送，Shift + Enter 换行
              </span>
              <span style={{ fontSize: '12px', color: '#999' }}>
                {input.length}/2000
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
