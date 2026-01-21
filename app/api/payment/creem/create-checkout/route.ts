import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const checkoutSchema = z.object({
  amount: z.number().min(1).max(10000),
  coins: z.number().min(1),
  productId: z.string().optional(), // CREEM 产品 ID（可选，如果提供则使用产品，否则使用金额）
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
    const { amount, coins, productId } = checkoutSchema.parse(body)

    const CREEM_API_KEY = process.env.CREEM_API_KEY
    // 自动检测 API Key 环境并设置对应的 API URL
    let CREEM_API_URL = process.env.CREEM_API_URL
    if (!CREEM_API_URL && CREEM_API_KEY) {
      // 如果 API Key 是测试环境的（包含 test），使用测试环境 URL
      if (CREEM_API_KEY.includes('test') || CREEM_API_KEY.startsWith('creem_test_')) {
        CREEM_API_URL = 'https://test-api.creem.io'
      } else {
        // 否则使用生产环境 URL
        CREEM_API_URL = 'https://api.creem.io'
      }
    } else if (!CREEM_API_URL) {
      // 如果没有 API Key，默认使用生产环境
      CREEM_API_URL = 'https://api.creem.io'
    }
    // 只有当环境变量存在且非空时才使用产品 ID
    const CREEM_PRODUCT_ID = process.env.CREEM_PRODUCT_ID?.trim() || productId?.trim() || undefined
    
    if (!CREEM_API_KEY) {
      return NextResponse.json(
        { error: 'CREEM API 密钥未配置' },
        { status: 500 }
      )
    }
    
    if (!CREEM_API_URL) {
      return NextResponse.json(
        { error: 'CREEM API URL 未配置' },
        { status: 500 }
      )
    }

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

    // 创建支付记录
    const payments = db.collection('payments')
    const paymentRecord = await payments.insertOne({
      userId: payload.userId,
      username: payload.username,
      amount,
      coins,
      status: 'pending',
      paymentMethod: 'creem',
      createdAt: new Date(),
    })

    // 调用 CREEM API 创建支付链接
    // 优先使用环境变量，如果没有则尝试从请求头获取
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    
    // 如果没有配置环境变量，尝试从请求头获取
    if (!baseUrl) {
      const host = request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      if (host) {
        baseUrl = `${protocol}://${host}`
      } else {
        // 最后的回退方案
        baseUrl = 'http://localhost:3000'
      }
    }
    
    // 确保 URL 格式正确（移除末尾的斜杠）
    baseUrl = baseUrl.replace(/\/$/, '')
    
    const successUrl = `${baseUrl}/payment/success?payment_id=${paymentRecord.insertedId.toString()}`
    const cancelUrl = `${baseUrl}/payment/cancel?payment_id=${paymentRecord.insertedId.toString()}`
    
    console.log('支付回调 URL 配置:', {
      baseUrl,
      successUrl,
      cancelUrl,
      usingEnvVar: !!process.env.NEXT_PUBLIC_BASE_URL,
      host: request.headers.get('host'),
    })
    
    // 根据 CREEM 示例，构建请求体
    // 优先使用产品 ID（推荐方式），如果没有产品 ID 则使用金额方式
    const finalProductId = (CREEM_PRODUCT_ID || productId)?.trim()
    let requestBody: any
    
    // 只有当 product_id 是有效的非空字符串时才使用产品方式
    if (finalProductId && finalProductId.length > 0) {
      // 方式1：使用产品 ID（推荐，需要在 CREEM 仪表板中先创建产品）
      // ⚠️ 重要：使用产品 ID 时，绝对不能包含 amount、currency、cancel_url
      requestBody = {
        product_id: finalProductId, // 已经是字符串类型
        success_url: successUrl,
        metadata: {
          userId: payload.userId,
          paymentId: paymentRecord.insertedId.toString(),
          coins: coins,
        },
      }
      console.log('使用产品 ID 创建支付链接:', finalProductId)
    } else {
      // 方式2：使用金额（一次性支付，金额以分为单位）
      // ⚠️ 重要：使用金额方式时，不能包含 product_id
      requestBody = {
        amount: Math.round(amount * 100), // CREEM 使用分为单位（cents）
        currency: 'usd',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: payload.userId,
          paymentId: paymentRecord.insertedId.toString(),
          coins: coins,
        },
      }
      console.log('使用金额创建支付链接:', amount, 'cents:', Math.round(amount * 100))
    }

    // 使用配置的 API URL 构建端点
    const endpoint = `${CREEM_API_URL}/v1/checkouts`

    // 验证请求体，确保不会同时包含两种方式的字段
    if (requestBody.product_id) {
      // 使用产品方式，确保不包含金额相关字段
      delete requestBody.amount
      delete requestBody.currency
      delete requestBody.cancel_url
      // 确保 product_id 是字符串
      requestBody.product_id = String(requestBody.product_id).trim()
    } else {
      // 使用金额方式，确保不包含 product_id
      delete requestBody.product_id
    }
    
    console.log('CREEM API 请求详情:', {
      apiUrl: CREEM_API_URL,
      endpoint,
      apiKey: CREEM_API_KEY ? `${CREEM_API_KEY.substring(0, 20)}...` : '未设置',
      apiKeyPrefix: CREEM_API_KEY?.substring(0, 10),
      requestBody: JSON.stringify(requestBody, null, 2), // 格式化输出以便调试
      usingProduct: !!finalProductId,
      productId: finalProductId,
      headers: {
        'x-api-key': `${CREEM_API_KEY?.substring(0, 20)}...`,
        'Content-Type': 'application/json',
      },
    })

    // 调用 CREEM API
    // 根据 CREEM 文档，应该使用 x-api-key header，而不是 Authorization Bearer
    const creemResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': CREEM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })


    if (!creemResponse.ok) {
      const errorText = await creemResponse.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText, status: creemResponse.status }
      }
      
      console.error('CREEM API 错误详情:', {
        status: creemResponse.status,
        statusText: creemResponse.statusText,
        error: errorData,
        apiUrl: CREEM_API_URL,
        endpoint,
        requestBody,
        usingProduct: !!finalProductId,
        productId: finalProductId,
      })
      
      // 更新支付记录为失败
      await payments.updateOne(
        { _id: paymentRecord.insertedId },
        { $set: { status: 'failed', error: JSON.stringify(errorData) } }
      )

      // 针对不同错误提供详细的提示
      if (creemResponse.status === 400) {
        // 参数验证错误
        const errorMessage = errorData.message || JSON.stringify(errorData)
        const isProductIdError = errorMessage.includes('product_id')
        const hasConflictingFields = errorMessage.includes('should not exist')
        
        return NextResponse.json(
          { 
            error: 'CREEM API 参数错误 (400 Bad Request)',
            message: errorMessage,
            details: errorData,
            suggestions: hasConflictingFields ? [
              '⚠️ 检测到参数冲突错误',
              isProductIdError ? [
                '如果使用 product_id，请确保：',
                '1. 在 Vercel 环境变量中设置 CREEM_PRODUCT_ID（或通过请求传递 productId）',
                '2. 不要同时传递 amount、currency、cancel_url',
                '3. product_id 必须是有效的字符串',
                '',
                '如果不想使用 product_id，请：',
                '1. 删除或清空 CREEM_PRODUCT_ID 环境变量',
                '2. 使用金额方式（不传递 productId）',
              ] : [
                '检查请求参数是否符合 CREEM API 要求',
                '确认 product_id 和 amount 方式不能同时使用',
              ],
            ] : [
              '检查请求参数格式',
              '确认所有必需字段都已提供',
              '查看 CREEM API 文档了解正确的参数格式',
            ],
            debugInfo: {
              usingProductId: !!finalProductId,
              productId: finalProductId,
              requestBody,
            },
          },
          { status: 400 }
        )
      } else if (creemResponse.status === 403) {
        return NextResponse.json(
          { 
            error: 'CREEM API 认证失败 (403 Forbidden)',
            message: '请检查 CREEM_API_KEY 是否正确，或联系 CREEM 支持确认 API 权限',
            details: errorData,
            debugInfo: {
              apiUrl: CREEM_API_URL,
              endpoint,
              apiKeyPrefix: CREEM_API_KEY?.substring(0, 15),
              productId: finalProductId,
              requestBody,
            },
            suggestions: [
              '⚠️ 重要：所有 API Key 都返回 403，这通常是账户权限问题',
              '1. 检查 CREEM 仪表板中账户是否已完全激活',
              '2. 确认测试环境账户是否需要额外验证或设置',
              '3. 检查是否有 IP 白名单限制',
              '4. 确认账户是否有创建支付链接的权限',
              '5. 联系 CREEM 支持，提供 trace_id 让他们检查账户状态',
              '6. 可能需要完成账户设置或验证步骤',
            ],
          },
          { status: 403 }
        )
      } else if (creemResponse.status === 500) {
        return NextResponse.json(
          { 
            error: 'CREEM API 服务器错误 (500 Internal Server Error)',
            message: 'CREEM 服务器返回 500 错误，可能是请求格式不正确或缺少必需参数',
            details: errorData,
            suggestions: [
              '检查请求格式是否符合 CREEM API 文档要求',
              '确认金额单位是否正确（可能需要使用分为单位）',
              '检查是否缺少必需的参数',
              '查看服务器日志获取更详细的错误信息',
              '联系 CREEM 支持确认 API 格式要求',
            ],
            debugInfo: {
              apiUrl: CREEM_API_URL,
              endpoint,
        requestBody,
        usingProduct: !!finalProductId,
        productId: finalProductId,
      },
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          error: '创建支付链接失败', 
          details: errorData,
          message: errorData.message || errorData.error || `CREEM API 返回错误: ${creemResponse.status}`,
        },
        { status: creemResponse.status }
      )
    }

    const checkoutData = await creemResponse.json()
    console.log('CREEM API 响应:', checkoutData)

    // CREEM 可能返回不同的字段名，尝试多种可能
    const checkoutUrl = checkoutData.url || 
                       checkoutData.checkout_url || 
                       checkoutData.payment_url ||
                       checkoutData.link
    const checkoutId = checkoutData.id || 
                       checkoutData.checkout_id || 
                       checkoutData.payment_id

    if (!checkoutUrl) {
      console.error('CREEM API 响应中没有找到支付链接:', checkoutData)
      return NextResponse.json(
        { 
          error: 'CREEM API 响应格式不正确',
          message: '响应中没有找到支付链接 URL',
          details: checkoutData,
        },
        { status: 500 }
      )
    }

    // 更新支付记录，保存 CREEM checkout ID
    await payments.updateOne(
      { _id: paymentRecord.insertedId },
      { 
        $set: { 
          creemCheckoutId: checkoutId,
          checkoutUrl: checkoutUrl,
        } 
      }
    )

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutUrl,
      paymentId: paymentRecord.insertedId.toString(),
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('创建支付链接错误:', error)
    return NextResponse.json(
      { error: error?.message || '创建支付链接失败' },
      { status: 500 }
    )
  }
}
