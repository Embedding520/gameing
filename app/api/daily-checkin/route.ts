import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// 获取今天的日期字符串（YYYY-MM-DD）
function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// 计算连续签到天数
function calculateConsecutiveDays(checkinHistory: string[]): number {
  if (checkinHistory.length === 0) return 0
  
  // 按日期排序（最新的在前）
  const sorted = [...checkinHistory].sort().reverse()
  
  let consecutive = 0
  const today = new Date(getTodayString())
  
  for (let i = 0; i < sorted.length; i++) {
    const checkinDate = new Date(sorted[i])
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    
    // 检查是否是连续的一天
    if (checkinDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
      consecutive++
    } else {
      break
    }
  }
  
  return consecutive
}

// 计算签到奖励
function calculateReward(consecutiveDays: number): number {
  // 基础奖励：10金币
  // 连续签到奖励递增：每连续一天额外+5金币，最高50金币
  const baseReward = 10
  const bonus = Math.min(consecutiveDays * 5, 40)
  return baseReward + bonus
}

// 获取签到状态
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

    const checkinHistory = user.checkinHistory || []
    const lastCheckin = checkinHistory.length > 0 ? checkinHistory[checkinHistory.length - 1] : null
    const today = getTodayString()
    const hasCheckedInToday = lastCheckin === today
    
    const consecutiveDays = calculateConsecutiveDays(checkinHistory)
    const nextReward = calculateReward(consecutiveDays + 1)

    return NextResponse.json({
      hasCheckedInToday,
      consecutiveDays,
      nextReward,
      checkinHistory: checkinHistory.slice(-7), // 返回最近7天的签到记录
    })
  } catch (error) {
    console.error('获取签到状态错误:', error)
    return NextResponse.json(
      { error: '获取签到状态失败' },
      { status: 500 }
    )
  }
}

// 执行签到
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

    const checkinHistory = user.checkinHistory || []
    const today = getTodayString()
    const lastCheckin = checkinHistory.length > 0 ? checkinHistory[checkinHistory.length - 1] : null
    
    // 检查今天是否已经签到
    if (lastCheckin === today) {
      return NextResponse.json(
        { error: '今天已经签到过了' },
        { status: 400 }
      )
    }

    // 计算连续签到天数
    let newConsecutiveDays = 1
    
    if (lastCheckin) {
      const lastDate = new Date(lastCheckin)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // 如果间隔正好是1天，连续天数+1
      if (daysDiff === 1) {
        const consecutiveDays = calculateConsecutiveDays(checkinHistory)
        newConsecutiveDays = consecutiveDays + 1
      }
      // 如果间隔超过1天，重置为1
      // 如果间隔是0天（同一天），不应该到这里（前面已经检查过了）
    }
    const reward = calculateReward(newConsecutiveDays)

    // 更新用户数据
    const newCheckinHistory = [...checkinHistory, today]
    const updateData: any = {
      $set: {
        checkinHistory: newCheckinHistory,
        lastCheckinDate: today,
        consecutiveCheckinDays: newConsecutiveDays,
      },
      $inc: {
        coins: reward,
      },
    }

    console.log('签到数据更新:', {
      userId: userId.toString(),
      today,
      newConsecutiveDays,
      reward,
      checkinHistoryLength: newCheckinHistory.length,
    })

    const result = await users.updateOne(
      { _id: userId },
      updateData
    )

    console.log('数据库更新结果:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    })

    if (result.matchedCount === 0) {
      console.error('用户未找到，无法更新签到数据')
      return NextResponse.json(
        { error: '更新失败，用户不存在' },
        { status: 500 }
      )
    }

    // 验证数据是否已保存
    const updatedUser = await users.findOne({ _id: userId })
    console.log('更新后的用户数据:', {
      checkinHistory: updatedUser?.checkinHistory,
      lastCheckinDate: updatedUser?.lastCheckinDate,
      consecutiveCheckinDays: updatedUser?.consecutiveCheckinDays,
      coins: updatedUser?.coins,
    })

    return NextResponse.json({
      success: true,
      reward,
      consecutiveDays: newConsecutiveDays,
      newCoins: (user.coins || 0) + reward,
      message: `签到成功！获得 ${reward} 金币`,
    })
  } catch (error) {
    console.error('签到错误:', error)
    return NextResponse.json(
      { error: '签到失败' },
      { status: 500 }
    )
  }
}
