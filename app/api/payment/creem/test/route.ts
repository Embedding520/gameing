import { NextRequest, NextResponse } from 'next/server'

// 测试 CREEM API 连接
export async function GET(request: NextRequest) {
  try {
    const CREEM_API_KEY = process.env.CREEM_API_KEY
    if (!CREEM_API_KEY) {
      return NextResponse.json(
        { error: 'CREEM_API_KEY 未配置' },
        { status: 500 }
      )
    }

    // 尝试调用 CREEM API（可能需要调整端点）
    const testEndpoints = [
      'https://api.creem.io/v1/checkouts',
      'https://api.creem.io/v1/payments',
      'https://api.creem.io/checkouts',
    ]

    const results = []

    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CREEM_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        })
      } catch (error: any) {
        results.push({
          endpoint,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      apiKey: CREEM_API_KEY ? `${CREEM_API_KEY.substring(0, 10)}...` : '未设置',
      testResults: results,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || '测试失败' },
      { status: 500 }
    )
  }
}
