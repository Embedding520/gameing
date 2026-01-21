import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET
    if (!CREEM_WEBHOOK_SECRET) {
      console.error('CREEM_WEBHOOK_SECRET 未配置')
      return NextResponse.json(
        { error: 'Webhook 密钥未配置' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get('x-creem-signature')

    if (!signature) {
      return NextResponse.json(
        { error: '缺少签名' },
        { status: 400 }
      )
    }

    // 验证签名
    const expectedSignature = crypto
      .createHmac('sha256', CREEM_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Webhook 签名验证失败')
      return NextResponse.json(
        { error: '签名验证失败' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    
    console.log('收到 Creem Webhook 事件:', {
      type: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString(),
    })

    // 处理支付完成事件
    if (event.type === 'checkout.completed' || event.type === 'payment.succeeded') {
      const checkoutId = event.data?.id || event.data?.checkout_id
      const amount = event.data?.amount
      const metadata = event.data?.metadata || {}

      const db = await getDatabase()
      const payments = db.collection('payments')

      // 查找对应的支付记录
      const payment = await payments.findOne({
        creemCheckoutId: checkoutId,
        status: 'pending',
      })

      if (!payment) {
        console.error('未找到对应的支付记录:', {
          checkoutId,
          eventType: event.type,
          eventData: event.data,
        })
        return NextResponse.json(
          { error: '支付记录不存在' },
          { status: 404 }
        )
      }
      
      console.log('找到支付记录，开始处理:', {
        paymentId: payment._id.toString(),
        userId: payment.userId,
        amount: payment.amount,
        coins: payment.coins,
      })

      // 更新支付状态
      await payments.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            creemEventId: event.id,
          },
        }
      )

      // 更新用户金币
      const users = db.collection('users')
      let userId: ObjectId
      try {
        userId = new ObjectId(payment.userId)
      } catch {
        console.error('无效的用户 ID:', payment.userId)
        return NextResponse.json(
          { error: '无效的用户 ID' },
          { status: 400 }
        )
      }

      await users.updateOne(
        { _id: userId },
        {
          $inc: { coins: payment.coins },
          $push: {
            rechargeHistory: {
              amount: payment.amount,
              coins: payment.coins,
              timestamp: new Date(),
              paymentMethod: 'creem',
            },
          } as any,
        }
      )

      console.log('支付成功处理完成:', payment._id)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook 处理错误:', error)
    return NextResponse.json(
      { error: error?.message || 'Webhook 处理失败' },
      { status: 500 }
    )
  }
}
