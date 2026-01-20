import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const db = await getDatabase()
    const users = db.collection('users')

    const user = await users.findOne({ username })
    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
    })

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        coins: user.coins || 0,
        totalScore: user.totalScore || 0,
        level: user.level || 1,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('登录错误:', error)
    
    if (error?.message?.includes('Mongo') || error?.name === 'MongoServerError' || error?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: '数据库连接失败，请确保 MongoDB 已启动' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || '登录失败' },
      { status: 500 }
    )
  }
}
