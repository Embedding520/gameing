'use client'

import { useState, useRef, useEffect } from 'react'

interface ImageGeneratorProps {
  onClose: () => void
}

export default function ImageGenerator({ onClose }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [imageSize, setImageSize] = useState('1024x1024')
  const [numInferenceSteps, setNumInferenceSteps] = useState(20)
  const [guidanceScale, setGuidanceScale] = useState(7.5)
  const [loading, setLoading] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入图片描述')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setError('请先登录')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedImages([])

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image_size: imageSize,
          num_inference_steps: numInferenceSteps,
          guidance_scale: guidanceScale,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.images && data.images.length > 0) {
          const imageUrls = data.images.map((img: any) => img.url)
          setGeneratedImages(imageUrls)
        } else {
          setError('未生成图片')
        }
      } else {
        setError(data.error || data.message || '生成失败')
      }
    } catch (error: any) {
      console.error('生成图片错误:', error)
      setError(error.message || '生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = (url: string, index: number) => {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `generated-image-${Date.now()}-${index}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      })
      .catch(err => {
        console.error('下载图片失败:', err)
        alert('下载失败')
      })
  }

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
        zIndex: 2000,
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '20px 20px 0 0',
        }}>
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
              🎨
            </div>
            <div>
              <h2 style={{
                margin: 0,
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
              }}>
                AI 图片生成
              </h2>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px' }}>
                使用AI生成图片内容
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
        
        {/* 内容区域 */}
        <div ref={containerRef} style={{ flex: 1, overflow: 'auto', padding: '20px', background: '#f8f9fa' }}>

        {/* 输入区域 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            图片描述：
          </label>
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：一只可爱的小猫坐在窗台上，阳光洒在它身上，背景是美丽的花园..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              fontSize: '14px',
              border: '2px solid #667eea',
              borderRadius: '8px',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        {/* 高级设置 */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '12px',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#333',
          }}>
            高级设置：
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              color: '#666',
            }}>
              图片尺寸：
            </label>
            <select
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
              }}
            >
              <option value="512x512">512x512</option>
              <option value="768x768">768x768</option>
              <option value="1024x1024">1024x1024</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              color: '#666',
            }}>
              推理步数：{numInferenceSteps}
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={numInferenceSteps}
              onChange={(e) => setNumInferenceSteps(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              步数越多，质量越好，但生成时间更长
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '12px',
              color: '#666',
            }}>
              引导强度：{guidanceScale}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={guidanceScale}
              onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              数值越高，越遵循提示词
            </div>
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            width: '100%',
            padding: '14px',
            background: loading || !prompt.trim()
              ? '#ccc'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
          }}
        >
          {loading ? '生成中...' : '🎨 生成图片'}
        </button>

        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: '12px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            marginBottom: '20px',
            fontSize: '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 生成的图片 */}
        {generatedImages.length > 0 && (
          <div>
            <h3 style={{
              margin: '0 0 15px 0',
              fontSize: '18px',
              color: '#333',
            }}>
              ✨ 生成的图片：
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px',
            }}>
              {generatedImages.map((url, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #e0e0e0',
                  }}
                >
                  <img
                    src={url}
                    alt={`Generated ${index + 1}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                  <button
                    onClick={() => downloadImage(url, index)}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      padding: '8px 16px',
                      background: 'rgba(102, 126, 234, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    💾 下载
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
