'use client'

import { useState, useRef, useEffect } from 'react'

interface Task {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  createdAt: number
}

interface AgentProps {
  onClose: () => void
}

export default function Agent({ onClose }: AgentProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTask, setCurrentTask] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [input, setInput] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const tasksRef = useRef<Task[]>([])

  // 同步 tasksRef 和 tasks 状态
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [tasks])

  // 加载任务历史
  useEffect(() => {
    const loadTaskHistory = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoadingHistory(false)
          return
        }

        const response = await fetch('/api/agent/tasks', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.tasks) {
            setTasks(data.tasks)
          }
        }
      } catch (error) {
        console.error('加载任务历史失败:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadTaskHistory()
  }, [])

  // 创建新任务
  const createTask = (taskName: string): Task => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: taskName,
      status: 'pending',
      createdAt: Date.now(),
    }
    return newTask
  }

  // 更新任务状态
  const updateTaskStatus = async (taskId: string, status: Task['status'], result?: string) => {
    // 更新本地状态
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status, result }
          : task
      )
    )

    // 保存到数据库
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const task = tasksRef.current.find(t => t.id === taskId)
      if (!task) return

      await fetch('/api/agent/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId,
          name: task.name,
          status,
          result,
        }),
      })
    } catch (error) {
      console.error('保存任务状态失败:', error)
      // 不阻塞 UI，静默失败
    }
  }

  // 添加任务到列表
  const addTask = async (task: Task) => {
    setTasks(prevTasks => [...prevTasks, task])
    
    // 立即保存到数据库
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch('/api/agent/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            taskId: task.id,
            name: task.name,
            status: task.status,
          }),
        })
      }
    } catch (error) {
      console.error('保存新任务失败:', error)
      // 不阻塞 UI，静默失败
    }
    
    return task.id
  }

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    if (deletingTaskId || !confirm('确定要删除这个任务吗？')) {
      return
    }

    setDeletingTaskId(taskId)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('请先登录')
      }

      const response = await fetch(`/api/agent/tasks?taskId=${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '删除任务失败')
      }

      // 从列表中移除任务
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    } catch (error: any) {
      console.error('删除任务错误:', error)
      alert(error.message || '删除任务失败')
    } finally {
      setDeletingTaskId(null)
    }
  }

  // 重试任务
  const handleRetryTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || isRunning) return

    // 创建新任务（使用相同的任务描述）
    const newTask = createTask(task.name)
    const newTaskId = await addTask(newTask)
    
    setCurrentTask(newTaskId)
    setIsRunning(true)
    
    await updateTaskStatus(newTaskId, 'running')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('请先登录')
      }

      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskDescription: task.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '任务执行失败')
      }

      await updateTaskStatus(newTaskId, 'completed', data.result || '任务执行完成')
    } catch (error: any) {
      console.error('任务执行错误:', error)
      await updateTaskStatus(
        newTaskId, 
        'failed', 
        error.message || '任务执行失败，请稍后重试'
      )
    } finally {
      setCurrentTask(null)
      setIsRunning(false)
    }
  }

  // 处理任务提交
  const handleSubmitTask = async () => {
    if (!input.trim() || isRunning) return

    const taskName = input.trim()
    setInput('')
    
    // 创建新任务
    const newTask = createTask(taskName)
    const taskId = await addTask(newTask)
    
    // 设置当前任务
    setCurrentTask(taskId)
    setIsRunning(true)
    
    // 更新任务状态为执行中
    await updateTaskStatus(taskId, 'running')

    try {
      // 获取用户 token
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('请先登录')
      }

      // 调用 Agent API 执行任务
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskDescription: taskName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '任务执行失败')
      }

      // 更新任务状态为完成
      updateTaskStatus(taskId, 'completed', data.result || '任务执行完成')
    } catch (error: any) {
      console.error('任务执行错误:', error)
      // 更新任务状态为失败
      await updateTaskStatus(
        taskId, 
        'failed', 
        error.message || '任务执行失败，请稍后重试'
      )
    } finally {
      setCurrentTask(null)
      setIsRunning(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(30px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '700px',
          height: '80vh',
          maxHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid #e0e0e0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '20px 20px 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              🤖
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                智能体
              </h2>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px' }}>
                自动化任务执行助手
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'white',
              padding: '0',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
            }}
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* 任务列表 */}
          {loadingHistory ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '14px' }}>
                加载任务历史中...
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                还没有任务
              </div>
              <div style={{ fontSize: '14px' }}>
                输入任务描述，智能体将帮你自动执行
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: '#333',
                  }}>
                    {task.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: task.status === 'completed' 
                      ? '#d4edda' 
                      : task.status === 'running'
                      ? '#fff3cd'
                      : task.status === 'failed'
                      ? '#f8d7da'
                      : '#e9ecef',
                    color: task.status === 'completed'
                      ? '#155724'
                      : task.status === 'running'
                      ? '#856404'
                      : task.status === 'failed'
                      ? '#721c24'
                      : '#6c757d',
                  }}>
                    {task.status === 'completed' ? '✅ 完成' :
                     task.status === 'running' ? '⏳ 执行中' :
                     task.status === 'failed' ? '❌ 失败' :
                     '⏸️ 等待'}
                  </div>
                </div>
                {task.result && (
                  <div style={{
                    fontSize: '13px',
                    color: '#666',
                    marginTop: '8px',
                    padding: '8px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {task.result}
                  </div>
                )}
                <div style={{
                  fontSize: '11px',
                  color: '#999',
                  marginTop: '8px',
                }}>
                  {new Date(task.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #e0e0e0',
            background: '#ffffff',
            borderRadius: '0 0 20px 20px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入任务描述，例如：帮我分析今天的游戏数据..."
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitTask()
                }
              }}
              style={{
                flex: 1,
                minHeight: '50px',
                maxHeight: '100px',
                padding: '12px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: '#f8f9fa',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                e.currentTarget.style.background = '#ffffff'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.background = '#f8f9fa'
              }}
            />
            <button
              onClick={handleSubmitTask}
              disabled={!input.trim() || isRunning}
              style={{
                padding: '12px 24px',
                background: input.trim() && !isRunning
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e0e0e0',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: input.trim() && !isRunning ? 'pointer' : 'not-allowed',
                boxShadow: input.trim() && !isRunning
                  ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                  : 'none',
                transition: 'all 0.3s ease',
                opacity: input.trim() && !isRunning ? 1 : 0.6,
                height: '50px',
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !isRunning) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (input.trim() && !isRunning) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                }
              }}
            >
              {isRunning ? '执行中...' : '执行任务'}
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#999' }}>
              按 Enter 提交，Shift + Enter 换行
            </span>
            <span style={{ fontSize: '11px', color: '#999' }}>
              {input.length}/500
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
