'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentId) {
      setLoading(false)
      return
    }

    // 轮询检查支付状态
    const checkPaymentStatus = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
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
            // 支付成功，等待几秒后返回游戏
            setTimeout(() => {
              router.push('/')
            }, 2000)
          } else if (data.status === 'pending') {
            // 如果还在处理中，继续轮询
            setTimeout(checkPaymentStatus, 2000)
          }
        }
      } catch (error) {
        console.error('检查支付状态失败:', error)
      } finally {
        setLoading(false)
      }
    }

    checkPaymentStatus()
  }, [paymentId, router])

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
        ) : (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
            <h1 style={{ marginBottom: '20px', color: '#FF9800' }}>支付处理中</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>请稍候，我们正在确认您的支付</p>
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
        )}
      </div>
    </div>
  )
}
