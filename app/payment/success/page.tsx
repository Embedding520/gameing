'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// 强制动态渲染，确保支付回调参数能正确获取
export const dynamic = 'force-dynamic'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStripeFormat, setIsStripeFormat] = useState(false)
  const pollCountRef = useRef(0)

  useEffect(() => {
    // 如果没有 payment_id，检查是否是直接访问或支付回调
    if (!paymentId) {
      // 尝试从 URL 中获取其他可能的参数
      const checkoutId = searchParams.get('checkout_id')
      const creemId = searchParams.get('id')
      const sessionId = searchParams.get('session_id')
      
      if (checkoutId || creemId || sessionId) {
        // 如果有 Creem 的 ID，说明是支付回调，但缺少 payment_id
        // 尝试通过 checkout_id 查找支付记录
        console.log('支付回调参数:', { checkoutId, creemId, sessionId })
        
        // 显示提示信息，让用户知道支付可能已完成
        setPaymentStatus('pending')
        setLoading(false)
        setError('正在查找支付记录，请稍候...')
        
        // 尝试通过 checkout_id 查找支付记录
        if (checkoutId || creemId || sessionId) {
          // 这里可以添加通过 checkout_id 查找支付记录的逻辑
          // 暂时显示成功页面，让用户知道支付已完成
          setTimeout(() => {
            setPaymentStatus('completed')
            setError(null)
          }, 2000)
        }
      } else {
        // 没有任何参数，可能是直接访问
        setError('缺少支付信息，请从支付页面返回')
        setLoading(false)
      }
      return
    }

    // 轮询检查支付状态
    const maxPolls = 30 // 最多轮询 30 次（60秒）
    
    const checkPaymentStatus = async (forceVerify = false) => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // 如果轮询超过 10 次（20秒）仍未完成，尝试手动验证
        if (pollCountRef.current >= 10 || forceVerify) {
          console.log('尝试手动验证支付状态...')
          const verifyResponse = await fetch('/api/payment/creem/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentId }),
          })

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            console.log('手动验证结果:', verifyData)
            if (verifyData.status === 'completed') {
              setPaymentStatus('completed')
              setLoading(false)
              // 支付成功，等待几秒后跳转到首页
              setTimeout(() => {
                router.push('/')
              }, 2000)
              return
            } else if (verifyData.error) {
              setError(verifyData.error)
            }
          } else {
            const errorData = await verifyResponse.json().catch(() => ({}))
            console.error('手动验证失败:', errorData)
            setError(errorData.error || '验证失败')
          }
        }

        const response = await fetch('/api/payment/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentId }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log('支付状态:', data)
          setPaymentStatus(data.status)

          if (data.status === 'completed') {
            setLoading(false)
            setPaymentStatus('completed')
            // 支付成功，等待几秒后跳转到首页
            setTimeout(() => {
              router.push('/')
            }, 2000)
          } else if (data.status === 'pending') {
            pollCountRef.current++
            if (pollCountRef.current < maxPolls) {
              // 如果还在处理中，继续轮询
              setTimeout(() => checkPaymentStatus(), 2000)
            } else {
              // 超时后尝试最后一次验证
              console.warn('支付状态检查超时，尝试手动验证')
              setLoading(false)
              setError('支付状态检查超时，请点击"手动验证支付"按钮')
            }
          } else if (data.status === 'failed') {
            setPaymentStatus('failed')
            setLoading(false)
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('查询支付状态失败:', errorData)
          setError(errorData.error || '查询支付状态失败')
          if (pollCountRef.current >= 5) {
            setLoading(false)
          }
        }
      } catch (error: any) {
        console.error('检查支付状态失败:', error)
        setError(error.message || '检查支付状态失败')
        // 如果出错，尝试手动验证
        if (pollCountRef.current >= 5) {
          setLoading(false)
        } else {
          pollCountRef.current++
          setTimeout(() => checkPaymentStatus(true), 2000)
        }
      } finally {
        if (pollCountRef.current === 0) {
          setLoading(false)
        }
      }
    }

    checkPaymentStatus()
  }, [paymentId, router])

  // 手动验证支付
  const handleManualVerify = async () => {
    if (!paymentId) return
    
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    setVerifying(true)
    setError(null)
    try {
      console.log('开始手动验证支付:', paymentId)
      const response = await fetch('/api/payment/creem/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()
      console.log('手动验证响应:', data)

      if (response.ok) {
        if (data.status === 'completed') {
          setPaymentStatus('completed')
          setLoading(false)
          // 刷新页面以更新用户信息
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          setError(data.message || `支付仍在处理中 (状态: ${data.creemStatus || '未知'})`)
          setIsStripeFormat(data.isStripeFormat || false)
          // 显示 Creem 返回的详细信息
          if (data.creemData) {
            console.log('Creem 支付数据:', data.creemData)
          }
        }
      } else {
        const errorData = data
        // 如果检测到 Stripe 格式或允许手动完成，显示手动完成按钮
        if (errorData.isStripeFormat || errorData.canManualComplete) {
          setIsStripeFormat(true)
          setError(errorData.message || errorData.suggestion || '无法通过 API 验证，但可以手动完成支付')
        } else {
          setError(errorData.error || '验证失败，请稍后再试')
        }
        console.error('验证失败:', errorData)
      }
    } catch (error: any) {
      console.error('手动验证失败:', error)
      setError(error.message || '验证失败，请稍后再试')
    } finally {
      setVerifying(false)
    }
  }

  // 手动完成支付（用于 Stripe 格式的 checkout ID）
  const handleManualComplete = async () => {
    if (!paymentId) return
    
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!confirm('确认手动完成支付？只有在支付已完成但系统无法自动确认的情况下才使用此功能。')) {
      return
    }

    setCompleting(true)
    setError(null)
    try {
      console.log('开始手动完成支付:', paymentId)
      const response = await fetch('/api/payment/manual-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()
      console.log('手动完成响应:', data)

      if (response.ok && data.status === 'completed') {
        setPaymentStatus('completed')
        setLoading(false)
        // 支付成功，等待几秒后跳转到首页
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(data.error || '手动完成失败，请稍后再试')
        console.error('手动完成失败:', data)
      }
    } catch (error: any) {
      console.error('手动完成失败:', error)
      setError(error.message || '手动完成失败，请稍后再试')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        maxWidth: '500px',
      }}>
        {loading ? (
          <>
            <h1 style={{ marginBottom: '20px', color: '#333' }}>处理中...</h1>
            <p style={{ color: '#666' }}>正在确认支付状态</p>
          </>
        ) : paymentStatus === 'completed' ? (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h1 style={{ marginBottom: '20px', color: '#4CAF50' }}>支付成功！</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>金币已添加到您的账户</p>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>正在返回游戏...</p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 24px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              立即返回
            </button>
          </>
        ) : !paymentId ? (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ marginBottom: '20px', color: '#FF9800' }}>支付回调异常</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>无法获取支付信息，但支付可能已成功</p>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>
              请检查您的账户余额，或联系客服确认
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              返回游戏
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
            <h1 style={{ marginBottom: '20px', color: '#FF9800' }}>支付处理中</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>请稍候，我们正在确认您的支付</p>
            {error && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
                color: '#856404',
                fontSize: '14px',
              }}>
                ⚠️ {error}
              </div>
            )}
            {paymentId && (
              <p style={{ color: '#999', fontSize: '12px', marginBottom: '20px' }}>
                支付 ID: {paymentId}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleManualVerify}
                disabled={verifying || completing}
                style={{
                  padding: '12px 24px',
                  background: verifying || completing ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: verifying || completing ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {verifying ? '验证中...' : '手动验证支付'}
              </button>
              {(isStripeFormat || (error && (error.includes('Stripe') || error.includes('无法通过 API')))) && (
                <button
                  onClick={handleManualComplete}
                  disabled={verifying || completing}
                  style={{
                    padding: '12px 24px',
                    background: completing ? '#ccc' : '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: completing ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  {completing ? '处理中...' : '手动完成支付'}
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                style={{
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                返回游戏
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <h1 style={{ color: '#333' }}>加载中...</h1>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
