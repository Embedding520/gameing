import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const verifySchema = z.object({
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
    const { paymentId } = verifySchema.parse(body)

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

    // 如果没有 creemCheckoutId，无法验证
    if (!payment.creemCheckoutId) {
      console.error('支付记录缺少 creemCheckoutId:', {
        paymentId: payment._id.toString(),
        payment: {
          _id: payment._id.toString(),
          userId: payment.userId,
          status: payment.status,
          creemCheckoutId: payment.creemCheckoutId,
          checkoutUrl: payment.checkoutUrl,
        },
      })
      return NextResponse.json(
        { 
          error: '支付记录缺少 Creem Checkout ID',
          message: '无法验证支付状态，请联系客服',
          paymentId: payment._id.toString(),
        },
        { status: 400 }
      )
    }

    // 调用 Creem API 检查支付状态
    const CREEM_API_KEY = process.env.CREEM_API_KEY
    const CREEM_API_URL = process.env.CREEM_API_URL || 'https://test-api.creem.io'

    if (!CREEM_API_KEY) {
      return NextResponse.json(
        { error: 'CREEM API 密钥未配置' },
        { status: 500 }
      )
    }

    try {
      // 查询 Creem 支付状态
      // 尝试多个可能的端点
      let creemResponse: Response | null = null
      let creemData: any = null
      let lastError: any = null
      
      // 尝试 1: 查询 checkout
      try {
        console.log('尝试查询 checkout:', {
          checkoutId: payment.creemCheckoutId,
          endpoint: `${CREEM_API_URL}/v1/checkouts/${payment.creemCheckoutId}`,
        })
        
        creemResponse = await fetch(
          `${CREEM_API_URL}/v1/checkouts/${payment.creemCheckoutId}`,
          {
            method: 'GET',
            headers: {
              'x-api-key': CREEM_API_KEY,
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (creemResponse.ok) {
          creemData = await creemResponse.json()
        } else {
          lastError = await creemResponse.text()
        }
      } catch (error: any) {
        console.log('尝试查询 checkout 失败，尝试其他端点:', error.message)
      }
      
      // 如果 checkout 查询失败，尝试查询支付
      if (!creemResponse || !creemResponse.ok) {
        try {
          // 尝试 2: 查询支付（如果 checkout ID 实际上是 payment ID）
          creemResponse = await fetch(
            `${CREEM_API_URL}/v1/payments/${payment.creemCheckoutId}`,
            {
              method: 'GET',
              headers: {
                'x-api-key': CREEM_API_KEY,
                'Content-Type': 'application/json',
              },
            }
          )
          
          if (creemResponse.ok) {
            creemData = await creemResponse.json()
          } else {
            lastError = await creemResponse.text()
          }
        } catch (error: any) {
          console.log('尝试查询 payment 也失败:', error.message)
        }
      }
      
      // 如果都失败了，返回错误
      if (!creemResponse || !creemResponse.ok) {
        const errorText = lastError || (creemResponse ? await creemResponse.text() : '无响应')
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        console.error('Creem API 查询失败:', {
          status: creemResponse?.status || '无响应',
          statusText: creemResponse?.statusText || '无响应',
          error: errorData,
          errorText,
          checkoutId: payment.creemCheckoutId,
          apiUrl: CREEM_API_URL,
          triedEndpoints: ['/v1/checkouts', '/v1/payments'],
        })
        
        // 如果是 404，说明 checkout 不存在
        // 但 checkoutId 是 Stripe 格式，可能需要通过其他方式验证
        if (creemResponse?.status === 404) {
          // 如果 checkoutId 是 Stripe 格式（ch_ 开头），可能 Creem 使用 Stripe
          const isStripeFormat = payment.creemCheckoutId?.startsWith('ch_')
          
          // 对于 Stripe 格式，返回特殊状态码，让前端知道可以使用手动完成
          return NextResponse.json(
            { 
              error: '支付记录在 Creem 中不存在',
              message: isStripeFormat 
                ? '检测到 Stripe 格式的 Checkout ID，无法通过 API 直接查询。如果支付已完成，可以使用"手动完成支付"功能'
                : '可能支付尚未完成，或 Checkout ID 不正确',
              checkoutId: payment.creemCheckoutId,
              isStripeFormat,
              canManualComplete: isStripeFormat, // 标记可以手动完成
              suggestion: isStripeFormat 
                ? '如果支付已完成，请点击"手动完成支付"按钮，或等待 Webhook 自动处理'
                : '请确认支付是否已完成',
            },
            { status: 404 }
          )
        }
        
        return NextResponse.json(
          { 
            error: '无法查询 Creem 支付状态',
            details: errorData.message || errorText,
            status: creemResponse?.status || 500,
          },
          { status: creemResponse?.status || 500 }
        )
      }

      // creemData 已经在上面获取了
      if (!creemData) {
        return NextResponse.json(
          { error: '无法解析 Creem API 响应' },
          { status: 500 }
        )
      }
      
      console.log('Creem API 响应数据:', {
        checkoutId: payment.creemCheckoutId,
        creemData,
        paymentStatus: payment.status,
      })
      
      // 检查支付状态 - 尝试多种可能的字段
      const creemStatus = creemData.status || 
                         creemData.payment_status || 
                         creemData.state ||
                         creemData.checkout_status
      
      // 检查是否已支付 - 尝试多种可能的判断方式
      const isPaid = creemStatus === 'paid' || 
                     creemStatus === 'completed' || 
                     creemStatus === 'succeeded' ||
                     creemStatus === 'success' ||
                     creemData.paid === true ||
                     creemData.completed === true ||
                     creemData.succeeded === true ||
                     (creemData.payment && creemData.payment.status === 'succeeded') ||
                     (creemData.payment && creemData.payment.status === 'completed')
      
      console.log('支付状态判断:', {
        creemStatus,
        isPaid,
        paymentStatus: payment.status,
      })

      if (isPaid) {
        if (payment.status === 'pending') {
          // 支付已完成，但数据库状态还是 pending，手动更新
          console.log('开始更新支付状态和用户金币...')
          
          await payments.updateOne(
            { _id: payment._id },
            {
              $set: {
                status: 'completed',
                completedAt: new Date(),
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
                },
              } as any,
            }
          )

          console.log('支付状态和金币更新完成:', {
            paymentId: payment._id.toString(),
            userId: payment.userId,
            coins: payment.coins,
            updateResult: updateResult.modifiedCount,
          })

          return NextResponse.json({
            success: true,
            status: 'completed',
            message: '支付已验证并完成',
            coins: payment.coins,
            creemStatus,
          })
        } else {
          // 已经完成，直接返回
          return NextResponse.json({
            success: true,
            status: 'completed',
            message: '支付已完成',
            creemStatus,
          })
        }
      } else {
        // 支付未完成
        return NextResponse.json({
          success: false,
          status: 'pending',
          message: '支付仍在处理中',
          creemStatus,
          creemData: creemData, // 返回完整数据用于调试
        })
      }
    } catch (error: any) {
      console.error('验证支付状态错误:', error)
      return NextResponse.json(
        { error: error?.message || '验证失败' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('验证支付错误:', error)
    return NextResponse.json(
      { error: error?.message || '验证失败' },
      { status: 500 }
    )
  }
}
