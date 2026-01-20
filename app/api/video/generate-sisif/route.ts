import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Sisif Video Generation API
// 注册即送35 credits，无需信用卡
// 官网: https://sisif.ai
const SISIF_API_KEY = process.env.SISIF_API_KEY

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

    if (!SISIF_API_KEY) {
      return NextResponse.json(
        { error: 'SISIF_API_KEY 未配置，请在环境变量中设置' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { prompt, duration = 5, resolution = '540x960' } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: '提示词不能为空' }, { status: 400 })
    }

    // 调用Sisif API
    const response = await fetch('https://api.sisif.ai/v1/videos/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SISIF_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        duration: Math.min(Math.max(duration, 1), 10), // 限制1-10秒
        resolution: resolution, // '540x960' 或 '720x1280'
      }),
    })

    if (!response.ok) {
      let errorMessage = 'API调用失败'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
        console.error('Sisif API错误响应:', errorData)
      } catch (e) {
        const errorText = await response.text()
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
        console.error('Sisif API错误文本:', errorText)
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Sisif API响应:', data)

    // 检查响应格式
    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      taskId: data.id || data.task_id || data.taskId,
      status: data.status || 'processing',
      videoUrl: data.video_url || data.videoUrl || data.url || null,
      provider: 'sisif',
      message: '视频生成任务已创建，正在处理中...',
    })
  } catch (error) {
    console.error('Sisif视频生成错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { error: `视频生成失败: ${errorMessage}` },
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

    if (!SISIF_API_KEY) {
      return NextResponse.json({ error: 'API未配置' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: '任务ID不能为空' }, { status: 400 })
    }

    const response = await fetch(`https://api.sisif.ai/v1/videos/${taskId}`, {
      headers: {
        Authorization: `Bearer ${SISIF_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取任务状态失败')
    }

    const data = await response.json()

    return NextResponse.json({
      status: data.status, // 'processing', 'completed', 'failed'
      videoUrl: data.video_url || null,
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
