import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// 删除帖子
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id
    let postObjectId: ObjectId
    let userId: ObjectId

    try {
      postObjectId = new ObjectId(postId)
      userId = new ObjectId(payload.userId)
    } catch {
      return NextResponse.json(
        { error: '无效的 ID' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const posts = db.collection('forum_posts')

    const post = await posts.findOne({ _id: postObjectId })
    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      )
    }

    // 只能删除自己的帖子
    if (post.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: '无权删除此帖子' },
        { status: 403 }
      )
    }

    await posts.deleteOne({ _id: postObjectId })

    return NextResponse.json({
      success: true,
      message: '帖子已删除',
    })
  } catch (error) {
    console.error('删除帖子错误:', error)
    return NextResponse.json(
      { error: '删除帖子失败' },
      { status: 500 }
    )
  }
}
