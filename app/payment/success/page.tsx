'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

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
    let pollCount = 0
    const maxPolls = 30 // 最多轮询 30 次（60秒）
    
    const checkPaymentStatus = async (forceVerify = false) => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // 如果轮询超过 10 次（20秒）仍未完成，尝试手动验证
        if (pollCount >= 10 || forceVerify) {
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
            if (verifyData.status === 'completed') {
              setPaymentStatus('completed')
              // 刷新用户信息
              window.location.reload()
              setTimeout(() => {
                router.push('/')
              }, 2000)
              return
            }
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
          setPaymentStatus(data.status)

          if (data.status === 'completed') {
            // 支付成功，刷新页面以更新用户信息
            window.location.reload()
            setTimeout(() => {
              router.push('/')
            }, 2000)
          } else if (data.status === 'pending') {
            pollCount++
            if (pollCount < maxPolls) {
              // 如果还在处理中，继续轮询
              setTimeout(() => checkPaymentStatus(), 2000)
            } else {
              // 超时后尝试最后一次验证
              console.warn('支付状态检查超时，尝试手动验证')
              setTimeout(() => checkPaymentStatus(true), 1000)
            }
          } else if (data.status === 'failed') {
            setPaymentStatus('failed')
          }
        }
      } catch (error) {
        console.error('检查支付状态失败:', error)
        // 如果出错，尝试手动验证
        if (pollCount >= 5) {
          setTimeout(() => checkPaymentStatus(true), 2000)
        }
      } finally {
        if (pollCount === 0) {
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
    try {
      const response = await fetch('/api/payment/creem/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'completed') {
          setPaymentStatus('completed')
          // 刷新页面以更新用户信息
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          alert(data.message || '支付仍在处理中，请稍后再试')
        }
      } else {
        const error = await response.json()
        alert(error.error || '验证失败，请稍后再试')
      }
    } catch (error) {
      console.error('手动验证失败:', error)
      alert('验证失败，请稍后再试')
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
            {paymentId && (
              <p style={{ color: '#999', fontSize: '12px', marginBottom: '20px' }}>
                支付 ID: {paymentId}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
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
