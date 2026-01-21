import { NextRequest, NextResponse } from 'next/server'

// 测试 AI 服务配置和连接
export async function GET(request: NextRequest) {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'
    const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

    const diagnostics = {
      timestamp: new Date().toISOString(),
      config: {
        hasApiKey: !!OPENROUTER_API_KEY,
        apiKeyPrefix: OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 20)}...` : '未设置',
        apiKeyLength: OPENROUTER_API_KEY?.length || 0,
        apiUrl: OPENROUTER_API_URL,
        usingEnvVar: !!process.env.OPENROUTER_API_KEY,
      },
      issues: [] as string[],
      suggestions: [] as string[],
      testResult: null as any,
    }

    // 检查配置
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 10) {
      diagnostics.issues.push('❌ OPENROUTER_API_KEY 未配置或无效')
      diagnostics.suggestions.push('在 Vercel 环境变量中添加 OPENROUTER_API_KEY')
    } else if (!process.env.OPENROUTER_API_KEY) {
      diagnostics.issues.push('⚠️ 使用硬编码的 API Key（建议使用环境变量）')
      diagnostics.suggestions.push('在 Vercel 环境变量中添加 OPENROUTER_API_KEY 以提高安全性')
    }

    // 测试 API 连接
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY.length >= 10) {
      try {
        const testResponse = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'xiaomi/mimo-v2-flash:free',
            messages: [
              {
                role: 'user',
                content: '你好',
              },
            ],
          }),
        })

        const responseText = await testResponse.text()
        let responseData: any = {}
        
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText }
        }

        diagnostics.testResult = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok,
          response: responseData,
        }

        if (testResponse.status === 401) {
          diagnostics.issues.push('❌ API Key 无效或已过期')
          diagnostics.suggestions.push(
            '1. 检查 API Key 是否正确',
            '2. 访问 https://openrouter.ai/keys 获取新的 API Key',
            '3. 在 Vercel 环境变量中更新 OPENROUTER_API_KEY'
          )
        } else if (testResponse.status === 429) {
          diagnostics.issues.push('⚠️ API 请求频率限制')
          diagnostics.suggestions.push('等待一段时间后重试，或升级 OpenRouter 账户')
        } else if (!testResponse.ok) {
          diagnostics.issues.push(`⚠️ API 返回错误: ${testResponse.status} ${testResponse.statusText}`)
          diagnostics.suggestions.push('检查 OpenRouter API 状态或联系支持')
        } else {
          diagnostics.suggestions.push('✅ AI 服务连接测试成功！')
        }
      } catch (error: any) {
        diagnostics.testResult = {
          error: error.message,
        }
        diagnostics.issues.push(`⚠️ API 连接测试失败: ${error.message}`)
        diagnostics.suggestions.push('检查网络连接或 OpenRouter API 状态')
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
