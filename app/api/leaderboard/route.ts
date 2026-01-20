import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'

// 排行榜类型
type LeaderboardType = 'totalScore' | 'coins' | 'level'
type TimeRange = 'all' | 'week' | 'month'

// 强制动态渲染
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'totalScore') as LeaderboardType
    const timeRange = (searchParams.get('timeRange') || 'all') as TimeRange
    const gameId = searchParams.get('gameId') || null
    const limit = parseInt(searchParams.get('limit') || '100')

    const db = await getDatabase()
    const users = db.collection('users')

    // 计算时间范围
    let startDate: Date | null = null
    if (timeRange === 'week') {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
    } else if (timeRange === 'month') {
      startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
    }

    // 构建查询条件
    let query: any = {}
    if (startDate) {
      query.createdAt = { $gte: startDate }
    }

    // 如果有游戏ID，需要查询游戏分数记录
    if (gameId) {
      const gameScores = db.collection('gameScores')
      const scores = await gameScores
        .find({ gameId })
        .sort({ score: -1 })
        .limit(limit)
        .toArray()

      // 获取用户信息
      const userIds = scores.map((s: any) => s.userId).filter(Boolean)
      const userMap = new Map()
      
      if (userIds.length > 0) {
        const objectIds = userIds
          .map((id: string) => {
            try {
              return new ObjectId(id)
            } catch {
              return null
            }
          })
          .filter(Boolean) as ObjectId[]
        
        if (objectIds.length > 0) {
          const userList = await users
            .find({ _id: { $in: objectIds } })
            .toArray()
          
          userList.forEach((user: any) => {
            userMap.set(user._id.toString(), user)
          })
        }
      }

      const leaderboard = scores.map((score: any, index: number) => {
        const user = userMap.get(score.userId)
        return {
          rank: index + 1,
          userId: score.userId,
          username: user?.username || '未知用户',
          score: score.score,
          gameId: score.gameId,
          playedAt: score.playedAt,
        }
      })

      return NextResponse.json({ leaderboard, type, timeRange, gameId })
    }

    // 全站排行榜
    let sortField = 'totalScore'
    if (type === 'coins') {
      sortField = 'coins'
    } else if (type === 'level') {
      sortField = 'level'
    }

    const leaderboard = await users
      .find(query)
      .sort({ [sortField]: -1 })
      .limit(limit)
      .project({
        username: 1,
        totalScore: 1,
        coins: 1,
        level: 1,
        createdAt: 1,
      })
      .toArray()

    const result = leaderboard.map((user: any, index: number) => ({
      rank: index + 1,
      userId: user._id.toString(),
      username: user.username,
      totalScore: user.totalScore || 0,
      coins: user.coins || 0,
      level: user.level || 1,
    }))

    return NextResponse.json({
      leaderboard: result,
      type,
      timeRange,
    })
  } catch (error) {
    console.error('获取排行榜错误:', error)
    return NextResponse.json(
      { error: '获取排行榜失败' },
      { status: 500 }
    )
  }
}
