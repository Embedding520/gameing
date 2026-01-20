import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '无效的 token' },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const users = db.collection('users')
    const gameScores = db.collection('gameScores')

    let userId: ObjectId
    try {
      userId = new ObjectId(payload.userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID' },
        { status: 400 }
      )
    }

    // 获取用户基本信息
    const user = await users.findOne(
      { _id: userId },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 获取游戏统计
    const scores = await gameScores
      .find({ userId: userId.toString() })
      .sort({ playedAt: -1 })
      .limit(100) // 限制最近100条记录
      .toArray()

    // 获取最近游戏记录（用于显示）
    const recentGames = scores.slice(0, 10).map((score: any) => ({
      gameId: score.gameId,
      score: score.score,
      playedAt: score.playedAt,
    }))

    // 计算统计数据
    const gameStats: { [key: string]: any } = {}
    let totalGames = 0
    let bestScore = 0
    let totalPlayTime = 0

    scores.forEach((score: any) => {
      totalGames++
      if (score.score > bestScore) {
        bestScore = score.score
      }
      if (score.playTime) {
        totalPlayTime += score.playTime
      }

      if (!gameStats[score.gameId]) {
        gameStats[score.gameId] = {
          gameId: score.gameId,
          playCount: 0,
          bestScore: 0,
          totalScore: 0,
          lastPlayed: null,
        }
      }

      gameStats[score.gameId].playCount++
      if (score.score > gameStats[score.gameId].bestScore) {
        gameStats[score.gameId].bestScore = score.score
      }
      gameStats[score.gameId].totalScore += score.score
      if (
        !gameStats[score.gameId].lastPlayed ||
        new Date(score.playedAt) > new Date(gameStats[score.gameId].lastPlayed)
      ) {
        gameStats[score.gameId].lastPlayed = score.playedAt
      }
    })

    // 计算排名
    const totalScoreRank = await users.countDocuments({
      totalScore: { $gt: user.totalScore || 0 },
    })
    const coinsRank = await users.countDocuments({
      coins: { $gt: user.coins || 0 },
    })
    const levelRank = await users.countDocuments({
      level: { $gt: user.level || 1 },
    })

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        coins: user.coins || 0,
        totalScore: user.totalScore || 0,
        level: user.level || 1,
        avatarUrl: user.avatarUrl || null,
        createdAt: user.createdAt,
        powerUps: user.powerUps || {},
        gamePowerUps: user.gamePowerUps || {},
      },
      stats: {
        totalGames,
        bestScore,
        totalPlayTime, // 秒
        gameStats: Object.values(gameStats),
        recentGames, // 最近游戏记录
        ranks: {
          totalScore: totalScoreRank + 1,
          coins: coinsRank + 1,
          level: levelRank + 1,
        },
      },
    })
  } catch (error) {
    console.error('获取用户统计错误:', error)
    return NextResponse.json(
      { error: '获取用户统计失败' },
      { status: 500 }
    )
  }
}
