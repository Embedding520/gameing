'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CARD_COUNT = 12

export default function MemoryGame() {
  const [cards, setCards] = useState<Array<{ id: number; value: number; flipped: boolean; matched: boolean }>>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)

  useEffect(() => {
    const initCards = () => {
      const values = Array.from({ length: CARD_COUNT / 2 }, (_, i) => i + 1)
      const pairs = [...values, ...values]
      const shuffled = pairs.sort(() => Math.random() - 0.5)
      return shuffled.map((value, id) => ({
        id,
        value,
        flipped: false,
        matched: false,
      }))
    }
    setCards(initCards())
  }, [])

  const handleCardClick = (index: number) => {
    if (cards[index].flipped || cards[index].matched || flippedCards.length === 2) return

    const newCards = cards.map((card, i) =>
      i === index ? { ...card, flipped: true } : card
    )
    setCards(newCards)
    const newFlipped = [...flippedCards, index]

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      if (newCards[newFlipped[0]].value === newCards[newFlipped[1]].value) {
        setTimeout(() => {
          setCards(prev => prev.map((card, i) =>
            newFlipped.includes(i) ? { ...card, matched: true, flipped: true } : card
          ))
          setScore(prev => prev + 10)
          setFlippedCards([])
        }, 500)
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((card, i) =>
            newFlipped.includes(i) ? { ...card, flipped: false } : card
          ))
          setFlippedCards([])
        }, 1000)
      }
    } else {
      setFlippedCards(newFlipped)
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
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      color: '#333'
    }}>
      <Link href="/" style={{
        padding: '10px 20px',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '12px',
        textDecoration: 'none',
        color: '#333',
        fontWeight: 'bold',
      }}>
        🏠 返回大厅
      </Link>

      <h1 style={{ fontSize: '36px' }}>🧠 记忆翻牌</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>分数: {score}</div>
        <div>步数: {moves}</div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        maxWidth: '500px',
      }}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(index)}
            style={{
              width: '100px',
              height: '100px',
              background: card.flipped || card.matched ? '#fff' : '#4CAF50',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              cursor: 'pointer',
              border: '3px solid #333',
              transition: 'all 0.3s',
            }}
          >
            {card.flipped || card.matched ? card.value : '?'}
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击卡片翻牌，找到相同的两张卡片配对</p>
      </div>
    </main>
  )
}
