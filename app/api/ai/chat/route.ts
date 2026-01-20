import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const OPENROUTER_API_KEY = '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'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
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
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'xiaomi/mimo-v2-flash:free',
        messages: messages,
        reasoning: {
          enabled: true
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenRouter API错误:', errorData)
      return NextResponse.json(
        { error: 'AI服务暂时不可用，请稍后重试' },
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
