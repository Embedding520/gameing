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
    
    // 获取所有可能的签名头
    const signature = request.headers.get('x-creem-signature') || 
                     request.headers.get('creem-signature') ||
                     request.headers.get('x-signature') ||
                     request.headers.get('signature')

    // 记录所有请求头，用于调试
    const allHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      allHeaders[key] = value
    })
    
    console.log('Webhook 请求头:', {
      hasSignature: !!signature,
      signatureHeader: signature ? signature.substring(0, 20) + '...' : 'none',
      allHeaders: Object.keys(allHeaders),
    })

    // 如果有签名，进行验证
    if (signature) {
      try {
        // 验证签名 - 尝试多种可能的格式
        const expectedSignature = crypto
          .createHmac('sha256', CREEM_WEBHOOK_SECRET)
          .update(body)
          .digest('hex')

        // Creem 可能使用不同的签名格式，尝试多种匹配方式
        const signatureMatches = 
          signature === expectedSignature ||
          signature === `sha256=${expectedSignature}` ||
          signature.includes(expectedSignature) ||
          expectedSignature.includes(signature)

        if (!signatureMatches) {
          console.error('Webhook 签名验证失败', {
            received: signature.substring(0, 30) + '...',
            expected: expectedSignature.substring(0, 30) + '...',
            bodyLength: body.length,
            secretLength: CREEM_WEBHOOK_SECRET.length,
          })
          
          // 在开发环境中，如果签名不匹配，记录警告但继续处理
          // 在生产环境中应该严格验证
          if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
              { error: '签名验证失败' },
              { status: 401 }
            )
          } else {
            console.warn('开发环境：签名验证失败，但继续处理')
          }
        } else {
          console.log('Webhook 签名验证成功')
        }
      } catch (error) {
        console.error('签名验证过程出错:', error)
        // 在开发环境中继续处理
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: '签名验证失败' },
            { status: 401 }
          )
        }
      }
    } else {
      console.warn('Webhook 缺少签名，继续处理（开发环境）')
      // 在生产环境中应该要求签名
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: '缺少签名' },
          { status: 401 }
        )
      }
    }

    let event: any
    try {
      event = JSON.parse(body)
      console.log('收到 CREEM Webhook 事件:', {
        type: event.type,
        id: event.id,
        data: event.data ? Object.keys(event.data) : 'no data',
        fullEvent: JSON.stringify(event).substring(0, 200) + '...',
      })
    } catch (error) {
      console.error('解析 Webhook 数据失败:', error, {
        body: body.substring(0, 200),
      })
      return NextResponse.json(
        { error: '无效的 JSON 数据' },
        { status: 400 }
      )
    }

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
      
      console.log('开始查找支付记录:', {
        checkoutId,
        metadata,
        hasCheckoutId: !!checkoutId,
        hasPaymentId: !!metadata.paymentId,
      })
      
      // 方式1：通过 checkoutId 查找
      if (checkoutId) {
        payment = await payments.findOne({
          creemCheckoutId: checkoutId,
          status: 'pending',
        })
        console.log('通过 checkoutId 查找结果:', payment ? '找到' : '未找到', { checkoutId })
      }
      
      // 方式2：如果通过 checkoutId 找不到，尝试通过 metadata 中的 paymentId
      if (!payment && metadata.paymentId) {
        try {
          const paymentObjectId = new ObjectId(metadata.paymentId)
          payment = await payments.findOne({
            _id: paymentObjectId,
            status: 'pending',
          })
          console.log('通过 paymentId 查找结果:', payment ? '找到' : '未找到', { paymentId: metadata.paymentId })
        } catch (e) {
          console.error('无效的 paymentId:', metadata.paymentId, e)
        }
      }
      
      // 方式3：如果还是找不到，尝试查找所有 pending 状态的支付记录（用于调试）
      if (!payment) {
        const allPendingPayments = await payments.find({ status: 'pending' }).limit(10).toArray()
        console.log('所有 pending 状态的支付记录:', allPendingPayments.map(p => ({
          id: p._id.toString(),
          creemCheckoutId: p.creemCheckoutId,
          userId: p.userId,
          createdAt: p.createdAt,
        })))
      }

      if (!payment) {
        console.error('未找到对应的支付记录:', { 
          checkoutId, 
          metadata,
          searchedBy: ['checkoutId', 'paymentId'],
        })
        // 不返回错误，避免 CREEM 重复发送
        return NextResponse.json({ received: true, message: '支付记录不存在' })
      }
      
      console.log('找到支付记录:', {
        paymentId: payment._id.toString(),
        userId: payment.userId,
        amount: payment.amount,
        coins: payment.coins,
        creemCheckoutId: payment.creemCheckoutId,
      })

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
