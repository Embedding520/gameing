'use client'

import { useEffect, useState } from 'react'

interface Post {
  id: string
  username: string
  content: string
  createdAt: string
  userId: string
}

interface ForumProps {
  currentUserId: string
  currentUsername: string
  onClose: () => void
}

export default function Forum({ currentUserId, currentUsername, onClose }: ForumProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPosts()
    // 每30秒刷新一次
    const interval = setInterval(fetchPosts, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/forum/posts')
      const data = await response.json()
      if (response.ok) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('获取帖子失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim()) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setSubmitting(true)
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newPost }),
      })

      const data = await response.json()
      if (response.ok) {
        setNewPost('')
        fetchPosts()
      } else {
        alert(data.error || '发布失败')
      }
    } catch (error) {
      console.error('发布帖子失败:', error)
      alert('发布失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        fetchPosts()
      } else {
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除帖子失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 30px',
            borderBottom: '2px solid #e0e0e0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.transform = 'translateX(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              ← 返回
            </button>
            <h2
              style={{
                margin: 0,
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              💬 游戏论坛
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'white',
              padding: '0',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'rotate(90deg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'rotate(0deg)'
            }}
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* 发布区域 */}
          <div style={{ padding: '20px 30px', borderBottom: '2px solid #e0e0e0', background: '#f8f9fa' }}>
          <form onSubmit={handleSubmit}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="分享你的游戏心得、技巧或想法..."
              maxLength={1000}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '15px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#999' }}>
                {newPost.length}/1000
              </span>
              <button
                type="submit"
                disabled={!newPost.trim() || submitting}
                style={{
                  padding: '10px 24px',
                  background: newPost.trim() && !submitting
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: newPost.trim() && !submitting ? 'pointer' : 'not-allowed',
                  boxShadow: newPost.trim() && !submitting
                    ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                    : 'none',
                  transition: 'all 0.3s ease',
                  opacity: newPost.trim() && !submitting ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (newPost.trim() && !submitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (newPost.trim() && !submitting) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                {submitting ? '发布中...' : '发布'}
              </button>
            </div>
          </form>
        </div>

          {/* 帖子列表 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 30px',
            }}
          >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              加载中...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              还没有评论，快来发表第一条吧！
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {posts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '2px solid #e0e0e0',
                    borderRadius: '16px',
                    padding: '20px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
                    e.currentTarget.style.borderColor = '#667eea'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = '#e0e0e0'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '18px',
                        }}
                      >
                        {post.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            fontSize: '16px',
                            color: '#333',
                            marginBottom: '4px',
                          }}
                        >
                          {post.username}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {formatTime(post.createdAt)}
                        </div>
                      </div>
                    </div>
                    {post.userId === currentUserId && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      color: '#555',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {post.content}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
