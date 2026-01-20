import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const statusSchema = z.object({
  paymentId: z.string(),
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
    const { paymentId } = statusSchema.parse(body)

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

    return NextResponse.json({
      paymentId: payment._id.toString(),
      status: payment.status,
      amount: payment.amount,
      coins: payment.coins,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('查询支付状态错误:', error)
    return NextResponse.json(
      { error: error?.message || '查询失败' },
      { status: 500 }
    )
  }
}
