'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollCountRef = useRef(0)

  useEffect(() => {
    // 如果没有 payment_id，检查是否是直接访问或支付回调
    if (!paymentId) {
      // 尝试从 URL 中获取其他可能的参数
      const checkoutId = searchParams.get('checkout_id')
      const creemId = searchParams.get('id')
      
      if (checkoutId || creemId) {
        // 如果有 Creem 的 ID，说明是支付回调，但缺少 payment_id
        // 这种情况可能需要通过其他方式查找支付记录
        console.warn('支付回调缺少 payment_id，但有 checkout_id:', checkoutId || creemId)
      }
      
      setLoading(false)
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
              // 刷新用户信息
              setTimeout(() => {
                window.location.reload()
              }, 1000)
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
            // 支付成功，刷新页面以更新用户信息
            setTimeout(() => {
              window.location.reload()
            }, 1000)
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
          // 显示 Creem 返回的详细信息
          if (data.creemData) {
            console.log('Creem 支付数据:', data.creemData)
          }
        }
      } else {
        setError(data.error || '验证失败，请稍后再试')
        console.error('验证失败:', data)
      }
    } catch (error: any) {
      console.error('手动验证失败:', error)
      setError(error.message || '验证失败，请稍后再试')
    } finally {
      setVerifying(false)
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
            <p style={{ color: '#999', fontSize: '14px' }}>正在返回游戏...</p>
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
                disabled={verifying}
                style={{
                  padding: '12px 24px',
                  background: verifying ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: verifying ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {verifying ? '验证中...' : '手动验证支付'}
              </button>
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
