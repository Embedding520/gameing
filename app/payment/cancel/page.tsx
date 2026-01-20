'use client'

import { useRouter } from 'next/navigation'

export default function PaymentCancelPage() {
  const router = useRouter()

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
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
        <h1 style={{ marginBottom: '20px', color: '#f44336' }}>支付已取消</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>您取消了支付流程</p>
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
    </div>
  )
}
