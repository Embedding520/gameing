'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GAMES, GAME_ZONES, GameZone } from '@/app/games/games'
import BackgroundStyle1 from '@/app/components/BackgroundStyle1'
import BackgroundStyle2 from '@/app/components/BackgroundStyle2'
import BackgroundStyle3 from '@/app/components/BackgroundStyle3'
import BackgroundStyle4 from '@/app/components/BackgroundStyle4'
import BackgroundStyle5 from '@/app/components/BackgroundStyle5'
import BackgroundStyle6 from '@/app/components/BackgroundStyle6'
import BackgroundSelector from '@/app/components/BackgroundSelector'
import Forum from '@/app/components/Forum'
import AIChat from '@/app/components/AIChat'
import Agent from '@/app/components/Agent'
import VideoGenerator from '@/app/components/VideoGenerator'
import ImageGenerator from '@/app/components/ImageGenerator'
import Leaderboard from '@/app/components/Leaderboard'
import DailyCheckin from '@/app/components/DailyCheckin'
import SoundControl from '@/app/components/SoundControl'
import LoadingSpinner, { PageLoader } from '@/app/components/LoadingSpinner'
import { SkeletonGameList } from '@/app/components/Skeleton'

interface User {
  id: string
  username: string
  coins: number
  totalScore: number
  level: number
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [backgroundStyle, setBackgroundStyle] = useState<'style1' | 'style2' | 'style3' | 'style4' | 'style5' | 'style6'>('style1')
  const [showRecharge, setShowRecharge] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState(100)
  const [showForum, setShowForum] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showAgent, setShowAgent] = useState(false)
  const [showVideoGenerator, setShowVideoGenerator] = useState(false)
  const [showImageGenerator, setShowImageGenerator] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [selectedZone, setSelectedZone] = useState<GameZone | '全部'>('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [favoriteGames, setFavoriteGames] = useState<string[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isLoadingGames, setIsLoadingGames] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // 从localStorage加载保存的背景风格
    const savedStyle = localStorage.getItem('backgroundStyle') as 'style1' | 'style2' | 'style3' | 'style4' | 'style5' | 'style6'
    if (savedStyle && ['style1', 'style2', 'style3', 'style4', 'style5', 'style6'].includes(savedStyle)) {
      setBackgroundStyle(savedStyle)
      document.body.setAttribute('data-bg-style', savedStyle)
    } else {
      document.body.setAttribute('data-bg-style', 'style1')
    }
  }, [])

  const fetchUserInfo = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store', // 确保获取最新数据
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        // 更新 localStorage 中的用户信息
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userStr))
    // 立即获取最新用户信息（包括从支付页面返回后）
    fetchUserInfo()
    fetchFavoriteGames()
    
    // 定期刷新用户信息（每60秒，减少频率以提升性能）
    const interval = setInterval(() => {
      fetchUserInfo()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [router, fetchUserInfo])

  const fetchFavoriteGames = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/games/favorite', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFavoriteGames(data.favoriteGames || [])
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error)
    }
  }

  const toggleFavorite = useCallback(async (gameId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const token = localStorage.getItem('token')
    if (!token) return

    const isFavorite = favoriteGames.includes(gameId)
    const action = isFavorite ? 'remove' : 'add'

    try {
      const response = await fetch('/api/games/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId, action }),
      })

      if (response.ok) {
        const data = await response.json()
        setFavoriteGames(data.favoriteGames || [])
      }
    } catch (error) {
      console.error('更新收藏失败:', error)
    }
  }, [favoriteGames])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  // 使用 useMemo 缓存过滤后的游戏列表，减少重复计算
  const filteredGames = useMemo(() => {
    return GAME_ZONES.map((zone) => {
      let zoneGames = GAMES.filter(game => game.zone === zone.id)
      
      // 应用搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        zoneGames = zoneGames.filter(game =>
          game.name.toLowerCase().includes(query) ||
          game.description.toLowerCase().includes(query)
        )
      }
      
      // 应用收藏过滤
      if (showFavoritesOnly) {
        zoneGames = zoneGames.filter(game => favoriteGames.includes(game.id))
      }
      
      return { zone, games: zoneGames }
    }).filter(({ zone, games }) => {
      if (selectedZone !== '全部' && selectedZone !== zone.id) return false
      return games.length > 0
    })
  }, [searchQuery, showFavoritesOnly, favoriteGames, selectedZone])

  const handleRecharge = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // 保存支付信息到 localStorage，以便支付成功页面使用
      localStorage.setItem('pendingPayment', JSON.stringify({
        amount: rechargeAmount,
        coins: rechargeAmount,
        timestamp: Date.now(),
      }))

      // 使用 CREEM 支付创建支付链接
      const response = await fetch('/api/payment/creem/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount: rechargeAmount, // 支付金额（美元）
          coins: rechargeAmount, // 获得的金币数量
        }),
      })

      const data = await response.json()

      if (response.ok && data.checkoutUrl) {
        setShowRecharge(false)
        // 跳转到 CREEM 支付页面
        window.location.href = data.checkoutUrl
      } else {
        // 处理错误消息
        let errorMsg = data.message || data.error || '创建支付链接失败'
        
        // 记录详细错误信息到控制台
        console.error('支付链接创建失败:', {
          status: response.status,
          error: data.error,
          message: data.message,
          details: data.details,
          debugInfo: data.debugInfo,
          suggestions: data.suggestions,
          fullResponse: data,
        })
        
        // 如果是 403 错误，提供更详细的说明
        if (response.status === 403 || errorMsg.includes('CREEM_API_KEY')) {
          const diagnoseUrl = `${window.location.origin}/api/payment/creem/diagnose`
          let detailedMsg = `支付服务配置错误 (403 Forbidden)\n\n${errorMsg}\n\n`
          
          // 添加 Creem 返回的详细信息
          if (data.details) {
            detailedMsg += `\nCreem API 返回详情：\n${JSON.stringify(data.details, null, 2)}\n`
          }
          
          // 添加调试信息
          if (data.debugInfo) {
            detailedMsg += `\n调试信息：\n`
            if (data.debugInfo.apiUrl) detailedMsg += `- API URL: ${data.debugInfo.apiUrl}\n`
            if (data.debugInfo.apiKeyPrefix) detailedMsg += `- API Key 前缀: ${data.debugInfo.apiKeyPrefix}\n`
            if (data.debugInfo.endpoint) detailedMsg += `- 端点: ${data.debugInfo.endpoint}\n`
          }
          
          // 添加建议
          if (data.suggestions && data.suggestions.length > 0) {
            detailedMsg += `\n建议：\n${data.suggestions.join('\n')}\n`
          }
          
          detailedMsg += `\n访问诊断工具检查配置：\n${diagnoseUrl}`
          
          errorMsg = detailedMsg
        }
        
        alert(errorMsg)
      }
    } catch (error) {
      console.error('创建支付链接失败:', error)
      alert('创建支付链接失败，请稍后重试')
    }
  }

  if (!user) {
    return <PageLoader />
  }

  return (
    <main style={{ 
      minHeight: '100vh', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* 背景选择器 */}
      <BackgroundSelector onStyleChange={setBackgroundStyle} />
      
      {/* 动态背景 - 根据选择的风格显示 */}
      {backgroundStyle === 'style1' && <BackgroundStyle1 />}
      {backgroundStyle === 'style2' && <BackgroundStyle2 />}
      {backgroundStyle === 'style3' && <BackgroundStyle3 />}
      {backgroundStyle === 'style4' && <BackgroundStyle4 />}
      {backgroundStyle === 'style5' && <BackgroundStyle5 />}
      {backgroundStyle === 'style6' && <BackgroundStyle6 />}
      {backgroundStyle === 'style4' && <BackgroundStyle4 />}
      {backgroundStyle === 'style5' && <BackgroundStyle5 />}
      {backgroundStyle === 'style6' && <BackgroundStyle6 />}

      {/* 顶部信息栏 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        // backdropFilter: 'blur(10px)', // 禁用以提升性能
        padding: '20px 35px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        animation: 'slideIn 0.5s ease-out',
        marginTop: '60px', // 为背景风格按钮留出空间
      }}>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.username}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            borderRadius: '12px',
            color: '#333',
            boxShadow: '0 4px 15px rgba(246, 211, 101, 0.4)'
          }}>
            <span style={{ fontSize: '20px' }}>🪙</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{user.coins}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 15px rgba(17, 153, 142, 0.4)'
          }}>
            <span style={{ fontSize: '18px' }}>⭐</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.totalScore}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowForum(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            💬 论坛
          </button>
          <button
            onClick={() => setShowAIChat(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(17, 153, 142, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(17, 153, 142, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(17, 153, 142, 0.4)'
            }}
          >
            🤖 AI助手
          </button>
          <button
            onClick={() => setShowAgent(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)'
            }}
          >
            🎯 智能体
          </button>
          {/* 视频生成按钮 - 暂时隐藏，功能保留 */}
          <button
            onClick={() => setShowVideoGenerator(true)}
            style={{
              display: 'none', // 隐藏按钮，但保留功能代码
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 147, 251, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(240, 147, 251, 0.4)'
            }}
          >
            🎬 视频生成
          </button>
          <button
            onClick={() => setShowImageGenerator(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(168, 237, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 237, 234, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 237, 234, 0.4)'
            }}
          >
            🎨 图片生成
          </button>
          <DailyCheckin />
          <button
            onClick={() => setShowLeaderboard(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#333',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)'
            }}
          >
            🏆 排行榜
          </button>
          <Link
            href="/profile"
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)'
            }}
          >
            👤 个人中心
          </Link>
          <button
            onClick={() => setShowRecharge(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              color: '#333',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(246, 211, 101, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(246, 211, 101, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(246, 211, 101, 0.4)'
            }}
          >
            💰 充值
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: '#333',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(250, 112, 154, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 112, 154, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(250, 112, 154, 0.4)'
            }}
          >
            🚪 退出
          </button>
        </div>
      </div>

      {/* 游戏标题 */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '10px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          textShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
          animation: 'slideIn 0.6s ease-out'
        }}>
          🎮 娱乐中心
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.9)',
          marginTop: '10px',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
          选择你喜欢的游戏开始游玩吧！
        </p>
      </div>

      {/* 搜索框和筛选 */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        padding: '0 20px',
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* 搜索框 */}
          <div style={{
            flex: 1,
            minWidth: '250px',
            position: 'relative',
          }}>
            <input
              type="text"
              placeholder="🔍 搜索游戏..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px 14px 50px',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                fontSize: '16px',
                outline: 'none',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '20px',
            }}>
              🔍
            </span>
          </div>

          {/* 收藏筛选 */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              padding: '14px 24px',
              background: showFavoritesOnly
                ? 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
                : 'rgba(255, 255, 255, 0.2)',
              color: showFavoritesOnly ? '#333' : 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: showFavoritesOnly
                ? '0 4px 15px rgba(246, 211, 101, 0.4)'
                : 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              if (!showFavoritesOnly) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!showFavoritesOnly) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            ⭐ {showFavoritesOnly ? '显示全部' : '仅收藏'}
          </button>
        </div>
      </div>

      {/* 游戏区域选择 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        flexWrap: 'wrap',
        marginBottom: '30px',
        padding: '0 20px'
      }}>
        <button
          onClick={() => setSelectedZone('全部')}
          style={{
            padding: '12px 24px',
            background: selectedZone === '全部'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255, 255, 255, 0.2)',
            color: selectedZone === '全部' ? 'white' : 'rgba(255, 255, 255, 0.9)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: selectedZone === '全部'
              ? '0 4px 15px rgba(102, 126, 234, 0.4)'
              : 'none',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            if (selectedZone !== '全部') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedZone !== '全部') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          🎮 全部游戏
        </button>
        {GAME_ZONES.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            style={{
              padding: '12px 24px',
              background: selectedZone === zone.id
                ? zone.color
                : 'rgba(255, 255, 255, 0.2)',
              color: selectedZone === zone.id ? 'white' : 'rgba(255, 255, 255, 0.9)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: selectedZone === zone.id
                ? '0 4px 15px rgba(0, 0, 0, 0.2)'
                : 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              if (selectedZone !== zone.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedZone !== zone.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            {zone.icon} {zone.name}
          </button>
        ))}
      </div>

      {/* 游戏列表 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        width: '100%',
        maxWidth: '1200px',
        padding: '20px'
      }}>
        {isLoadingGames ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            // backdropFilter: 'blur(10px)', // 禁用以提升性能
            borderRadius: '24px',
            padding: '30px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}>
            <SkeletonGameList />
          </div>
        ) : (
          filteredGames.map(({ zone, games: zoneGames }) => {

          return (
            <div key={zone.id} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '30px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}>
              {/* 区域标题 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '25px',
                paddingBottom: '20px',
                borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
              }}>
                <div style={{
                  fontSize: '40px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}>
                  {zone.icon}
                </div>
                <h2 style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: zone.color,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                }}>
                  {zone.name}
                </h2>
                <span style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                }}>
                  {zoneGames.length} 款游戏
                </span>
              </div>

              {/* 该区域的游戏 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px',
              }}>
                {zoneGames.map((game, index) => (
                  <Link
                    key={game.id}
                    href={game.route}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      // backdropFilter: 'blur(10px)', // 禁用 backdrop-filter 以提升性能
                      borderRadius: '20px',
                      padding: '25px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.25)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)'
                    }}
                    >
                      {/* 背景渐变 */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100px',
                        background: game.color,
                        opacity: 0.1,
                        borderRadius: '20px 20px 0 0'
                      }} />
                      
                      {/* 游戏图标 */}
                      <div style={{
                        fontSize: '60px',
                        textAlign: 'center',
                        marginBottom: '15px',
                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {game.icon}
                      </div>

                      {/* 游戏名称 */}
                      <h3 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        margin: '0 0 8px 0',
                        color: '#333',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {game.name}
                      </h3>

                      {/* 游戏描述 */}
                      <p style={{
                        fontSize: '13px',
                        color: '#666',
                        margin: '0 0 15px 0',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        minHeight: '40px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {game.description}
                      </p>

                      {/* 游戏信息标签 */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '15px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <span style={{
                          fontSize: '12px',
                          padding: '4px 10px',
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          borderRadius: '8px',
                          fontWeight: 'bold'
                        }}>
                          {game.difficulty}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          padding: '4px 10px',
                          background: 'rgba(246, 211, 101, 0.1)',
                          color: '#f6d365',
                          borderRadius: '8px',
                          fontWeight: 'bold'
                        }}>
                          {game.category}
                        </span>
                      </div>

                      {/* 收藏按钮 */}
                      <button
                        onClick={(e) => toggleFavorite(game.id, e)}
                        style={{
                          position: 'absolute',
                          top: '15px',
                          right: '15px',
                          background: favoriteGames.includes(game.id)
                            ? 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
                            : 'rgba(255, 255, 255, 0.8)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.3s ease',
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}
                        title={favoriteGames.includes(game.id) ? '取消收藏' : '收藏游戏'}
                      >
                        {favoriteGames.includes(game.id) ? '⭐' : '☆'}
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        }))}
      </div>

      {/* 充值弹窗 */}
      {showRecharge && (
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
            animation: 'slideIn 0.3s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRecharge(false)
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            padding: '40px',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            animation: 'slideIn 0.4s ease-out'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{ 
                margin: 0,
                color: '#333',
                fontSize: '28px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                💰 充值金币
              </h2>
              <button
                onClick={() => setShowRecharge(false)}
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
                  transition: 'all 0.3s ease'
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
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                color: '#555',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                充值金额
              </label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '18px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
            <div style={{ 
              marginBottom: '30px', 
              padding: '20px',
              background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(246, 211, 101, 0.3)'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>将获得</div>
              <div style={{ 
                fontSize: '32px', 
                color: '#333', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>🪙</span>
                <span>{rechargeAmount}</span>
                <span style={{ fontSize: '18px' }}>金币</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleRecharge}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                  color: '#333',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(246, 211, 101, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(246, 211, 101, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(246, 211, 101, 0.4)'
                }}
              >
                确认充值
              </button>
              <button
                onClick={() => setShowRecharge(false)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: '#666',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
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
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 论坛弹窗 */}
      {showForum && user && (
        <Forum
          currentUserId={user.id}
          currentUsername={user.username}
          onClose={() => setShowForum(false)}
        />
      )}
      {showAIChat && (
        <AIChat onClose={() => setShowAIChat(false)} />
      )}
      {showAgent && (
        <Agent onClose={() => setShowAgent(false)} />
      )}
      {showVideoGenerator && (
        <VideoGenerator onClose={() => setShowVideoGenerator(false)} />
      )}
      {showImageGenerator && (
        <ImageGenerator onClose={() => setShowImageGenerator(false)} />
      )}
      {showLeaderboard && user && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} currentUserId={user.id} />
      )}

      {/* 音效控制 */}
      <SoundControl />
    </main>
  )
}
