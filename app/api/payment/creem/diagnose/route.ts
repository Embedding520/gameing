import { NextRequest, NextResponse } from 'next/server'

// 诊断 CREEM 配置问题
export async function GET(request: NextRequest) {
  try {
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
    const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET
    const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
      config: {
        hasApiKey: !!CREEM_API_KEY,
        apiKeyPrefix: CREEM_API_KEY ? `${CREEM_API_KEY.substring(0, 15)}...` : '未设置',
        apiKeyLength: CREEM_API_KEY?.length || 0,
        apiUrl: CREEM_API_URL,
        hasWebhookSecret: !!CREEM_WEBHOOK_SECRET,
        baseUrl: NEXT_PUBLIC_BASE_URL || '未设置',
      },
      issues: [] as string[],
      suggestions: [] as string[],
      testResults: null as any,
    }

    // 检查配置问题
    if (!CREEM_API_KEY) {
      diagnostics.issues.push('❌ CREEM_API_KEY 未配置')
      diagnostics.suggestions.push('在 Vercel 环境变量中添加 CREEM_API_KEY')
    } else {
      // 检查 API Key 格式
      if (!CREEM_API_KEY.startsWith('creem_')) {
        diagnostics.issues.push('⚠️ API Key 格式可能不正确（应该以 creem_ 开头）')
      }
      
      // 检查测试环境 vs 生产环境
      const isTestKey = CREEM_API_KEY.includes('test')
      const isTestUrl = CREEM_API_URL.includes('test-api')
      
      if (isTestKey && !isTestUrl) {
        diagnostics.issues.push('⚠️ 检测到测试环境的 API Key，但 API URL 是生产环境')
        diagnostics.suggestions.push('将 CREEM_API_URL 设置为 https://test-api.creem.io')
      } else if (!isTestKey && isTestUrl) {
        diagnostics.issues.push('⚠️ 检测到生产环境的 API Key，但 API URL 是测试环境')
        diagnostics.suggestions.push('将 CREEM_API_URL 设置为 https://api.creem.io')
      }
    }

    if (!CREEM_API_URL) {
      diagnostics.issues.push('❌ CREEM_API_URL 未配置')
    }

    if (!CREEM_WEBHOOK_SECRET) {
      diagnostics.issues.push('⚠️ CREEM_WEBHOOK_SECRET 未配置（Webhook 功能可能无法使用）')
    }

    if (!NEXT_PUBLIC_BASE_URL) {
      diagnostics.issues.push('⚠️ NEXT_PUBLIC_BASE_URL 未配置（支付回调可能失败）')
      diagnostics.suggestions.push('设置 NEXT_PUBLIC_BASE_URL 为你的 Vercel 域名')
    }

    // 如果 API Key 存在，尝试测试连接
    if (CREEM_API_KEY) {
      try {
        // 尝试调用一个简单的端点来测试权限
        const testUrl = `${CREEM_API_URL}/v1/account` || `${CREEM_API_URL}/v1/products`
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'x-api-key': CREEM_API_KEY,
            'Content-Type': 'application/json',
          },
        })

        const responseText = await response.text()
        let responseData: any = {}
        
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText }
        }

        diagnostics.testResults = {
          endpoint: testUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          response: responseData,
        }

        if (response.status === 403) {
          diagnostics.issues.push('❌ API Key 认证失败 (403 Forbidden)')
          diagnostics.suggestions.push(
            '1. 检查 API Key 是否正确复制（不要有多余空格）',
            '2. 确认 Creem 账户是否已完全激活',
            '3. 检查账户是否有创建支付链接的权限',
            '4. 联系 Creem 支持确认账户状态',
            '5. 确认 API Key 和 API URL 环境匹配（测试/生产）'
          )
        } else if (response.status === 401) {
          diagnostics.issues.push('❌ API Key 无效 (401 Unauthorized)')
          diagnostics.suggestions.push('检查 API Key 是否正确')
        } else if (!response.ok) {
          diagnostics.issues.push(`⚠️ API 返回错误: ${response.status} ${response.statusText}`)
        } else {
          diagnostics.suggestions.push('✅ API 连接测试成功！')
        }
      } catch (error: any) {
        diagnostics.testResults = {
          error: error.message,
        }
        diagnostics.issues.push(`⚠️ API 连接测试失败: ${error.message}`)
      }
    }

    return NextResponse.json(diagnostics, {
      status: diagnostics.issues.some(issue => issue.startsWith('❌')) ? 500 : 200,
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error?.message || '诊断失败',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
