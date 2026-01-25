import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'
import { getDatabase } from '@/lib/db'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// 获取用户的任务历史
export async function GET(request: NextRequest) {
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

    let userObjectId: ObjectId
    try {
      userObjectId = new ObjectId(userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID 格式' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const agentTasks = db.collection('agentTasks')

    // 查询用户的任务历史，按创建时间倒序，最多返回 50 条
    const tasks = await agentTasks
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    // 转换为前端需要的格式
    const formattedTasks = tasks.map((task: any) => ({
      id: task._id.toString(),
      name: task.name,
      status: task.status,
      result: task.result,
      createdAt: task.createdAt.getTime(),
    }))

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
    })
  } catch (error: any) {
    console.error('获取任务历史错误:', error)
    return NextResponse.json(
      { 
        error: '获取任务历史失败',
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

// 保存任务到数据库
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

    let userObjectId: ObjectId
    try {
      userObjectId = new ObjectId(userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID 格式' },
        { status: 400 }
      )
    }

    // 获取请求体
    const body = await request.json()
    const { taskId, name, status, result } = body

    if (!taskId || !name) {
      return NextResponse.json(
        { error: '任务 ID 和名称不能为空' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const agentTasks = db.collection('agentTasks')

    // 检查任务是否已存在
    let taskObjectId: ObjectId
    try {
      taskObjectId = new ObjectId(taskId)
    } catch {
      // 如果 taskId 不是有效的 ObjectId，创建一个新的
      taskObjectId = new ObjectId()
    }

    const existingTask = await agentTasks.findOne({ _id: taskObjectId })

    if (existingTask) {
      // 更新现有任务
      await agentTasks.updateOne(
        { _id: taskObjectId },
        {
          $set: {
            name,
            status,
            result: result || null,
            updatedAt: new Date(),
          },
        }
      )
    } else {
      // 创建新任务
      await agentTasks.insertOne({
        _id: taskObjectId,
        userId: userObjectId,
        name,
        status: status || 'pending',
        result: result || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      taskId: taskObjectId.toString(),
    })
  } catch (error: any) {
    console.error('保存任务错误:', error)
    return NextResponse.json(
      { 
        error: '保存任务失败',
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}

// 删除任务
export async function DELETE(request: NextRequest) {
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

    let userObjectId: ObjectId
    try {
      userObjectId = new ObjectId(userId)
    } catch {
      return NextResponse.json(
        { error: '无效的用户 ID 格式' },
        { status: 400 }
      )
    }

    // 获取任务 ID
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: '任务 ID 不能为空' },
        { status: 400 }
      )
    }

    let taskObjectId: ObjectId
    try {
      taskObjectId = new ObjectId(taskId)
    } catch {
      return NextResponse.json(
        { error: '无效的任务 ID 格式' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const agentTasks = db.collection('agentTasks')

    // 验证任务属于当前用户
    const task = await agentTasks.findOne({ _id: taskObjectId, userId: userObjectId })
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在或无权删除' },
        { status: 404 }
      )
    }

    // 删除任务
    await agentTasks.deleteOne({ _id: taskObjectId, userId: userObjectId })

    return NextResponse.json({
      success: true,
      message: '任务已删除',
    })
  } catch (error: any) {
    console.error('删除任务错误:', error)
    return NextResponse.json(
      { 
        error: '删除任务失败',
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
