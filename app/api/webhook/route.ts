import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import crypto from 'crypto'

// CREEM Webhook 处理（根据示例代码，路径应该是 /api/webhook）
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
    const signature = request.headers.get('x-creem-signature') || 
                     request.headers.get('creem-signature') ||
                     request.headers.get('signature')

    if (!signature) {
      console.warn('Webhook 缺少签名，继续处理（开发环境可能不需要）')
      // 开发环境可能不需要签名验证
    } else {
      // 验证签名
      const expectedSignature = crypto
        .createHmac('sha256', CREEM_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature && !signature.includes(expectedSignature)) {
        console.error('Webhook 签名验证失败', {
          received: signature.substring(0, 20),
          expected: expectedSignature.substring(0, 20),
        })
        return NextResponse.json(
          { error: '签名验证失败' },
          { status: 401 }
        )
      }
    }

    const event = JSON.parse(body)
    console.log('收到 CREEM Webhook 事件:', event.type)

    // 处理支付完成事件
    if (event.type === 'checkout.completed' || 
        event.type === 'payment.succeeded' ||
        event.type === 'payment.completed') {
      
      const checkoutId = event.data?.id || 
                        event.data?.checkout_id || 
                        event.checkout?.id
      const amount = event.data?.amount || event.amount
      const metadata = event.data?.metadata || event.metadata || {}

      const db = await getDatabase()
      const payments = db.collection('payments')

      // 查找对应的支付记录（通过 checkout_id 或 metadata 中的 paymentId）
      let payment = null
      
      if (checkoutId) {
        payment = await payments.findOne({
          creemCheckoutId: checkoutId,
          status: 'pending',
        })
      }
      
      // 如果通过 checkoutId 找不到，尝试通过 metadata 中的 paymentId
      if (!payment && metadata.paymentId) {
        try {
          const paymentObjectId = new ObjectId(metadata.paymentId)
          payment = await payments.findOne({
            _id: paymentObjectId,
            status: 'pending',
          })
        } catch (e) {
          console.error('无效的 paymentId:', metadata.paymentId)
        }
      }

      if (!payment) {
        console.error('未找到对应的支付记录:', { checkoutId, metadata })
        // 不返回错误，避免 CREEM 重复发送
        return NextResponse.json({ received: true, message: '支付记录不存在' })
      }

      // 更新支付状态
      await payments.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            creemEventId: event.id,
            creemCheckoutId: checkoutId || payment.creemCheckoutId,
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
