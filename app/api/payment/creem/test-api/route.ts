import { NextRequest, NextResponse } from 'next/server'

// 测试 CREEM API 连接和权限
export async function GET(request: NextRequest) {
  try {
    const CREEM_API_KEY = process.env.CREEM_API_KEY
    const CREEM_API_URL = process.env.CREEM_API_URL || 'https://test-api.creem.io'
    
    if (!CREEM_API_KEY) {
      return NextResponse.json(
        { error: 'CREEM_API_KEY 未配置' },
        { status: 500 }
      )
    }

    // 尝试不同的 API 端点来测试权限
    const testEndpoints = [
      { path: '/v1/checkouts', method: 'POST', body: { amount: 100, currency: 'usd' } },
      { path: '/v1/products', method: 'GET' },
      { path: '/v1/account', method: 'GET' },
    ]

    const results = []

    for (const test of testEndpoints) {
      try {
        const url = `${CREEM_API_URL}${test.path}`
        const options: any = {
          method: test.method,
          headers: {
            'x-api-key': CREEM_API_KEY,
            'Content-Type': 'application/json',
          },
        }

        if (test.body) {
          options.body = JSON.stringify(test.body)
        }

        const response = await fetch(url, options)
        const responseText = await response.text()
        let responseData: any = {}
        
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText }
        }

        results.push({
          endpoint: test.path,
          method: test.method,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          response: responseData,
        })
      } catch (error: any) {
        results.push({
          endpoint: test.path,
          method: test.method,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      apiKey: CREEM_API_KEY ? `${CREEM_API_KEY.substring(0, 15)}...` : '未设置',
      apiUrl: CREEM_API_URL,
      testResults: results,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || '测试失败' },
      { status: 500 }
    )
  }
}
