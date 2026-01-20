'use client'

import { useState } from 'react'
import Link from 'next/link'

const GRID_SIZE = 9

export default function SudokuGame() {
  const [grid, setGrid] = useState<number[][]>([])
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null)

  const initGrid = () => {
    const newGrid: number[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
    // 生成一些初始数字
    for (let i = 0; i < 20; i++) {
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)
      newGrid[row][col] = Math.floor(Math.random() * 9) + 1
    }
    return newGrid
  }

  if (grid.length === 0) {
    setGrid(initGrid())
  }

  const handleCellClick = (row: number, col: number) => {
    setSelected({ row, col })
  }

  const handleNumberClick = (num: number) => {
    if (selected) {
      const newGrid = grid.map(r => [...r])
      newGrid[selected.row][selected.col] = num
      setGrid(newGrid)
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
      background: 'linear-gradient(135deg, #fbc531 0%, #e55039 100%)',
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

      <h1 style={{ fontSize: '36px' }}>🔢 数独</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: '2px',
        border: '3px solid #fff',
        padding: '5px',
      }}>
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              onClick={() => handleCellClick(i, j)}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: selected?.row === i && selected?.col === j ? '#ffeb3b' : '#fff',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: '1px solid #333',
              }}
            >
              {cell || ''}
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            style={{
              width: '50px',
              height: '50px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {num}
          </button>
        ))}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击格子选择，然后点击数字填入，每行每列每宫1-9不重复</p>
      </div>
    </main>
  )
}
