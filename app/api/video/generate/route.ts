import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// 视频生成API配置
// 你可以根据需要切换不同的API提供商
// 如果没有配置API密钥，默认使用mock模式
const VIDEO_API_PROVIDER = process.env.VIDEO_API_PROVIDER || 'mock' // 'replicate' | 'stability' | 'mock'

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
    const { prompt, duration = 5, width = 1024, height = 576 } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: '提示词不能为空' }, { status: 400 })
    }

    // 根据配置的提供商调用不同的API
    let result
    switch (VIDEO_API_PROVIDER) {
      case 'replicate':
        // 检查是否有API密钥，如果没有则使用mock模式
        if (process.env.REPLICATE_API_TOKEN) {
          result = await generateWithReplicate(prompt, duration, width, height)
        } else {
          console.log('REPLICATE_API_TOKEN未配置，使用演示模式')
          result = await generateMockVideo(prompt, duration)
        }
        break
      case 'stability':
        // 检查是否有API密钥，如果没有则使用mock模式
        if (process.env.STABILITY_API_KEY) {
          result = await generateWithStability(prompt, duration, width, height)
        } else {
          console.log('STABILITY_API_KEY未配置，使用演示模式')
          result = await generateMockVideo(prompt, duration)
        }
        break
      case 'sisif':
        // 使用Sisif API（推荐：注册送35 credits）
        if (process.env.SISIF_API_KEY) {
          // 重定向到sisif路由
          throw new Error('请使用 /api/video/generate-sisif 路由')
        } else {
          console.log('SISIF_API_KEY未配置，使用演示模式')
          result = await generateMockVideo(prompt, duration)
        }
        break
      case 'veo':
        // 使用Veo 3.1 API（推荐：每月100免费credits）
        if (process.env.VEO_API_KEY) {
          // 重定向到veo路由
          throw new Error('请使用 /api/video/generate-veo 路由')
        } else {
          console.log('VEO_API_KEY未配置，使用演示模式')
          result = await generateMockVideo(prompt, duration)
        }
        break
      case 'mock':
      default:
        // 返回模拟数据，用于演示
        result = await generateMockVideo(prompt, duration)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('视频生成错误:', error)
    return NextResponse.json(
      { error: '视频生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

// Replicate API (需要配置 REPLICATE_API_TOKEN)
async function generateWithReplicate(
  prompt: string,
  duration: number,
  width: number,
  height: number
) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN 未配置')
  }

  // 使用 Stable Video Diffusion 模型
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
    },
    body: JSON.stringify({
      version: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
      input: {
        image: '', // 如果需要图片到视频，这里放图片URL
        motion_bucket_id: 127,
        cond_aug: 0.02,
        decoding_t: 14,
        num_frames: Math.min(duration * 8, 25), // 限制帧数
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Replicate API错误: ${error}`)
  }

  const data = await response.json()
  
  // Replicate返回的是预测任务，需要轮询获取结果
  return {
    taskId: data.id,
    status: data.status,
    videoUrl: data.output?.[0] || null,
    provider: 'replicate',
    message: '视频生成任务已创建，正在处理中...',
  }
}

// Stability AI API (需要配置 STABILITY_API_KEY)
async function generateWithStability(
  prompt: string,
  duration: number,
  width: number,
  height: number
) {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY
  if (!STABILITY_API_KEY) {
    throw new Error('STABILITY_API_KEY 未配置')
  }

  const response = await fetch(
    'https://api.stability.ai/v2alpha/generation/image-to-video',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        image: '', // 需要先有图片
        seed: 0,
        cfg_scale: 1.8,
        motion_bucket_id: 127,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Stability API错误: ${error}`)
  }

  const data = await response.json()
  return {
    taskId: data.id,
    status: data.status,
    videoUrl: data.video || null,
    provider: 'stability',
    message: '视频生成任务已创建',
  }
}

// 模拟视频生成（用于演示，不实际调用API）
async function generateMockVideo(prompt: string, duration: number) {
  try {
    // 模拟API延迟（2-3秒）
    const delay = 2000 + Math.random() * 1000
    await new Promise((resolve) => setTimeout(resolve, delay))

    // 返回一个示例视频URL（你可以替换为实际的视频URL）
    // 这里使用一个公开的示例视频
    return {
      taskId: `mock-${Date.now()}`,
      status: 'completed',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      provider: 'mock',
      message: '这是演示模式，请配置实际的API密钥以使用真实视频生成功能',
      prompt: prompt,
    }
  } catch (error) {
    console.error('Mock视频生成错误:', error)
    throw new Error('演示模式生成失败')
  }
}

// 检查任务状态（用于轮询）
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

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')
    const provider = searchParams.get('provider') || 'replicate'

    if (!taskId) {
      return NextResponse.json({ error: '任务ID不能为空' }, { status: 400 })
    }

    let result
    if (provider === 'replicate') {
      const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
      if (!REPLICATE_API_TOKEN) {
        return NextResponse.json({ error: 'API未配置' }, { status: 500 })
      }

      const response = await fetch(
        `https://api.replicate.com/v1/predictions/${taskId}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_TOKEN}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取任务状态失败')
      }

      const data = await response.json()
      result = {
        status: data.status,
        videoUrl: data.output?.[0] || null,
        error: data.error || null,
      }
    } else {
      // 其他提供商的轮询逻辑
      result = {
        status: 'completed',
        videoUrl: null,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('检查任务状态错误:', error)
    return NextResponse.json(
      { error: '检查任务状态失败' },
      { status: 500 }
    )
  }
}
