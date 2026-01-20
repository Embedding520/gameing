import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = registerSchema.parse(body)

    const db = await getDatabase()
    const users = db.collection('users')

    const existingUser = await users.findOne({ username })
    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const result = await users.insertOne({
      username,
      password: hashedPassword,
      createdAt: new Date(),
      coins: 0,
      totalScore: 0,
      level: 1,
      rechargeHistory: [],
    })

    const token = generateToken({
      userId: result.insertedId.toString(),
      username,
    })

    return NextResponse.json({
      token,
      user: {
        id: result.insertedId.toString(),
        username,
        coins: 0,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('注册错误:', error)
    
    if (error?.message?.includes('Mongo') || error?.name === 'MongoServerError' || error?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: '数据库连接失败，请确保 MongoDB 已启动' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || '注册失败' },
      { status: 500 }
    )
  }
}
