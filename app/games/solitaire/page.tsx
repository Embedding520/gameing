'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SolitaireGame() {
  const [cards, setCards] = useState<number[]>([])
  const [score, setScore] = useState(0)

  const initCards = () => {
    const newCards: number[] = []
    for (let i = 1; i <= 13; i++) {
      newCards.push(i)
    }
    setCards(newCards.sort(() => Math.random() - 0.5))
  }

  if (cards.length === 0) {
    initCards()
  }

  const handleCardClick = (index: number) => {
    if (cards[index] === cards.length) {
      const newCards = cards.filter((_, i) => i !== index)
      setCards(newCards)
      setScore(prev => prev + 10)
      if (newCards.length === 0) {
        alert('恭喜完成！')
        initCards()
        setScore(0)
      }
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

      <h1 style={{ fontSize: '36px' }}>🂮 纸牌接龙</h1>
      <div>分数: {score}</div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        maxWidth: '600px',
        justifyContent: 'center',
      }}>
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={() => handleCardClick(i)}
            style={{
              width: '70px',
              height: '100px',
              background: 'white',
              color: 'black',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: card === cards.length ? 'pointer' : 'not-allowed',
              opacity: card === cards.length ? 1 : 0.5,
              border: '2px solid #333',
            }}
          >
            {card}
          </div>
        ))}
      </div>

      <button onClick={initCards} style={{
        padding: '12px 24px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
      }}>
        重新开始
      </button>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击最大的数字牌，按顺序消除所有牌</p>
      </div>
    </main>
  )
}
