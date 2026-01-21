import { NextRequest, NextResponse } from 'next/server'

// 简单的配置检查端点
export async function GET(request: NextRequest) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'
  const usingEnvVar = !!process.env.OPENROUTER_API_KEY
  
  // 尝试测试 API Key
  let apiTestResult: any = null
  if (OPENROUTER_API_KEY && OPENROUTER_API_KEY.length >= 10) {
    try {
      const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-flash-1.5:free',
          messages: [{ role: 'user', content: 'test' }],
        }),
      })
      
      apiTestResult = {
        status: testResponse.status,
        ok: testResponse.ok,
        statusText: testResponse.statusText,
      }
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        try {
          apiTestResult.error = JSON.parse(errorText)
        } catch {
          apiTestResult.error = errorText
        }
      }
    } catch (error: any) {
      apiTestResult = {
        error: error.message,
      }
    }
  }
  
  return NextResponse.json({
    config: {
      hasApiKey: !!OPENROUTER_API_KEY,
      apiKeyPrefix: OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 20)}...` : '未设置',
      apiKeyLength: OPENROUTER_API_KEY?.length || 0,
      usingEnvVar,
      recommendation: usingEnvVar 
        ? '✅ 使用环境变量（推荐）' 
        : '⚠️ 使用硬编码 Key（建议在 Vercel 环境变量中配置）',
    },
    apiTest: apiTestResult,
    suggestions: !usingEnvVar ? [
      '1. 访问 Vercel 项目设置 → Environment Variables',
      '2. 添加 OPENROUTER_API_KEY = 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',
      '3. 选择 Production 环境',
      '4. 标记为 Sensitive',
      '5. 重新部署项目',
    ] : apiTestResult?.status === 401 ? [
      '⚠️ API Key 无效或已过期',
      '1. 访问 https://openrouter.ai/keys 检查 API Key 状态',
      '2. 如果已过期，创建新的 API Key',
      '3. 在 Vercel 环境变量中更新 OPENROUTER_API_KEY',
      '4. 重新部署项目',
    ] : [],
    timestamp: new Date().toISOString(),
  })
}
