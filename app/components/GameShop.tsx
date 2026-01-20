'use client'

import { GamePowerUp, getGamePowerUps } from '@/app/games/game-powerups'

interface GameShopProps {
  gameId: string
  userCoins: number
  userPowerUps: Record<string, Record<string, number>>
  onPurchase: (powerUpId: string, gameId: string) => Promise<void>
  onUse: (powerUpId: string) => void
  onClose: () => void
}

export default function GameShop({
  gameId,
  userCoins,
  userPowerUps,
  onPurchase,
  onUse,
  onClose,
}: GameShopProps) {
  const powerUps = getGamePowerUps(gameId)
  const myPowerUps = userPowerUps[gameId] || {}

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          padding: '40px',
          borderRadius: '24px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          animation: 'slideIn 0.4s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <h2
            style={{
              margin: 0,
              color: '#333',
              fontSize: '32px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🛒 道具商店
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.color = '#333'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#999'
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          {powerUps.map((powerUp) => {
            const canAfford = userCoins >= powerUp.price
            const myCount = myPowerUps[powerUp.id] || 0

            return (
              <div
                key={powerUp.id}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '2px solid #e0e0e0',
                  borderRadius: '20px',
                  padding: '25px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                  e.currentTarget.style.borderColor = canAfford ? '#667eea' : '#ccc'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              >
                <div
                  style={{
                    fontSize: '60px',
                    marginBottom: '15px',
                    filter: canAfford ? 'none' : 'grayscale(100%)',
                    opacity: canAfford ? 1 : 0.5,
                  }}
                >
                  {powerUp.icon}
                </div>
                <h3
                  style={{
                    margin: '0 0 10px 0',
                    color: '#333',
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  {powerUp.name}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    margin: '0 0 15px 0',
                    lineHeight: '1.5',
                    minHeight: '40px',
                  }}
                >
                  {powerUp.description}
                </p>
                <div
                  style={{
                    marginBottom: '15px',
                    padding: '12px',
                    background: canAfford
                      ? 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
                      : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                    borderRadius: '12px',
                    boxShadow: canAfford ? '0 4px 15px rgba(246, 211, 101, 0.3)' : 'none',
                  }}
                >
                  <div
                    style={{
                      color: canAfford ? '#333' : '#999',
                      fontWeight: 'bold',
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>🪙</span>
                    <span>{powerUp.price}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <button
                    onClick={() => onPurchase(powerUp.id, gameId)}
                    disabled={!canAfford}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: canAfford
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      boxShadow: canAfford ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
                      transition: 'all 0.3s ease',
                      opacity: canAfford ? 1 : 0.6,
                    }}
                  >
                    {canAfford ? '购买' : '金币不足'}
                  </button>
                  {myCount > 0 && (
                    <button
                      onClick={() => onUse(powerUp.id)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                      }}
                    >
                      使用 (×{myCount})
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 30px',
              background: 'rgba(0, 0, 0, 0.05)',
              color: '#666',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.borderColor = '#ccc'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
              e.currentTarget.style.borderColor = '#e0e0e0'
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
