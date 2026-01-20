import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(1000),
})

// 获取所有帖子
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const posts = db.collection('forum_posts')

    const allPosts = await posts
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      posts: allPosts.map(post => ({
        id: post._id.toString(),
        username: post.username,
        content: post.content,
        createdAt: post.createdAt,
        userId: post.userId.toString(),
      })),
    })
  } catch (error) {
    console.error('获取帖子错误:', error)
    return NextResponse.json(
      { error: '获取帖子失败' },
      { status: 500 }
    )
  }
}

// 创建新帖子
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
    const { content } = createPostSchema.parse(body)

    const db = await getDatabase()
    const posts = db.collection('forum_posts')
    const users = db.collection('users')

    let userId: ObjectId
    try {
      userId = new ObjectId(payload.userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID' },
        { status: 400 }
      )
    }

    const user = await users.findOne({ _id: userId })
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    const result = await posts.insertOne({
      userId,
      username: user.username,
      content: content.trim(),
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      post: {
        id: result.insertedId.toString(),
        username: user.username,
        content: content.trim(),
        createdAt: new Date(),
        userId: userId.toString(),
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }
    console.error('创建帖子错误:', error)
    return NextResponse.json(
      { error: error?.message || '创建帖子失败' },
      { status: 500 }
    )
  }
}
