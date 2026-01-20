import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Veo 3.1 Free API
// 每月100个免费credits
// 官网: https://veo3api.com
const VEO_API_KEY = process.env.VEO_API_KEY

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

    if (!VEO_API_KEY) {
      return NextResponse.json(
        { error: 'VEO_API_KEY 未配置，请在环境变量中设置' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { prompt, duration = 5 } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: '提示词不能为空' }, { status: 400 })
    }

    // 调用Veo 3.1 API
    const response = await fetch('https://api.veo3api.com/v1/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${VEO_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'veo-3.1',
        prompt: prompt.trim(),
        duration: Math.min(Math.max(duration, 1), 10), // 限制1-10秒
        output_format: 'mp4',
        aspect_ratio: '16:9',
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Veo API错误:', errorData)
      return NextResponse.json(
        { error: `API调用失败: ${errorData}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      taskId: data.id || data.task_id,
      status: data.status || 'processing',
      videoUrl: data.video_url || data.url || null,
      provider: 'veo',
      message: '视频生成任务已创建，正在处理中...',
    })
  } catch (error) {
    console.error('Veo视频生成错误:', error)
    return NextResponse.json(
      { error: '视频生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

// 检查任务状态
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: '无效的令牌' }, { status: 401 })
    }

    if (!VEO_API_KEY) {
      return NextResponse.json({ error: 'API未配置' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: '任务ID不能为空' }, { status: 400 })
    }

    const response = await fetch(`https://api.veo3api.com/v1/videos/${taskId}`, {
      headers: {
        Authorization: `Bearer ${VEO_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取任务状态失败')
    }

    const data = await response.json()

    return NextResponse.json({
      status: data.status,
      videoUrl: data.video_url || data.url || null,
      error: data.error || null,
    })
  } catch (error) {
    console.error('检查任务状态错误:', error)
    return NextResponse.json(
      { error: '检查任务状态失败' },
      { status: 500 }
    )
  }
}
