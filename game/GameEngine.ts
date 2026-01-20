import { GameState, Item, ItemType, GameStatus } from './types'
import { generateItems, getItemColor } from './items'
import { PowerUpType } from './powerups'

export default class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private state: GameState
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private isRunning: boolean = false
  private isPaused: boolean = false

  // 游戏参数
  private readonly HOOK_PIVOT_X = 400
  private readonly HOOK_PIVOT_Y = 50
  private readonly MAX_HOOK_LENGTH = 500
  private readonly HOOK_SWING_SPEED = 0.015 // 减慢摆动速度
  private readonly HOOK_DROP_SPEED = 3
  private readonly HOOK_RETURN_SPEED = 2
  private readonly GRAVITY = 0.3
  private readonly INITIAL_TARGET_SCORE = 1000 // 第一关目标分数
  private readonly BASE_LEVEL_TIME = 60 // 基础时间（秒）

  // 根据关卡计算时间限制
  private getLevelTime(level: number): number {
    if (level <= 3) {
      return this.BASE_LEVEL_TIME // 60秒
    } else if (level <= 6) {
      return this.BASE_LEVEL_TIME - (level - 3) * 5 // 45-60秒
    } else if (level <= 10) {
      return 45 - (level - 6) * 3 // 27-45秒
    } else {
      return Math.max(20, 27 - (level - 10) * 1) // 20-27秒，最低20秒
    }
  }

  // 根据关卡计算目标分数
  private getTargetScore(level: number): number {
    if (level === 1) {
      return this.INITIAL_TARGET_SCORE
    }
    // 难度递增：目标分数增长更快
    const baseMultiplier = 1.5
    const difficultyMultiplier = 1 + (level - 1) * 0.05 // 每关额外增加5%难度
    return Math.floor(this.INITIAL_TARGET_SCORE * Math.pow(baseMultiplier, level - 1) * difficultyMultiplier)
  }

  constructor(canvas: HTMLCanvasElement, initialCoins: number = 0) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('无法获取 Canvas 上下文')
    }
    this.ctx = context

    // 初始化游戏状态
    this.state = {
      score: 0,
      coins: initialCoins,
      level: 1,
      targetScore: this.INITIAL_TARGET_SCORE,
      timeLeft: this.getLevelTime(1),
      hookAngle: 0,
      hookAngleDirection: 1, // 初始向右摆动
      hookLength: 0,
      hookSpeed: 0,
      isHooking: false,
      isReturning: false,
      caughtItem: null,
      items: [],
      status: GameStatus.PLAYING,
      powerUps: {}, // 道具库存
      activePowerUps: {}, // 激活的道具效果
    }

    this.initLevel()
  }

  setCoins(coins: number) {
    this.state.coins = coins
  }

  private initLevel() {
    // 根据关卡生成不同难度的物品
    this.state.items = generateItems(this.state.level, this.canvas.width, this.canvas.height)
    this.state.hookAngle = 0
    this.state.hookAngleDirection = 1 // 重置摆动方向
    this.state.hookLength = 0
    this.state.isHooking = false
    this.state.isReturning = false
    this.state.caughtItem = null
    // 分数保留，不重置
    // 根据关卡设置时间限制
    this.state.timeLeft = this.getLevelTime(this.state.level)
    this.state.status = GameStatus.PLAYING
    
    // 根据关卡计算目标分数
    this.state.targetScore = this.getTargetScore(this.state.level)
  }

  nextLevel() {
    if (this.state.status === GameStatus.LEVEL_COMPLETE) {
      // 通过关卡奖励 10 金币
      this.state.coins += 10
      this.state.level++
      this.initLevel()
    }
  }

  restartLevel() {
    // 重新开始关卡时，失败后分数清零，重置时间和其他状态
    this.state.items = generateItems(this.state.level, this.canvas.width, this.canvas.height)
    this.state.hookAngle = 0
    this.state.hookAngleDirection = 1
    this.state.hookLength = 0
    this.state.isHooking = false
    this.state.isReturning = false
    this.state.caughtItem = null
    // 失败后重新开始时，分数清零
    this.state.score = 0
    this.state.timeLeft = this.getLevelTime(this.state.level)
    this.state.status = GameStatus.PLAYING
    // 目标分数不变
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop()
  }

  stop() {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
    this.lastTime = performance.now()
  }

  dropHook() {
    // 如果游戏结束，按空格键处理关卡逻辑
    if (this.state.status === GameStatus.LEVEL_COMPLETE) {
      this.nextLevel()
      return
    } else if (this.state.status === GameStatus.LEVEL_FAILED) {
      this.restartLevel()
      return
    }

    if (this.state.isHooking || this.state.isReturning) return
    this.state.isHooking = true
    this.state.hookLength = 0
    // 检查是否有速度提升效果
    const speedBoost = this.state.activePowerUps[PowerUpType.SPEED_BOOST]
    const speedMultiplier = speedBoost?.multiplier || 1
    this.state.hookSpeed = this.HOOK_DROP_SPEED * speedMultiplier
  }

  getState(): GameState {
    return { ...this.state }
  }

  // 添加道具到库存
  addPowerUp(type: PowerUpType, count: number = 1) {
    if (!this.state.powerUps[type]) {
      this.state.powerUps[type] = 0
    }
    this.state.powerUps[type] += count
  }

  // 使用道具
  usePowerUp(type: PowerUpType): boolean {
    if (!this.state.powerUps[type] || this.state.powerUps[type] <= 0) {
      return false
    }

    this.state.powerUps[type] -= 1

    switch (type) {
      case PowerUpType.BOMB:
        // 炸掉所有石头
        this.state.items = this.state.items.filter(item => item.type !== ItemType.STONE)
        break

      case PowerUpType.MAGNET:
        // 激活磁铁效果（持续一段时间）
        this.state.activePowerUps[PowerUpType.MAGNET] = {
          startTime: Date.now(),
          duration: 10000, // 10秒
        }
        break

      case PowerUpType.TIME_EXTEND:
        // 增加时间
        this.state.timeLeft += 30
        break

      case PowerUpType.DOUBLE_COINS:
        // 激活双倍金币效果（下一关）
        this.state.activePowerUps[PowerUpType.DOUBLE_COINS] = {
          active: true,
        }
        break

      case PowerUpType.SPEED_BOOST:
        // 激活速度提升效果
        this.state.activePowerUps[PowerUpType.SPEED_BOOST] = {
          startTime: Date.now(),
          duration: 15000, // 15秒
          multiplier: 1.5, // 速度提升50%
        }
        break
    }

    return true
  }

  // 获取道具数量
  getPowerUpCount(type: PowerUpType): number {
    return this.state.powerUps[type] || 0
  }

  // 更新道具效果
  private updatePowerUpEffects(deltaTime: number) {
    const now = Date.now()

    // 检查磁铁效果
    if (this.state.activePowerUps[PowerUpType.MAGNET]) {
      const magnet = this.state.activePowerUps[PowerUpType.MAGNET]
      if (now - magnet.startTime > magnet.duration) {
        delete this.state.activePowerUps[PowerUpType.MAGNET]
      } else {
        // 磁铁效果：吸引附近的物品
        const hookX = this.HOOK_PIVOT_X + Math.cos(this.state.hookAngle) * this.state.hookLength
        const hookY = this.HOOK_PIVOT_Y + Math.sin(this.state.hookAngle) * this.state.hookLength
        const magnetRadius = 100 // 磁铁吸引范围

        this.state.items.forEach(item => {
          if (item.caught) return
          const dx = hookX - item.x
          const dy = hookY - item.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < magnetRadius && distance > 0) {
            // 吸引物品向钩子移动
            const pullStrength = 0.5
            item.x += (dx / distance) * pullStrength * deltaTime
            item.y += (dy / distance) * pullStrength * deltaTime
          }
        })
      }
    }

    // 检查速度提升效果
    if (this.state.activePowerUps[PowerUpType.SPEED_BOOST]) {
      const speedBoost = this.state.activePowerUps[PowerUpType.SPEED_BOOST]
      if (now - speedBoost.startTime > speedBoost.duration) {
        delete this.state.activePowerUps[PowerUpType.SPEED_BOOST]
      }
    }
  }

  private gameLoop = (currentTime: number = performance.now()) => {
    if (!this.isRunning) return

    if (!this.isPaused) {
      const deltaTime = (currentTime - this.lastTime) / 16.67 // 约60fps
      this.lastTime = currentTime

      this.update(deltaTime)
      this.render()
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number) {
    // 如果游戏已结束，不更新
    if (this.state.status === GameStatus.LEVEL_COMPLETE || 
        this.state.status === GameStatus.LEVEL_FAILED) {
      return
    }

    // 更新道具效果
    this.updatePowerUpEffects(deltaTime)

    // 更新倒计时
    this.state.timeLeft -= deltaTime * 0.016 // 约每秒减1
    if (this.state.timeLeft <= 0) {
      this.state.timeLeft = 0
      // 检查是否达到目标分数
      if (this.state.score >= this.state.targetScore) {
        this.state.status = GameStatus.LEVEL_COMPLETE
      } else {
        this.state.status = GameStatus.LEVEL_FAILED
      }
    }

    // 钩子来回摆动（水平顺时针 0-180度）
    if (!this.state.isHooking && !this.state.isReturning) {
      this.state.hookAngle += this.HOOK_SWING_SPEED * deltaTime * this.state.hookAngleDirection
      
      // 到达边界时反转方向
      if (this.state.hookAngle >= Math.PI) {
        this.state.hookAngle = Math.PI
        this.state.hookAngleDirection = -1 // 向左摆动
      } else if (this.state.hookAngle <= 0) {
        this.state.hookAngle = 0
        this.state.hookAngleDirection = 1 // 向右摆动
      }
    }

    // 钩子下降
    if (this.state.isHooking) {
      this.state.hookLength += this.state.hookSpeed * deltaTime

      // 检查碰撞（水平顺时针：0度=右，90度=下，180度=左）
      const hookX = this.HOOK_PIVOT_X + Math.cos(this.state.hookAngle) * this.state.hookLength
      const hookY = this.HOOK_PIVOT_Y + Math.sin(this.state.hookAngle) * this.state.hookLength

      for (const item of this.state.items) {
        if (item.caught) continue

        const dx = hookX - item.x
        const dy = hookY - item.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < item.size) {
          // 抓到物品
          item.caught = true
          this.state.caughtItem = item
          this.state.isHooking = false
          this.state.isReturning = true
          // 检查是否有速度提升效果
          const speedBoost = this.state.activePowerUps[PowerUpType.SPEED_BOOST]
          const speedMultiplier = speedBoost?.multiplier || 1
          this.state.hookSpeed = this.HOOK_RETURN_SPEED * (1 + item.weight * 0.1) * speedMultiplier // 重量影响速度
          break
        }
      }

      // 到达最大长度或底部
      if (this.state.hookLength >= this.MAX_HOOK_LENGTH || hookY >= this.canvas.height - 100) {
        this.state.isHooking = false
        this.state.isReturning = true
        // 检查是否有速度提升效果
        const speedBoost = this.state.activePowerUps[PowerUpType.SPEED_BOOST]
        const speedMultiplier = speedBoost?.multiplier || 1
        this.state.hookSpeed = this.HOOK_RETURN_SPEED * speedMultiplier
      }
    }

    // 钩子返回
    if (this.state.isReturning) {
      this.state.hookLength -= this.state.hookSpeed * deltaTime

      if (this.state.hookLength <= 0) {
        this.state.hookLength = 0
        this.state.isReturning = false

        // 计算得分（只加分数，不加金币）
        if (this.state.caughtItem) {
          this.state.score += this.state.caughtItem.value
          this.state.caughtItem = null
        }
      }
    }
  }

  private render() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // 绘制背景
    this.drawBackground()

    // 绘制地面
    this.drawGround()

    // 绘制物品
    this.drawItems()

    // 绘制钩子轨迹预览（如果钩子未放下）
    if (!this.state.isHooking && !this.state.isReturning) {
      this.drawHookPreview()
    }

    // 绘制钩子和线
    this.drawHook()

    // 绘制UI
    this.drawUI()
  }

  private drawHookPreview() {
    // 绘制钩子可能到达的轨迹线（虚线）- 水平顺时针
    const hookX = this.HOOK_PIVOT_X + Math.cos(this.state.hookAngle) * this.MAX_HOOK_LENGTH
    const hookY = this.HOOK_PIVOT_Y + Math.sin(this.state.hookAngle) * this.MAX_HOOK_LENGTH

    // 虚线样式
    this.ctx.setLineDash([5, 5])
    this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(this.HOOK_PIVOT_X, this.HOOK_PIVOT_Y)
    this.ctx.lineTo(hookX, hookY)
    this.ctx.stroke()
    this.ctx.setLineDash([]) // 重置虚线

    // 在轨迹末端绘制一个预览点
    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'
    this.ctx.beginPath()
    this.ctx.arc(hookX, hookY, 8, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'
    this.ctx.lineWidth = 2
    this.ctx.stroke()
  }

  private drawBackground() {
    // 渐变背景（地下）
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, '#3d2817')
    gradient.addColorStop(1, '#1a0f08')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 绘制一些装饰性的石头纹理
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    for (let i = 0; i < 20; i++) {
      const x = (i * 40) % this.canvas.width
      const y = 100 + (i * 30) % (this.canvas.height - 200)
      this.ctx.beginPath()
      this.ctx.arc(x, y, 5, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private drawGround() {
    const groundY = this.canvas.height - 100
    this.ctx.fillStyle = '#8B4513'
    this.ctx.fillRect(0, groundY, this.canvas.width, 100)

    // 地面纹理
    this.ctx.strokeStyle = '#654321'
    this.ctx.lineWidth = 2
    for (let i = 0; i < this.canvas.width; i += 20) {
      this.ctx.beginPath()
      this.ctx.moveTo(i, groundY)
      this.ctx.lineTo(i, this.canvas.height)
      this.ctx.stroke()
    }
  }

  private drawItems() {
    for (const item of this.state.items) {
      if (item.caught && this.state.isReturning) {
        // 被抓到的物品跟随钩子（水平顺时针）
        const hookX = this.HOOK_PIVOT_X + Math.cos(this.state.hookAngle) * this.state.hookLength
        const hookY = this.HOOK_PIVOT_Y + Math.sin(this.state.hookAngle) * this.state.hookLength
        item.x = hookX
        item.y = hookY
      }

      if (!item.caught || this.state.isReturning) {
        this.drawItem(item)
      }
    }
  }

  private drawItem(item: Item) {
    const color = getItemColor(item.type)
    this.ctx.save()
    this.ctx.translate(item.x, item.y)

    switch (item.type) {
      case ItemType.SMALL_GOLD:
      case ItemType.MEDIUM_GOLD:
      case ItemType.LARGE_GOLD:
        // 绘制金块
        this.ctx.fillStyle = color
        this.ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size)
        this.ctx.strokeStyle = '#FFA500'
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(-item.size / 2, -item.size / 2, item.size, item.size)
        // 高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        this.ctx.fillRect(-item.size / 2 + 2, -item.size / 2 + 2, item.size / 3, item.size / 3)
        break

      case ItemType.DIAMOND:
        // 绘制钻石
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.moveTo(0, -item.size / 2)
        this.ctx.lineTo(item.size / 2, 0)
        this.ctx.lineTo(0, item.size / 2)
        this.ctx.lineTo(-item.size / 2, 0)
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.strokeStyle = '#00FFFF'
        this.ctx.lineWidth = 2
        this.ctx.stroke()
        break

      case ItemType.STONE:
        // 绘制石头
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.strokeStyle = '#555'
        this.ctx.lineWidth = 2
        this.ctx.stroke()
        break

      case ItemType.BAG:
        // 绘制袋子
        this.ctx.fillStyle = color
        this.ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size * 1.2)
        this.ctx.strokeStyle = '#654321'
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(-item.size / 2, -item.size / 2, item.size, item.size * 1.2)
        break
    }

    // 显示价值（如果可见）
    if (!item.caught) {
      this.ctx.fillStyle = '#FFF'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(item.value.toString(), 0, -item.size / 2 - 5)
    }

    this.ctx.restore()
  }

  private drawHook() {
    // 水平顺时针：0度=右，90度=下，180度=左
    const hookX = this.HOOK_PIVOT_X + Math.cos(this.state.hookAngle) * this.state.hookLength
    const hookY = this.HOOK_PIVOT_Y + Math.sin(this.state.hookAngle) * this.state.hookLength

    // 绘制线（加粗并添加阴影效果，让钩子更明显）
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    this.ctx.shadowBlur = 5
    this.ctx.shadowOffsetX = 2
    this.ctx.shadowOffsetY = 2
    
    // 外层粗线
    this.ctx.strokeStyle = '#654321'
    this.ctx.lineWidth = 5
    this.ctx.beginPath()
    this.ctx.moveTo(this.HOOK_PIVOT_X, this.HOOK_PIVOT_Y)
    this.ctx.lineTo(hookX, hookY)
    this.ctx.stroke()

    // 内层细线（高光效果）
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.moveTo(this.HOOK_PIVOT_X, this.HOOK_PIVOT_Y)
    this.ctx.lineTo(hookX, hookY)
    this.ctx.stroke()

    // 绘制钩子（增强视觉效果）
    this.ctx.save()
    this.ctx.translate(hookX, hookY)
    this.ctx.rotate(this.state.hookAngle)

    // 钩子外圈（阴影）
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    this.ctx.shadowBlur = 8
    this.ctx.shadowOffsetX = 3
    this.ctx.shadowOffsetY = 3

    // 钩子主体（更大更明显）
    this.ctx.fillStyle = '#654321'
    this.ctx.beginPath()
    this.ctx.arc(0, 0, 12, 0, Math.PI * 2)
    this.ctx.fill()

    // 钩子高光
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
    this.ctx.fillStyle = '#8B7355'
    this.ctx.beginPath()
    this.ctx.arc(-3, -3, 5, 0, Math.PI * 2)
    this.ctx.fill()

    // 钩子形状（更粗更明显）
    this.ctx.strokeStyle = '#FFD700' // 金色钩子
    this.ctx.lineWidth = 4
    this.ctx.lineCap = 'round'
    this.ctx.beginPath()
    // 绘制钩子形状（改进版）
    this.ctx.arc(0, 0, 15, Math.PI / 2, Math.PI * 1.3, false)
    this.ctx.lineTo(-8, 12)
    this.ctx.stroke()

    // 钩子尖端
    this.ctx.fillStyle = '#FFD700'
    this.ctx.beginPath()
    this.ctx.arc(-8, 12, 4, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()

    // 绘制支撑点（更明显）
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    this.ctx.shadowBlur = 5
    this.ctx.shadowOffsetX = 2
    this.ctx.shadowOffsetY = 2
    
    this.ctx.fillStyle = '#654321'
    this.ctx.beginPath()
    this.ctx.arc(this.HOOK_PIVOT_X, this.HOOK_PIVOT_Y, 20, 0, Math.PI * 2)
    this.ctx.fill()
    
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 3
    this.ctx.stroke()
    
    // 支撑点高光
    this.ctx.fillStyle = '#8B7355'
    this.ctx.beginPath()
    this.ctx.arc(this.HOOK_PIVOT_X - 5, this.HOOK_PIVOT_Y - 5, 8, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawUI() {
    // 绘制信息面板背景（增加宽度确保文字完整显示）
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(10, 10, 280, 210)

    // 分数
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`分数: ${this.state.score}`, 20, 35)

    // 目标分数
    const targetColor = this.state.score >= this.state.targetScore ? '#4CAF50' : '#FFF'
    this.ctx.fillStyle = targetColor
    this.ctx.font = 'bold 18px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`目标: ${this.state.targetScore}`, 20, 60)

    // 金币
    this.ctx.fillStyle = '#FFA500'
    this.ctx.font = 'bold 18px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`金币: ${this.state.coins}`, 20, 85)

    // 关卡和难度
    this.ctx.fillStyle = '#FFF'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`关卡: ${this.state.level}`, 20, 110)
    
    // 难度指示
    let difficultyText = ''
    let difficultyColor = '#FFF'
    if (this.state.level <= 3) {
      difficultyText = '难度: 简单'
      difficultyColor = '#4CAF50'
    } else if (this.state.level <= 6) {
      difficultyText = '难度: 中等'
      difficultyColor = '#FFA500'
    } else if (this.state.level <= 10) {
      difficultyText = '难度: 困难'
      difficultyColor = '#FF6B6B'
    } else {
      difficultyText = '难度: 极难'
      difficultyColor = '#8B0000'
    }
    this.ctx.fillStyle = difficultyColor
    this.ctx.font = '14px Arial'
    this.ctx.fillText(difficultyText, 20, 130)

    // 时间
    const timeColor = this.state.timeLeft < 10 ? '#FF0000' : '#FFF'
    this.ctx.fillStyle = timeColor
    this.ctx.font = 'bold 18px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`时间: ${Math.ceil(this.state.timeLeft)}`, 20, 135)

    // 钩子角度显示
    if (!this.state.isHooking && !this.state.isReturning) {
      const angleDegrees = Math.floor((this.state.hookAngle * 180) / Math.PI)
      this.ctx.fillStyle = '#00FFFF'
      this.ctx.font = 'bold 16px Arial'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(`角度: ${angleDegrees}°`, 20, 160)
    }

    // 绘制角度指示器
    this.drawAngleIndicator()

    // 游戏状态提示
    if (this.state.status === GameStatus.LEVEL_COMPLETE) {
      this.drawGameOverMessage('关卡完成！按空格进入下一关', '#4CAF50')
    } else if (this.state.status === GameStatus.LEVEL_FAILED) {
      this.drawGameOverMessage('时间到！未达到目标分数', '#FF0000')
    }
  }

  private drawAngleIndicator() {
    if (this.state.isHooking || this.state.isReturning) return

    const indicatorX = this.canvas.width - 120
    const indicatorY = 100
    const radius = 50

    // 绘制角度指示器背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.beginPath()
    this.ctx.arc(indicatorX, indicatorY, radius + 10, 0, Math.PI * 2)
    this.ctx.fill()

    // 绘制半圆刻度（水平顺时针：0度在右，180度在左）
    this.ctx.strokeStyle = '#666'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    // 从0度（右）到180度（左）绘制下半圆
    this.ctx.arc(indicatorX, indicatorY, radius, 0, Math.PI, false)
    this.ctx.stroke()

    // 绘制角度标记（0°, 45°, 90°, 135°, 180°）
    const marks = [0, 45, 90, 135, 180]
    marks.forEach(deg => {
      const angle = (deg * Math.PI) / 180
      // 水平顺时针：0度向右，180度向左
      const x1 = indicatorX + Math.cos(angle) * radius
      const y1 = indicatorY + Math.sin(angle) * radius
      const x2 = indicatorX + Math.cos(angle) * (radius + 5)
      const y2 = indicatorY + Math.sin(angle) * (radius + 5)
      
      this.ctx.strokeStyle = '#888'
      this.ctx.lineWidth = 1
      this.ctx.beginPath()
      this.ctx.moveTo(x1, y1)
      this.ctx.lineTo(x2, y2)
      this.ctx.stroke()

      // 角度文字
      this.ctx.fillStyle = '#AAA'
      this.ctx.font = '10px Arial'
      this.ctx.textAlign = 'center'
      const textX = indicatorX + Math.cos(angle) * (radius + 15)
      const textY = indicatorY + Math.sin(angle) * (radius + 15) + 3
      this.ctx.fillText(`${deg}°`, textX, textY)
    })

    // 绘制当前角度指针（水平顺时针）
    const currentAngle = this.state.hookAngle
    const pointerLength = radius - 5
    
    // 指针线
    this.ctx.strokeStyle = '#00FFFF'
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.moveTo(indicatorX, indicatorY)
    const pointerX = indicatorX + Math.cos(currentAngle) * pointerLength
    const pointerY = indicatorY + Math.sin(currentAngle) * pointerLength
    this.ctx.lineTo(pointerX, pointerY)
    this.ctx.stroke()

    // 指针端点（圆点）
    this.ctx.fillStyle = '#00FFFF'
    this.ctx.beginPath()
    this.ctx.arc(pointerX, pointerY, 4, 0, Math.PI * 2)
    this.ctx.fill()

    // 中心点
    this.ctx.fillStyle = '#FFF'
    this.ctx.beginPath()
    this.ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2)
    this.ctx.fill()

    // 当前角度数值（在指示器下方）
    const angleDegrees = Math.floor((currentAngle * 180) / Math.PI)
    this.ctx.fillStyle = '#00FFFF'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`${angleDegrees}°`, indicatorX, indicatorY + radius + 25)
  }

  private drawGameOverMessage(message: string, color: string) {
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 消息框
    const boxWidth = 400
    const boxHeight = 150
    const boxX = (this.canvas.width - boxWidth) / 2
    const boxY = (this.canvas.height - boxHeight) / 2

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

    // 消息文本
    this.ctx.fillStyle = color
    this.ctx.font = 'bold 24px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(message, this.canvas.width / 2, boxY + 60)

    // 提示文本
    this.ctx.fillStyle = '#666'
    this.ctx.font = '16px Arial'
    if (this.state.status === GameStatus.LEVEL_COMPLETE) {
      this.ctx.fillText('按空格键继续', this.canvas.width / 2, boxY + 100)
    } else {
      this.ctx.fillText('按空格键重新开始', this.canvas.width / 2, boxY + 100)
    }
  }
}
