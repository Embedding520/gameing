export enum ItemType {
  SMALL_GOLD = 'small_gold',
  MEDIUM_GOLD = 'medium_gold',
  LARGE_GOLD = 'large_gold',
  DIAMOND = 'diamond',
  STONE = 'stone',
  BAG = 'bag',
}

export interface Item {
  id: string
  type: ItemType
  x: number
  y: number
  value: number
  weight: number
  size: number
  caught: boolean
}

export enum GameStatus {
  PLAYING = 'playing',
  LEVEL_COMPLETE = 'level_complete',
  LEVEL_FAILED = 'level_failed',
  GAME_OVER = 'game_over',
}

export interface GameState {
  score: number
  coins: number
  level: number
  targetScore: number
  timeLeft: number
  hookAngle: number
  hookAngleDirection: number // 摆动方向：1 向右，-1 向左
  hookLength: number
  hookSpeed: number
  isHooking: boolean
  isReturning: boolean
  caughtItem: Item | null
  items: Item[]
  status: GameStatus
  powerUps: Record<string, number> // 道具：类型 -> 数量
  activePowerUps: Record<string, any> // 激活的道具效果
}
