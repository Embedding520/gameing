import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const saveSchema = z.object({
  score: z.number().min(0),
  coins: z.number().min(0),
  level: z.number().min(1),
  gameId: z.string().optional(), // 游戏ID
  playTime: z.number().min(0).optional(), // 游戏时长（秒）
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { score, coins, level, gameId, playTime } = saveSchema.parse(body)

    const db = await getDatabase()
    const users = db.collection('users')

    let userId: ObjectId
    try {
      userId = new ObjectId(payload.userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID' },
        { status: 400 }
      )
    }

    const user = await users.findOne({ _id: userId })
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 计算新等级（基于总分数）
    // 等级公式：每1000分升1级，最低1级
    // 例如：0-999分=1级，1000-1999分=2级，2000-2999分=3级...
    const currentTotalScore = user.totalScore || 0
    const newTotalScore = Math.max(currentTotalScore, score)
    const calculatedLevel = Math.max(1, Math.floor(newTotalScore / 1000) + 1)
    
    // 获取当前等级
    const currentLevel = user.level || 1
    const levelUp = calculatedLevel > currentLevel

    // 更新用户数据
    const updateData: any = {
      coins: coins,
      level: calculatedLevel, // 使用计算出的等级
    }

    // 如果分数更高，更新总分数
    if (score > currentTotalScore) {
      updateData.totalScore = score
    }

    await users.updateOne(
      { _id: userId },
      { $set: updateData }
    )

    // 保存游戏记录
    const gameRecords = db.collection('game_records')
    await gameRecords.insertOne({
      userId: payload.userId,
      username: payload.username,
      score,
      coins,
      level,
      timestamp: new Date(),
    })

    // 如果提供了gameId，同时保存到gameScores集合（用于排行榜）
    if (gameId) {
      const gameScores = db.collection('gameScores')
      await gameScores.insertOne({
        userId: payload.userId,
        gameId,
        score,
        playedAt: new Date(),
        playTime: playTime || 0,
      })
    }

    return NextResponse.json({
      success: true,
      message: '游戏数据已保存',
      levelUp: levelUp || false,
      newLevel: calculatedLevel,
      previousLevel: currentLevel,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('保存游戏数据错误:', error)
    return NextResponse.json(
      { error: error?.message || '保存失败' },
      { status: 500 }
    )
  }
}
