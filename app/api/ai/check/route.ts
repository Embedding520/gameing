import { NextRequest, NextResponse } from 'next/server'

// 简单的配置检查端点
export async function GET(request: NextRequest) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
  
  return NextResponse.json({
    hasApiKey: !!OPENROUTER_API_KEY,
    apiKeyPrefix: OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 20)}...` : '未设置',
    apiKeyLength: OPENROUTER_API_KEY?.length || 0,
    usingEnvVar: !!process.env.OPENROUTER_API_KEY,
    timestamp: new Date().toISOString(),
  })
}
