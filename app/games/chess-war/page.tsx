'use client'

import { useState } from 'react'
import Link from 'next/link'

const BOARD_SIZE = 8

export default function ChessWarGame() {
  const [board, setBoard] = useState<string[][]>([])
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null)
  const [turn, setTurn] = useState<'white' | 'black'>('white')

  const initBoard = () => {
    const newBoard: string[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(''))
    // 简化的初始布局
    for (let i = 0; i < BOARD_SIZE; i++) {
      newBoard[1][i] = '♟' // 黑兵
      newBoard[6][i] = '♙' // 白兵
    }
    return newBoard
 }

  if (board.length === 0) {
    setBoard(initBoard())
  }

  const handleCellClick = (row: number, col: number) => {
    if (!selected) {
      if (board[row][col]) {
        setSelected({ row, col })
      }
    } else {
      const newBoard = board.map(r => [...r])
      newBoard[row][col] = newBoard[selected.row][selected.col]
      newBoard[selected.row][selected.col] = ''
      setBoard(newBoard)
      setSelected(null)
      setTurn(turn === 'white' ? 'black' : 'white')
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
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
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

      <h1 style={{ fontSize: '36px' }}>♟️ 象棋大战</h1>
      <p>当前回合: {turn === 'white' ? '白方' : '黑方'}</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gap: '2px',
        border: '3px solid #fff',
        padding: '5px',
      }}>
        {board.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              onClick={() => handleCellClick(i, j)}
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: (i + j) % 2 === 0 ? '#f0d9b5' : '#b58863',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                cursor: 'pointer',
                border: selected?.row === i && selected?.col === j ? '3px solid #ff0000' : 'none',
              }}
            >
              {cell}
            </div>
          ))
        )}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击棋子选择，再点击目标位置移动</p>
      </div>
    </main>
  )
}
