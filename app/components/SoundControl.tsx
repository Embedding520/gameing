'use client'

import { useState, useEffect } from 'react'

export default function SoundControl() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [soundVolume, setSoundVolume] = useState(0.7)
  const [musicVolume, setMusicVolume] = useState(0.5)

  useEffect(() => {
    // 从 localStorage 加载设置
    const savedSoundEnabled = localStorage.getItem('soundEnabled')
    const savedMusicEnabled = localStorage.getItem('musicEnabled')
    const savedSoundVolume = localStorage.getItem('soundVolume')
    const savedMusicVolume = localStorage.getItem('musicVolume')

    if (savedSoundEnabled !== null) {
      setSoundEnabled(savedSoundEnabled === 'true')
    }
    if (savedMusicEnabled !== null) {
      setMusicEnabled(savedMusicEnabled === 'true')
    }
    if (savedSoundVolume !== null) {
      setSoundVolume(parseFloat(savedSoundVolume))
    }
    if (savedMusicVolume !== null) {
      setMusicVolume(parseFloat(savedMusicVolume))
    }
  }, [])

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('soundEnabled', String(newValue))
  }

  const toggleMusic = () => {
    const newValue = !musicEnabled
    setMusicEnabled(newValue)
    localStorage.setItem('musicEnabled', String(newValue))
  }

  const handleSoundVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setSoundVolume(value)
    localStorage.setItem('soundVolume', String(value))
  }

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setMusicVolume(value)
    localStorage.setItem('musicVolume', String(value))
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
    }}>
      {isExpanded ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '15px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          minWidth: '200px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
            }}>
              🔊 音效控制
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#666',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.color = '#333'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
                e.currentTarget.style.color = '#666'
              }}
            >
              ▼
            </button>
          </div>

          {/* 音效开关 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>音效</span>
              <button
                onClick={toggleSound}
                style={{
                  width: '50px',
                  height: '26px',
                  borderRadius: '13px',
                  background: soundEnabled ? '#4CAF50' : '#ccc',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: soundEnabled ? '27px' : '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
            {soundEnabled && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundVolume}
                onChange={handleSoundVolumeChange}
                style={{
                  width: '100%',
                }}
              />
            )}
          </div>

          {/* 背景音乐开关 */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>音乐</span>
              <button
                onClick={toggleMusic}
                style={{
                  width: '50px',
                  height: '26px',
                  borderRadius: '13px',
                  background: musicEnabled ? '#4CAF50' : '#ccc',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: musicEnabled ? '27px' : '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
            {musicEnabled && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                onChange={handleMusicVolumeChange}
                style={{
                  width: '100%',
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)'
          }}
          title="音效控制"
        >
          🔊
        </button>
      )}
    </div>
  )
}
