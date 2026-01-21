import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
    // 优先使用环境变量，如果没有则使用后备 Key（仅用于开发测试）
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'
    const usingEnvVar = !!process.env.OPENROUTER_API_KEY
    
    // 检查 API Key 是否配置
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 10) {
      console.error('OPENROUTER_API_KEY 未正确配置', {
        hasEnvVar: usingEnvVar,
        keyLength: OPENROUTER_API_KEY?.length || 0,
      })
      return NextResponse.json(
        { 
          error: 'AI服务配置错误，请联系管理员',
          details: 'OPENROUTER_API_KEY 未配置或无效',
        },
        { status: 500 }
      )
    }
    
    // 记录使用的 API Key 来源
    console.log('AI 聊天请求:', {
      usingEnvVar,
      apiKeyPrefix: OPENROUTER_API_KEY.substring(0, 20) + '...',
      keyLength: OPENROUTER_API_KEY.length,
    })

    // 验证用户身份
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: '无效的令牌' }, { status: 401 })
    }

    // 获取请求体
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    // 调用OpenRouter API
    // 尝试多个免费模型，如果第一个失败可以尝试其他
    const models = [
      'xiaomi/mimo-v2-flash:free',
      'google/gemini-flash-1.5:free',
      'meta-llama/llama-3.2-3b-instruct:free',
    ]
    
    const selectedModel = process.env.OPENROUTER_MODEL || models[0]
    
    const requestBody = {
      model: selectedModel,
      messages: messages,
      // 只有某些模型支持 reasoning，如果模型不支持会自动忽略
      ...(selectedModel.includes('mimo') ? { reasoning: { enabled: true } } : {}),
    }
    
    console.log('OpenRouter API 请求:', {
      model: requestBody.model,
      messageCount: messages.length,
      apiKeyPrefix: OPENROUTER_API_KEY.substring(0, 20) + '...',
      usingEnvVar,
      url: OPENROUTER_API_URL,
    })
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ''
      try {
        errorText = await response.text()
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText || 'API 请求失败' }
      }
      
      console.error('OpenRouter API错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        errorText: errorText,
        apiKeyPrefix: OPENROUTER_API_KEY.substring(0, 20) + '...',
        usingEnvVar,
        model: requestBody.model,
      })
      
      // 提供更详细的错误信息
      let errorMessage = 'AI服务暂时不可用，请稍后重试'
      let details = errorData.message || errorData.error || errorText || '未知错误'
      
      if (response.status === 401) {
        errorMessage = 'API密钥无效或已过期'
        const isUsingEnvVar = !!process.env.OPENROUTER_API_KEY
        if (isUsingEnvVar) {
          details = 'Vercel 环境变量中的 OPENROUTER_API_KEY 无效或已过期。请访问 https://openrouter.ai/keys 获取新的 API Key，然后在 Vercel 环境变量中更新，并重新部署。'
        } else {
          details = '请检查 OPENROUTER_API_KEY 配置。建议在 Vercel 环境变量中添加 OPENROUTER_API_KEY，或访问 https://openrouter.ai/keys 获取新的 API Key。'
        }
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁，请稍后再试'
        details = '已达到 API 请求频率限制，请等待一段时间后重试'
      } else if (response.status === 400) {
        errorMessage = '请求参数错误'
        details = errorData.message || '请检查请求格式是否正确'
      } else if (response.status === 404) {
        errorMessage = '模型不可用'
        details = '当前模型可能已下线，请稍后重试或联系管理员'
      } else if (response.status >= 500) {
        errorMessage = 'AI服务暂时不可用'
        details = 'OpenRouter 服务器错误，请稍后重试'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: details,
          status: response.status,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // 返回AI响应
    return NextResponse.json({
      message: data.choices[0]?.message?.content || '抱歉，我没有收到回复',
      reasoning: data.choices[0]?.message?.reasoning || null,
    })
  } catch (error) {
    console.error('AI聊天错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
