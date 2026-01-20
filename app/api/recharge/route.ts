import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const rechargeSchema = z.object({
  amount: z.number().min(1).max(10000),
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
    const { amount } = rechargeSchema.parse(body)

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

    // 更新金币
    const newCoins = (user.coins || 0) + amount
    await users.updateOne(
      { _id: userId },
      {
        $set: { coins: newCoins },
        $push: {
          rechargeHistory: {
            amount,
            coins: amount,
            timestamp: new Date(),
          },
        } as any,
      }
    )

    return NextResponse.json({
      success: true,
      coins: newCoins,
      message: `成功充值 ${amount} 金币`,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('充值错误:', error)
    return NextResponse.json(
      { error: error?.message || '充值失败' },
      { status: 500 }
    )
  }
}
