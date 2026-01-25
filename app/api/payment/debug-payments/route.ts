import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

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
    const payments = db.collection('payments')
    
    // 获取所有支付记录（用于调试）
    const allPayments = await payments.find({}).sort({ createdAt: -1 }).limit(50).toArray()
    
    // 获取当前用户的支付记录
    let userId: ObjectId
    try {
      userId = new ObjectId(payload.userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID' },
        { status: 400 }
      )
    }
    
    const userPayments = await payments.find({ userId: payload.userId }).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({
      success: true,
      currentUserId: payload.userId,
      stats: {
        totalPayments: allPayments.length,
        userPayments: userPayments.length,
      },
      allPayments: allPayments.map(p => ({
        id: p._id.toString(),
        userId: p.userId,
        username: p.username,
        amount: p.amount,
        coins: p.coins,
        status: p.status,
        paymentMethod: p.paymentMethod,
        creemCheckoutId: p.creemCheckoutId,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      })),
      userPayments: userPayments.map(p => ({
        id: p._id.toString(),
        userId: p.userId,
        username: p.username,
        amount: p.amount,
        coins: p.coins,
        status: p.status,
        paymentMethod: p.paymentMethod,
        creemCheckoutId: p.creemCheckoutId,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      })),
    })
  } catch (error: any) {
    console.error('调试支付记录错误:', error)
    return NextResponse.json(
      { error: error?.message || '查询失败' },
      { status: 500 }
    )
  }
}
