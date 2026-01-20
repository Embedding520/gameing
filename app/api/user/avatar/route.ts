import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: '无效的令牌' }, { status: 401 })
    }

    const body = await req.json()
    const { avatarUrl } = body

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: '头像URL不能为空' }, { status: 400 })
    }

    const db = await getDatabase()
    const users = db.collection('users')

    let userId: ObjectId
    try {
      userId = new ObjectId(payload.userId)
    } catch {
      return NextResponse.json({ error: '无效的用户 ID' }, { status: 400 })
    }

    await users.updateOne(
      { _id: userId },
      { $set: { avatarUrl } }
    )

    return NextResponse.json({
      success: true,
      message: '头像更新成功',
      avatarUrl,
    })
  } catch (error) {
    console.error('更新头像错误:', error)
    return NextResponse.json(
      { error: '更新头像失败' },
      { status: 500 }
    )
  }
}
