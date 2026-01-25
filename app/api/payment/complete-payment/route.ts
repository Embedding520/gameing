import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const completePaymentSchema = z.object({
  amount: z.number().min(0.01),
  coins: z.number().min(1),
  checkoutId: z.string().optional(), // Creem checkout ID（可选）
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
    const { amount, coins, checkoutId } = completePaymentSchema.parse(body)

    const db = await getDatabase()
    const dbName = db.databaseName
    console.log('数据库连接信息:', {
      databaseName: dbName,
      collections: await db.listCollections().toArray().then(cols => cols.map(c => c.name)),
    })
    
    const payments = db.collection('payments')
    const users = db.collection('users')
    
    console.log('使用的集合:', {
      paymentsCollection: payments.collectionName,
      usersCollection: users.collectionName,
      database: dbName,
    })

    // 检查是否已存在相同的支付记录（通过 checkoutId）
    let existingPayment = null
    if (checkoutId) {
      existingPayment = await payments.findOne({
        creemCheckoutId: checkoutId,
      })
    }

    let paymentId: ObjectId
    let userId: ObjectId

    try {
      userId = new ObjectId(payload.userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID' },
        { status: 400 }
      )
    }

    if (existingPayment) {
      // 如果支付记录已存在，更新它
      console.log('支付记录已存在，更新状态:', {
        paymentId: existingPayment._id.toString(),
        checkoutId,
      })

      // 如果已经是 completed，直接返回
      if (existingPayment.status === 'completed') {
        return NextResponse.json({
          success: true,
          message: '支付已完成',
          paymentId: existingPayment._id.toString(),
          status: 'completed',
        })
      }

      // 更新支付状态
      await payments.updateOne(
        { _id: existingPayment._id },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
          },
        }
      )

      paymentId = existingPayment._id
    } else {
      // 创建新的支付记录
      console.log('创建新的支付记录:', {
        userId: payload.userId,
        username: payload.username,
        amount,
        coins,
        checkoutId,
      })

      const paymentData = {
        userId: payload.userId,
        username: payload.username,
        amount,
        coins,
        status: 'completed',
        paymentMethod: 'creem',
        creemCheckoutId: checkoutId,
        createdAt: new Date(),
        completedAt: new Date(),
      }
      
      console.log('准备插入支付记录到数据库:', {
        collection: 'payments',
        data: paymentData,
      })

      const paymentRecord = await payments.insertOne(paymentData)

      paymentId = paymentRecord.insertedId
      console.log('支付记录插入结果:', {
        paymentId: paymentId.toString(),
        insertedId: paymentRecord.insertedId.toString(),
        acknowledged: paymentRecord.acknowledged,
      })
      
      // 立即验证记录是否真的存在
      const verifyPayment = await payments.findOne({ _id: paymentId })
      if (verifyPayment) {
        console.log('✅ 支付记录验证成功，已存在于数据库:', {
          paymentId: verifyPayment._id.toString(),
          userId: verifyPayment.userId,
          status: verifyPayment.status,
        })
      } else {
        console.error('❌ 支付记录验证失败，数据库中未找到记录！', {
          paymentId: paymentId.toString(),
        })
      }
    }

    // 更新用户金币
    console.log('准备更新用户金币:', {
      userId: userId.toString(),
      coinsToAdd: coins,
    })
    
    const updateResult = await users.updateOne(
      { _id: userId },
      {
        $inc: { coins: coins },
        $push: {
          rechargeHistory: {
            amount: amount,
            coins: coins,
            timestamp: new Date(),
            paymentMethod: 'creem',
          },
        } as any,
      }
    )

    console.log('用户金币更新结果:', {
      userId: payload.userId,
      coins,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged,
    })

    // 验证更新是否成功
    const updatedUser = await users.findOne({ _id: userId })
    if (!updatedUser) {
      console.error('❌ 用户不存在:', payload.userId)
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }
    
    console.log('✅ 用户信息验证成功:', {
      userId: updatedUser._id.toString(),
      username: updatedUser.username,
      coins: updatedUser.coins,
      rechargeHistoryCount: updatedUser.rechargeHistory?.length || 0,
    })
    
    // 最后再次验证支付记录是否存在
    const finalVerify = await payments.findOne({ _id: paymentId })
    console.log('最终验证支付记录:', {
      paymentId: paymentId.toString(),
      exists: !!finalVerify,
      status: finalVerify?.status,
    })

    return NextResponse.json({
      success: true,
      message: '支付记录已创建并更新用户金币',
      paymentId: paymentId.toString(),
      coins: updatedUser.coins || 0,
      status: 'completed',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('完成支付错误:', error)
    return NextResponse.json(
      { error: error?.message || '完成支付失败' },
      { status: 500 }
    )
  }
}
