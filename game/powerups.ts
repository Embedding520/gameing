// 道具类型定义
export enum PowerUpType {
  BOMB = 'bomb',           // 炸弹：炸掉石头
  MAGNET = 'magnet',       // 磁铁：吸引附近物品
  TIME_EXTEND = 'time_extend', // 时间延长：增加游戏时间
  DOUBLE_COINS = 'double_coins', // 双倍金币：下一关获得双倍金币
  SPEED_BOOST = 'speed_boost',   // 速度提升：钩子移动更快
}

export interface PowerUp {
  id: string
  type: PowerUpType
  name: string
  description: string
  price: number
  icon: string // emoji 或图标
}

// 道具商店配置
export const POWER_UP_SHOP: PowerUp[] = [
  {
    id: 'bomb-1',
    type: PowerUpType.BOMB,
    name: '炸弹',
    description: '炸掉所有石头，让道路更顺畅',
    price: 200,
    icon: '💣',
  },
  {
    id: 'magnet-1',
    type: PowerUpType.MAGNET,
    name: '磁铁',
    description: '吸引附近的物品，更容易捕获',
    price: 300,
    icon: '🧲',
  },
  {
    id: 'time-extend-1',
    type: PowerUpType.TIME_EXTEND,
    name: '时间延长',
    description: '增加 30 秒游戏时间',
    price: 250,
    icon: '⏰',
  },
  {
    id: 'double-coins-1',
    type: PowerUpType.DOUBLE_COINS,
    name: '双倍金币',
    description: '下一关获得双倍金币奖励',
    price: 400,
    icon: '💰',
  },
  {
    id: 'speed-boost-1',
    type: PowerUpType.SPEED_BOOST,
    name: '速度提升',
    description: '钩子移动速度提升 50%',
    price: 350,
    icon: '⚡',
  },
]

// 用户拥有的道具
export interface UserPowerUp {
  type: PowerUpType
  count: number
}
