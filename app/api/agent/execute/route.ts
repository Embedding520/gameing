import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'
import { getDatabase } from '@/lib/db'

// 强制动态渲染
export const dynamic = 'force-dynamic'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// 任务执行器 - 根据任务描述执行不同的操作
async function executeTask(taskDescription: string, userId: string): Promise<string> {
  // 获取用户信息
  const db = await getDatabase()
  const users = db.collection('users')
  
  let userObjectId: ObjectId
  try {
    userObjectId = new ObjectId(userId)
  } catch {
    return '错误：无效的用户 ID'
  }
  
  const user = await users.findOne({ _id: userObjectId })
  
  if (!user) {
    return '错误：无法获取用户信息'
  }

  const taskLower = taskDescription.toLowerCase()

  // 1. 查询用户数据相关任务
  if (taskLower.includes('金币') || taskLower.includes('coins') || taskLower.includes('余额')) {
    return `您的当前金币余额：${user.coins || 0} 金币`
  }

  if (taskLower.includes('积分') || taskLower.includes('score') || taskLower.includes('分数')) {
    return `您的当前总积分：${user.totalScore || 0} 分，等级：${user.level || 1} 级`
  }

  if (taskLower.includes('签到') || taskLower.includes('checkin') || taskLower.includes('check-in')) {
    const consecutiveDays = user.consecutiveCheckinDays || 0
    const lastCheckin = user.lastCheckinDate 
      ? new Date(user.lastCheckinDate).toLocaleDateString('zh-CN')
      : '从未签到'
    return `签到信息：连续签到 ${consecutiveDays} 天，最后签到日期：${lastCheckin}`
  }

  if (taskLower.includes('收藏') || taskLower.includes('favorite') || taskLower.includes('favourite')) {
    const favoriteGames = user.favoriteGames || []
    if (favoriteGames.length === 0) {
      return '您还没有收藏任何游戏'
    }
    return `您收藏了 ${favoriteGames.length} 个游戏：${favoriteGames.join('、')}`
  }

  // 2. 查询游戏数据相关任务
  if (taskLower.includes('游戏') || taskLower.includes('game')) {
    if (taskLower.includes('统计') || taskLower.includes('数据') || taskLower.includes('分析')) {
      // 查询游戏记录
      const gameRecords = db.collection('gameRecords')
      const records = await gameRecords.find({ userId: userObjectId }).limit(10).toArray()
      
      if (records.length === 0) {
        return '您还没有游戏记录'
      }

      const gameStats = records.reduce((acc: any, record: any) => {
        const gameName = record.gameName || '未知游戏'
        if (!acc[gameName]) {
          acc[gameName] = { count: 0, totalScore: 0 }
        }
        acc[gameName].count++
        acc[gameName].totalScore += record.score || 0
        return acc
      }, {})

      const statsText = Object.entries(gameStats)
        .map(([game, stats]: [string, any]) => 
          `${game}：${stats.count} 次，总分 ${stats.totalScore}`
        )
        .join('\n')

      return `游戏统计（最近 ${records.length} 条记录）：\n${statsText}`
    }
  }

  // 3. 使用 AI 处理其他任务
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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'
  
  try {
    const systemPrompt = `你是一个智能助手，帮助用户执行任务。用户信息：
- 用户名：${user.username}
- 金币：${user.coins || 0}
- 积分：${user.totalScore || 0}
- 等级：${user.level || 1}

请根据用户的任务描述，提供有用的回答或建议。回答要简洁明了，不超过200字。`

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Gameing 智能体',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: taskDescription },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API 错误:', response.status, errorText)
      return `任务执行失败：AI 服务暂时不可用（${response.status}）`
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || '无法获取 AI 响应'
    
    return aiResponse.trim()
  } catch (error: any) {
    console.error('执行任务时出错:', error)
    return `任务执行失败：${error.message || '未知错误'}`
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
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

    const userId = payload.userId
    if (!userId) {
      return NextResponse.json(
        { error: '无效的用户 ID' },
        { status: 400 }
      )
    }

    // 获取任务描述
    const body = await request.json()
    const { taskDescription } = body

    if (!taskDescription || typeof taskDescription !== 'string' || taskDescription.trim().length === 0) {
      return NextResponse.json(
        { error: '任务描述不能为空' },
        { status: 400 }
      )
    }

    if (taskDescription.length > 500) {
      return NextResponse.json(
        { error: '任务描述不能超过 500 个字符' },
        { status: 400 }
      )
    }

    // 执行任务
    const result = await executeTask(taskDescription.trim(), userId)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Agent 执行任务错误:', error)
    return NextResponse.json(
      { 
        error: '任务执行失败',
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
