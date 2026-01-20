'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BlackjackGame() {
  const [playerHand, setPlayerHand] = useState<number[]>([])
  const [dealerHand, setDealerHand] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const dealCard = () => {
    return Math.min(10, Math.floor(Math.random() * 13) + 1)
  }

  const startGame = () => {
    setPlayerHand([dealCard(), dealCard()])
    setDealerHand([dealCard()])
    setGameOver(false)
  }

  const hit = () => {
    if (gameOver) return
    const newHand = [...playerHand, dealCard()]
    setPlayerHand(newHand)
    const total = newHand.reduce((a, b) => a + b, 0)
    if (total > 21) {
      setGameOver(true)
      setScore(prev => prev - 10)
    }
  }

  const stand = () => {
    if (gameOver) return
    let newDealerHand = [...dealerHand]
    while (newDealerHand.reduce((a, b) => a + b, 0) < 17) {
      newDealerHand.push(dealCard())
    }
    setDealerHand(newDealerHand)
    const playerTotal = playerHand.reduce((a, b) => a + b, 0)
    const dealerTotal = newDealerHand.reduce((a, b) => a + b, 0)
    setGameOver(true)
    if (dealerTotal > 21 || playerTotal > dealerTotal) {
      setScore(prev => prev + 10)
    } else if (playerTotal < dealerTotal) {
      setScore(prev => prev - 10)
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
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
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

      <h1 style={{ fontSize: '36px' }}>🂡 21点</h1>
      <div>分数: {score}</div>

      <div>
        <h3>庄家: {dealerHand.reduce((a, b) => a + b, 0)}</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {dealerHand.map((card, i) => (
            <div key={i} style={{
              width: '60px',
              height: '90px',
              background: 'white',
              color: 'black',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
            }}>
              {card}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>玩家: {playerHand.reduce((a, b) => a + b, 0)}</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {playerHand.map((card, i) => (
            <div key={i} style={{
              width: '60px',
              height: '90px',
              background: 'white',
              color: 'black',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
            }}>
              {card}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <button onClick={startGame} style={{
          padding: '12px 24px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}>
          开始
        </button>
        <button onClick={hit} disabled={gameOver || playerHand.length === 0} style={{
          padding: '12px 24px',
          background: gameOver || playerHand.length === 0 ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: gameOver || playerHand.length === 0 ? 'not-allowed' : 'pointer',
        }}>
          要牌
        </button>
        <button onClick={stand} disabled={gameOver || playerHand.length === 0} style={{
          padding: '12px 24px',
          background: gameOver || playerHand.length === 0 ? '#ccc' : '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: gameOver || playerHand.length === 0 ? 'not-allowed' : 'pointer',
        }}>
          停牌
        </button>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>接近21点但不要超过，比庄家更接近21点获胜</p>
      </div>
    </main>
  )
}
