'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MahjongGame() {
  const [tiles, setTiles] = useState<string[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)

  const initTiles = () => {
    const newTiles: string[] = []
    const types = ['🀄', '🀅', '🀆', '🀇', '🀈', '🀉']
    for (let i = 0; i < 14; i++) {
      newTiles.push(types[Math.floor(Math.random() * types.length)])
    }
    setTiles(newTiles)
  }

  if (tiles.length === 0) {
    initTiles()
  }

  const handleTileClick = (index: number) => {
    if (selected.includes(index)) {
      setSelected(selected.filter(i => i !== index))
    } else if (selected.length < 2) {
      const newSelected = [...selected, index]
      setSelected(newSelected)
      if (newSelected.length === 2) {
        if (tiles[newSelected[0]] === tiles[newSelected[1]]) {
          setScore(prev => prev + 10)
          const newTiles = tiles.filter((_, i) => !newSelected.includes(i))
          setTiles(newTiles)
          setSelected([])
          if (newTiles.length === 0) {
            alert('恭喜！你赢了！')
            initTiles()
            setScore(0)
          }
        } else {
          setSelected([])
        }
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
      background: 'linear-gradient(135deg, #c94b4b 0%, #4b134f 100%)',
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

      <h1 style={{ fontSize: '36px' }}>🀄 麻将</h1>
      <div>分数: {score}</div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        maxWidth: '600px',
        justifyContent: 'center',
      }}>
        {tiles.map((tile, i) => (
          <div
            key={i}
            onClick={() => handleTileClick(i)}
            style={{
              width: '80px',
              height: '120px',
              background: selected.includes(i) ? '#ffeb3b' : 'white',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '50px',
              cursor: 'pointer',
              border: selected.includes(i) ? '3px solid #ff0000' : '2px solid #333',
              transition: 'all 0.3s',
            }}
          >
            {tile}
          </div>
        ))}
      </div>

      <button onClick={initTiles} style={{
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
        <p>点击两个相同的牌消除它们，消除所有牌获胜</p>
      </div>
    </main>
  )
}
