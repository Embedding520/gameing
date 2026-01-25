import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/images/generations'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '无效的 token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { prompt, image_size = '1024x1024', num_inference_steps = 20, guidance_scale = 7.5 } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: '请输入图片描述' },
        { status: 400 }
      )
    }

    const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY
    
    if (!SILICONFLOW_API_KEY) {
      return NextResponse.json(
        { error: 'SILICONFLOW_API_KEY 未配置' },
        { status: 500 }
      )
    }

    console.log('生成图片请求:', {
      prompt: prompt.substring(0, 50) + '...',
      image_size,
      num_inference_steps,
      guidance_scale,
    })

    // 调用 SiliconFlow API
    const response = await fetch(SILICONFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt: prompt.trim(),
        image_size,
        batch_size: 1,
        num_inference_steps,
        guidance_scale,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      console.error('SiliconFlow API 错误:', {
        status: response.status,
        error: errorData,
      })

      return NextResponse.json(
        {
          error: '图片生成失败',
          message: errorData.message || errorData.error || `API 返回错误: ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('图片生成成功:', {
      hasImages: !!data.images,
      imageCount: data.images?.length || 0,
    })

    if (!data.images || data.images.length === 0) {
      return NextResponse.json(
        { error: '未生成图片' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images: data.images,
      timings: data.timings,
      seed: data.seed,
    })
  } catch (error: any) {
    console.error('图片生成错误:', error)
    return NextResponse.json(
      { error: error?.message || '图片生成失败' },
      { status: 500 }
    )
  }
}
