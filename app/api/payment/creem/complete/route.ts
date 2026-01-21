import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const completeSchema = z.object({
  paymentId: z.string(),
})

// 手动完成支付（用于无法通过 API 验证的情况）
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
    const { paymentId } = completeSchema.parse(body)

    const db = await getDatabase()
    const payments = db.collection('payments')

    let paymentObjectId: ObjectId
    try {
      paymentObjectId = new ObjectId(paymentId)
    } catch {
      return NextResponse.json(
        { error: '无效的支付 ID' },
        { status: 400 }
      )
    }

    const payment = await payments.findOne({
      _id: paymentObjectId,
      userId: payload.userId,
    })

    if (!payment) {
      return NextResponse.json(
        { error: '支付记录不存在' },
        { status: 404 }
      )
    }

    // 如果已经完成，直接返回
    if (payment.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: '支付已完成',
      })
    }

    // 手动标记为完成
    console.log('手动完成支付:', {
      paymentId: payment._id.toString(),
      userId: payment.userId,
      amount: payment.amount,
      coins: payment.coins,
    })

    await payments.updateOne(
      { _id: payment._id },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          manuallyCompleted: true, // 标记为手动完成
        },
      }
    )

    // 更新用户金币
    const users = db.collection('users')
    let userId: ObjectId
    try {
      userId = new ObjectId(payment.userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID' },
        { status: 400 }
      )
    }

    const updateResult = await users.updateOne(
      { _id: userId },
      {
        $inc: { coins: payment.coins },
        $push: {
          rechargeHistory: {
            amount: payment.amount,
            coins: payment.coins,
            timestamp: new Date(),
            paymentMethod: 'creem',
            manuallyCompleted: true,
          },
        } as any,
      }
    )

    console.log('手动完成支付成功:', {
      paymentId: payment._id.toString(),
      userId: payment.userId,
      coins: payment.coins,
      updateResult: updateResult.modifiedCount,
    })

    return NextResponse.json({
      success: true,
      status: 'completed',
      message: '支付已手动完成，金币已添加到账户',
      coins: payment.coins,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('手动完成支付错误:', error)
    return NextResponse.json(
      { error: error?.message || '操作失败' },
      { status: 500 }
    )
  }
}
