import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { PowerUpType, POWER_UP_SHOP } from '@/game/powerups'

const purchaseSchema = z.object({
  powerUpType: z.nativeEnum(PowerUpType),
  quantity: z.number().min(1).max(10).default(1),
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
    const { powerUpType, quantity } = purchaseSchema.parse(body)

    // 查找道具信息
    const powerUp = POWER_UP_SHOP.find(p => p.type === powerUpType)
    if (!powerUp) {
      return NextResponse.json(
        { error: '道具不存在' },
        { status: 404 }
      )
    }

    const totalCost = powerUp.price * quantity

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

    // 获取用户信息
    const user = await users.findOne({ _id: userId })
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查金币是否足够
    if ((user.coins || 0) < totalCost) {
      return NextResponse.json(
        { error: '金币不足', required: totalCost, current: user.coins || 0 },
        { status: 400 }
      )
    }

    // 扣除金币并添加道具
    const currentPowerUps = user.powerUps || {}
    const currentCount = currentPowerUps[powerUpType] || 0

    await users.updateOne(
      { _id: userId },
      {
        $set: {
          coins: (user.coins || 0) - totalCost,
          powerUps: {
            ...currentPowerUps,
            [powerUpType]: currentCount + quantity,
          },
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: `成功购买 ${quantity} 个${powerUp.name}`,
      coins: (user.coins || 0) - totalCost,
      powerUps: {
        ...currentPowerUps,
        [powerUpType]: currentCount + quantity,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('购买道具错误:', error)
    return NextResponse.json(
      { error: error?.message || '购买失败' },
      { status: 500 }
    )
  }
}
