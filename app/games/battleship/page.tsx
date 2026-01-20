'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GRID_SIZE = 10

export default function BattleshipGame() {
  const router = useRouter()
  const [playerGrid, setPlayerGrid] = useState<number[][]>([])
  const [enemyGrid, setEnemyGrid] = useState<number[][]>([])
  const [playerShips, setPlayerShips] = useState(5)
  const [enemyShips, setEnemyShips] = useState(5)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [message, setMessage] = useState('点击敌方网格进行攻击！')

  useEffect(() => {
    // 初始化网格
    const initGrid = () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
    setPlayerGrid(initGrid())
    setEnemyGrid(initGrid())
    
    // 随机放置玩家船只
    const newPlayerGrid = initGrid()
    placeShips(newPlayerGrid, 5)
    setPlayerGrid(newPlayerGrid)
    
    // 随机放置敌方船只
    const newEnemyGrid = initGrid()
    placeShips(newEnemyGrid, 5)
    setEnemyGrid(newEnemyGrid)
  }, [])

  const placeShips = (grid: number[][], count: number) => {
    for (let i = 0; i < count; i++) {
      let placed = false
      while (!placed) {
        const x = Math.floor(Math.random() * GRID_SIZE)
        const y = Math.floor(Math.random() * GRID_SIZE)
        if (grid[y][x] === 0) {
          grid[y][x] = 1
          placed = true
        }
      }
    }
  }

  const handleEnemyClick = (row: number, col: number) => {
    if (gameOver || enemyGrid[row][col] === 2 || enemyGrid[row][col] === 3) return

    const newGrid = enemyGrid.map(r => [...r])
    if (newGrid[row][col] === 1) {
      newGrid[row][col] = 3 // 击中
      setEnemyShips(prev => {
        const newCount = prev - 1
        if (newCount === 0) {
          setGameOver(true)
          setWinner('玩家')
        }
        return newCount
      })
      setMessage('击中！')
    } else {
      newGrid[row][col] = 2 // 未击中
      setMessage('未击中')
      // 敌方回合
      setTimeout(() => {
        enemyTurn()
      }, 500)
    }
    setEnemyGrid(newGrid)
  }

  const enemyTurn = () => {
    const newGrid = playerGrid.map(r => [...r])
    let attacked = false
    while (!attacked) {
      const x = Math.floor(Math.random() * GRID_SIZE)
      const y = Math.floor(Math.random() * GRID_SIZE)
      if (newGrid[y][x] !== 2 && newGrid[y][x] !== 3) {
        if (newGrid[y][x] === 1) {
          newGrid[y][x] = 3
          setPlayerShips(prev => {
            const newCount = prev - 1
            if (newCount === 0) {
              setGameOver(true)
              setWinner('电脑')
            }
            return newCount
          })
        } else {
          newGrid[y][x] = 2
        }
        attacked = true
      }
    }
    setPlayerGrid(newGrid)
  }

  const restart = () => {
    const initGrid = () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
    const newPlayerGrid = initGrid()
    const newEnemyGrid = initGrid()
    placeShips(newPlayerGrid, 5)
    placeShips(newEnemyGrid, 5)
    setPlayerGrid(newPlayerGrid)
    setEnemyGrid(newEnemyGrid)
    setPlayerShips(5)
    setEnemyShips(5)
    setGameOver(false)
    setWinner(null)
    setMessage('点击敌方网格进行攻击！')
  }

  const renderCell = (value: number, isEnemy: boolean, onClick?: () => void) => {
    let bgColor = '#87CEEB'
    let content = ''
    
    if (value === 1 && !isEnemy) {
      bgColor = '#4CAF50' // 玩家船只
    } else if (value === 2) {
      bgColor = '#E0E0E0' // 未击中
      content = '○'
    } else if (value === 3) {
      bgColor = '#F44336' // 击中
      content = '✕'
    }

    return (
      <div
        onClick={onClick}
        style={{
          width: '30px',
          height: '30px',
          border: '1px solid #333',
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          fontSize: '20px',
        }}
      >
        {content}
      </div>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
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

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0' }}>🚢 战舰</h1>
        <p style={{ fontSize: '18px' }}>{message}</p>
      </div>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div>
          <h3>你的舰队 ({playerShips})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: '2px' }}>
            {playerGrid.map((row, i) =>
              row.map((cell, j) => (
                <div key={`${i}-${j}`}>
                  {renderCell(cell, false)}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3>敌方舰队 ({enemyShips})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: '2px' }}>
            {enemyGrid.map((row, i) =>
              row.map((cell, j) => (
                <div key={`${i}-${j}`}>
                  {renderCell(cell, true, () => handleEnemyClick(i, j))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {gameOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
        }}>
          <h2 style={{ color: 'white', fontSize: '48px' }}>{winner} 获胜！</h2>
          <button onClick={restart} style={{
            padding: '15px 30px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            再来一局
          </button>
        </div>
      )}

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '15px 30px',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <p><strong>操作说明：</strong></p>
        <p>点击敌方网格猜测战舰位置，击沉所有敌舰获胜！</p>
      </div>
    </main>
  )
}
