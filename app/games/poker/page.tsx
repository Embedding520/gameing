'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PokerGame() {
  const [hand, setHand] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [bet, setBet] = useState(10)

  const suits = ['♠', '♥', '♦', '♣']
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

  const dealCards = () => {
    const newHand: string[] = []
    for (let i = 0; i < 5; i++) {
      const suit = suits[Math.floor(Math.random() * suits.length)]
      const rank = ranks[Math.floor(Math.random() * ranks.length)]
      newHand.push(`${rank}${suit}`)
    }
    setHand(newHand)
    setScore(prev => prev + bet)
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white'
    }}>
      <Link href="/" style={{
        padding: '10px 20px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        textDecoration: 'none',
        color: 'white',
        fontWeight: 'bold',
      }}>
        🏠 返回大厅
      </Link>

      <h1 style={{ fontSize: '36px' }}>🃏 德州扑克</h1>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div>分数: {score}</div>
        <div>下注: {bet}</div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {hand.map((card, i) => (
          <div key={i} style={{
            width: '80px',
            height: '120px',
            background: 'white',
            color: card.includes('♥') || card.includes('♦') ? 'red' : 'black',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            border: '2px solid #333',
          }}>
            {card}
          </div>
        ))}
      </div>

      <button onClick={dealCards} style={{
        padding: '15px 30px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: 'bold',
        cursor: 'pointer',
      }}>
        发牌
      </button>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击发牌开始游戏，组合最佳牌型获得分数</p>
      </div>
    </main>
  )
}
