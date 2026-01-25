import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// 获取收藏列表
export async function GET(request: NextRequest) {
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

    const db = await getDatabase()
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

    const favoriteGames = user.favoriteGames || []

    return NextResponse.json({
      favoriteGames,
    })
  } catch (error) {
    console.error('获取收藏列表错误:', error)
    return NextResponse.json(
      { error: '获取收藏列表失败' },
      { status: 500 }
    )
  }
}

// 添加/删除收藏
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
    const { gameId, action } = body // action: 'add' | 'remove'

    if (!gameId || !action) {
      return NextResponse.json(
        { error: '缺少参数' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
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

    const favoriteGames = user.favoriteGames || []

    if (action === 'add') {
      if (!favoriteGames.includes(gameId)) {
        await users.updateOne(
          { _id: userId },
          { $push: { favoriteGames: gameId } }
        )
      }
    } else if (action === 'remove') {
      await users.updateOne(
        { _id: userId },
        { $pull: { favoriteGames: gameId } }
      )
    } else {
      return NextResponse.json(
        { error: '无效的操作' },
        { status: 400 }
      )
    }

    const updatedUser = await users.findOne({ _id: userId })
    return NextResponse.json({
      success: true,
      favoriteGames: updatedUser?.favoriteGames || [],
    })
  } catch (error) {
    console.error('更新收藏错误:', error)
    return NextResponse.json(
      { error: '更新收藏失败' },
      { status: 500 }
    )
  }
}
