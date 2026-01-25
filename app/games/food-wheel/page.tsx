'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FoodOption {
  name: string
  icon: string
  color: string
  weight: number
  isCustom?: boolean // 标记是否为自定义菜品
}

const DEFAULT_FOODS: Omit<FoodOption, 'weight'>[] = [
  { name: '鸡公煲', icon: '🍲', color: '#FF6B6B' },
  { name: '炒菜', icon: '🥘', color: '#4ECDC4' },
  { name: '沙县', icon: '🍜', color: '#FFE66D' },
  { name: '面食', icon: '🍝', color: '#95E1D3' },
  { name: '米粉', icon: '🍜', color: '#F38181' },
  { name: '其他', icon: '🍽️', color: '#AA96DA' },
]

const FOOD_ICONS = ['🍲', '🥘', '🍜', '🍝', '🍱', '🍛', '🍙', '🍚', '🍣', '🍤', '🍥', '🥟', '🥠', '🥡', '🍢', '🍡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪', '🏺']

const FOOD_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FF9A9E', '#FAD0C4', '#FFD1FF', '#A8E6CF', '#FFD3A5', '#FD9853', '#A8CABA', '#5D4E75', '#FFB6C1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']

export default function FoodWheel() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [peopleCount, setPeopleCount] = useState(1)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([])
  const [showAddFood, setShowAddFood] = useState(false)
  const [customFoods, setCustomFoods] = useState<Omit<FoodOption, 'weight'>[]>([])
  const [newFoodName, setNewFoodName] = useState('')
  const [newFoodIcon, setNewFoodIcon] = useState('🍽️')
  const [newFoodColor, setNewFoodColor] = useState('#FF6B6B')

  // 从 localStorage 加载自定义菜品
  useEffect(() => {
    const saved = localStorage.getItem('customFoods')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCustomFoods(parsed)
      } catch (e) {
        console.error('加载自定义菜品失败:', e)
      }
    }
  }, [])

  // 初始化食物选项
  useEffect(() => {
    updateWeights()
  }, [peopleCount, customFoods])

  const updateWeights = () => {
    // 合并默认菜品和自定义菜品
    const allBaseOptions: Omit<FoodOption, 'weight'>[] = [
      ...DEFAULT_FOODS,
      ...customFoods.map(f => ({ ...f, isCustom: true })),
    ]

    let weights: number[]
    const totalOptions = allBaseOptions.length
    
    if (peopleCount >= 4) {
      // 人数多时：鸡公煲和炒菜权值高，其他（包括自定义）权值较低
      weights = allBaseOptions.map((opt, index) => {
        if (opt.name === '鸡公煲' || opt.name === '炒菜') {
          return 35
        } else {
          return Math.floor(Math.random() * 10) + 5 // 5-15
        }
      })
    } else {
      // 人数少时：权值相对平均
      weights = allBaseOptions.map((opt, index) => {
        if (opt.name === '鸡公煲' || opt.name === '炒菜') {
          return Math.floor(Math.random() * 10) + 15 // 15-25
        } else {
          return Math.floor(Math.random() * 10) + 10 // 10-20
        }
      })
    }

    const options: FoodOption[] = allBaseOptions.map((opt, index) => ({
      ...opt,
      weight: weights[index],
    }))

    setFoodOptions(options)
  }

  const handleAddFood = () => {
    if (!newFoodName.trim()) {
      alert('请输入菜品名称')
      return
    }

    const newFood: Omit<FoodOption, 'weight'> = {
      name: newFoodName.trim(),
      icon: newFoodIcon,
      color: newFoodColor,
      isCustom: true,
    }

    const updated = [...customFoods, newFood]
    setCustomFoods(updated)
    localStorage.setItem('customFoods', JSON.stringify(updated))

    // 重置表单
    setNewFoodName('')
    setNewFoodIcon('🍽️')
    setNewFoodColor('#FF6B6B')
    setShowAddFood(false)
  }

  const handleDeleteFood = (index: number) => {
    const updated = customFoods.filter((_, i) => i !== index)
    setCustomFoods(updated)
    localStorage.setItem('customFoods', JSON.stringify(updated))
  }

  const drawWheel = (currentRotation: number = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 计算总权值
    const totalWeight = foodOptions.reduce((sum, opt) => sum + opt.weight, 0)

    // 绘制转盘
    let currentAngle = -Math.PI / 2 + (currentRotation * Math.PI / 180) // 从顶部开始

    foodOptions.forEach((option, index) => {
      const angle = (option.weight / totalWeight) * 2 * Math.PI

      // 绘制扇形
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle)
      ctx.closePath()
      ctx.fillStyle = option.color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // 绘制文字
      const textAngle = currentAngle + angle / 2
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7)
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7)

      ctx.save()
      ctx.translate(textX, textY)
      ctx.rotate(textAngle + Math.PI / 2)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(option.icon, 0, -10)
      ctx.font = '14px Arial'
      ctx.fillText(option.name, 0, 10)
      ctx.restore()

      currentAngle += angle
    })

    // 绘制中心圆
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    ctx.stroke()

    // 绘制指针（固定在顶部）
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - 20)
    ctx.lineTo(centerX - 15, centerY - radius - 5)
    ctx.lineTo(centerX + 15, centerY - radius - 5)
    ctx.closePath()
    ctx.fillStyle = '#FF6B6B'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // 设置画布大小
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        const size = Math.min(container.clientWidth - 40, 400)
        canvas.width = size
        canvas.height = size
        if (foodOptions.length > 0) {
          drawWheel(rotation)
        }
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [foodOptions, rotation])

  useEffect(() => {
    if (foodOptions.length > 0 && canvasRef.current) {
      drawWheel(rotation)
    }
  }, [foodOptions, rotation])

  const spin = () => {
    if (isSpinning || foodOptions.length === 0) return

    setIsSpinning(true)
    setResult(null)

    // 根据权值随机选择
    const totalWeight = foodOptions.reduce((sum, opt) => sum + opt.weight, 0)
    let random = Math.random() * totalWeight

    let selectedIndex = 0
    let accumulatedWeight = 0

    for (let i = 0; i < foodOptions.length; i++) {
      accumulatedWeight += foodOptions[i].weight
      if (random <= accumulatedWeight) {
        selectedIndex = i
        break
      }
    }

    const selectedOption = foodOptions[selectedIndex]

    // 计算选中扇形的中间角度（相对于转盘的初始位置，从顶部 -Math.PI/2 开始）
    let accumulatedAngle = -Math.PI / 2 // 转盘从顶部开始
    
    // 累加前面所有扇形的角度
    for (let i = 0; i < selectedIndex; i++) {
      const angle = (foodOptions[i].weight / totalWeight) * 2 * Math.PI
      accumulatedAngle += angle
    }
    
    // 选中扇形的中间角度（相对于初始转盘位置）
    const selectedAngle = (selectedOption.weight / totalWeight) * 2 * Math.PI
    const selectedMiddleAngle = accumulatedAngle + selectedAngle / 2

    // 指针固定在顶部（-Math.PI/2，即 270度）
    // 转盘顺时针旋转，所以角度增加
    // 要让选中扇形的中间转到指针位置，需要：
    // 选中扇形的中间角度（初始位置） + 旋转角度 = 指针位置（-Math.PI/2）
    // 所以：旋转角度 = -Math.PI/2 - selectedMiddleAngle
    
    let targetRotationRad = -Math.PI / 2 - selectedMiddleAngle
    
    // 转换为度数
    let targetRotation = targetRotationRad * 180 / Math.PI
    
    // 归一化到 0-360 度范围（确保是正数，方便计算）
    while (targetRotation < 0) {
      targetRotation += 360
    }
    while (targetRotation >= 360) {
      targetRotation -= 360
    }

    // 添加多圈旋转效果（顺时针旋转，从当前角度开始）
    const spins = 5 // 转5圈
    const finalRotation = rotation + targetRotation + spins * 360

    // 动画
    const startRotation = rotation
    const duration = 3000 // 3秒
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 使用缓动函数
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentRotation = startRotation + (finalRotation - startRotation) * easeOut

      setRotation(currentRotation)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsSpinning(false)
        setResult(selectedOption.name)
      }
    }

    animate()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🍽️ 今天吃什么？
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddFood(true)}
              style={{
                padding: '8px 16px',
                background: '#4ECDC4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ➕ 添加菜品
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              返回
            </button>
          </div>
        </div>

        {/* 人数输入 */}
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
        }}>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            人数：
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
              disabled={peopleCount <= 1}
              style={{
                padding: '8px 16px',
                background: peopleCount <= 1 ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: peopleCount <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '18px',
              }}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="20"
              value={peopleCount}
              onChange={(e) => setPeopleCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              style={{
                width: '80px',
                padding: '8px',
                fontSize: '18px',
                textAlign: 'center',
                border: '2px solid #667eea',
                borderRadius: '8px',
                fontWeight: 'bold',
              }}
            />
            <button
              onClick={() => setPeopleCount(Math.min(20, peopleCount + 1))}
              disabled={peopleCount >= 20}
              style={{
                padding: '8px 16px',
                background: peopleCount >= 20 ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: peopleCount >= 20 ? 'not-allowed' : 'pointer',
                fontSize: '18px',
              }}
            >
              +
            </button>
          </div>
          <p style={{
            marginTop: '10px',
            fontSize: '14px',
            color: '#666',
          }}>
            {peopleCount >= 4 
              ? '👥 人数较多，鸡公煲和炒菜的概率更高' 
              : '👤 人数较少，所有选项概率相对平均'}
          </p>
        </div>

        {/* 转盘 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px',
        }}>
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>

        {/* 转盘按钮 */}
        <button
          onClick={spin}
          disabled={isSpinning}
          style={{
            width: '100%',
            padding: '16px',
            background: isSpinning 
              ? '#ccc' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: isSpinning ? 'not-allowed' : 'pointer',
            boxShadow: isSpinning ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          {isSpinning ? '转盘中...' : '🎯 开始转盘'}
        </button>

        {/* 结果显示 */}
        {result && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            borderRadius: '12px',
            textAlign: 'center',
            animation: 'slideIn 0.5s ease-out',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '10px',
            }}>
              {foodOptions.find(opt => opt.name === result)?.icon}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              color: 'white',
              marginBottom: '5px',
            }}>
              今天吃：{result}
            </h2>
            <p style={{
              margin: 0,
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              祝用餐愉快！🍽️
            </p>
          </div>
        )}

        {/* 权值显示（调试用，可选） */}
        {foodOptions.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#666',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>当前权值：</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {foodOptions.map((opt, index) => (
                <span key={index} style={{
                  padding: '4px 8px',
                  background: opt.color,
                  color: 'white',
                  borderRadius: '4px',
                }}>
                  {opt.icon} {opt.name}: {opt.weight}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
