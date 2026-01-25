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
    // 直接显示支付成功页面，不进行自动检测
    setLoading(false)
    setPaymentStatus('completed')
  }, [])

  // 创建支付记录的函数（统一使用）
  const handleCompletePayment = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // 从 localStorage 获取支付信息
    const pendingPaymentStr = localStorage.getItem('pendingPayment')
    let amount = 100 // 默认值
    let coins = 100 // 默认值
    
    if (pendingPaymentStr) {
      try {
        const pendingPayment = JSON.parse(pendingPaymentStr)
        // 检查是否在 1 小时内（避免使用过期的支付信息）
        if (Date.now() - pendingPayment.timestamp < 3600000) {
          amount = pendingPayment.amount
          coins = pendingPayment.coins
        }
      } catch (e) {
        console.error('解析支付信息失败:', e)
      }
    }

    // 从 URL 参数获取 checkout ID
    const checkoutId = searchParams.get('checkout_id') || searchParams.get('id') || undefined

    try {
      console.log('创建支付记录:', { amount, coins, checkoutId })
      
      const response = await fetch('/api/payment/complete-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          coins,
          checkoutId,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('支付记录创建成功:', data)
        // 清除 localStorage 中的支付信息
        localStorage.removeItem('pendingPayment')
        // 跳转到游戏页面
        router.push('/')
      } else {
        console.error('创建支付记录失败:', data)
        alert('创建支付记录失败: ' + (data.error || '未知错误'))
        // 即使失败也跳转
        router.push('/')
      }
    } catch (error: any) {
      console.error('创建支付记录出错:', error)
      alert('创建支付记录出错: ' + error.message)
      // 即使出错也跳转
      router.push('/')
    }
  }

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
          // 支付成功，立即跳转到首页
          setTimeout(() => {
            router.push('/')
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
          
          // 如果用户确认支付已完成，尝试强制完成
          if (confirm('检测到 Stripe 格式的支付，无法通过 API 验证。\n\n如果支付已完成，是否强制完成支付并更新数据库？')) {
            // 再次调用 verify API，但这次带上 forceComplete 参数
            const forceResponse = await fetch('/api/payment/creem/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ paymentId, forceComplete: true }),
            })
            
            const forceData = await forceResponse.json()
            if (forceResponse.ok && forceData.status === 'completed') {
              setPaymentStatus('completed')
              setLoading(false)
              setTimeout(() => {
                router.push('/')
              }, 1000)
              return
            } else {
              setError(forceData.error || '强制完成失败，请使用"手动完成支付"按钮')
            }
          }
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
        // 支付成功，立即跳转到首页
        setTimeout(() => {
          router.push('/')
        }, 1000)
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
              onClick={handleCompletePayment}
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
              返回游戏
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
              onClick={handleCompletePayment}
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
                onClick={handleCompletePayment}
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
