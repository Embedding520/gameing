// 各游戏的道具配置

export interface GamePowerUp {
  id: string
  name: string
  description: string
  icon: string
  price: number
  gameId: string // 游戏ID
}

// 贪吃蛇游戏道具
export const SNAKE_POWER_UPS: GamePowerUp[] = [
  {
    id: 'snake-slow',
    name: '减速',
    description: '蛇的移动速度降低 30% (持续 20 秒)',
    icon: '🐌',
    price: 50,
    gameId: 'snake',
  },
  {
    id: 'snake-shield',
    name: '护盾',
    description: '可以撞到自己一次而不死',
    icon: '🛡️',
    price: 100,
    gameId: 'snake',
  },
  {
    id: 'snake-double-score',
    name: '双倍分数',
    description: '接下来 5 个食物获得双倍分数',
    icon: '⭐',
    price: 150,
    gameId: 'snake',
  },
]

// 俄罗斯方块游戏道具
export const TETRIS_POWER_UPS: GamePowerUp[] = [
  {
    id: 'tetris-slow',
    name: '减速',
    description: '方块下降速度降低 50% (持续 30 秒)',
    icon: '🐌',
    price: 80,
    gameId: 'tetris',
  },
  {
    id: 'tetris-clear-line',
    name: '消除一行',
    description: '立即消除最底下一行',
    icon: '✨',
    price: 120,
    gameId: 'tetris',
  },
  {
    id: 'tetris-hold',
    name: '暂停',
    description: '暂停方块下降 10 秒',
    icon: '⏸️',
    price: 100,
    gameId: 'tetris',
  },
]

// 打砖块游戏道具
export const BREAKOUT_POWER_UPS: GamePowerUp[] = [
  {
    id: 'breakout-big-paddle',
    name: '大挡板',
    description: '挡板宽度增加 50% (持续 30 秒)',
    icon: '📏',
    price: 100,
    gameId: 'breakout',
  },
  {
    id: 'breakout-slow-ball',
    name: '慢速球',
    description: '球的速度降低 40% (持续 20 秒)',
    icon: '🐌',
    price: 80,
    gameId: 'breakout',
  },
  {
    id: 'breakout-multi-ball',
    name: '多球',
    description: '增加一个额外的球',
    icon: '⚽',
    price: 200,
    gameId: 'breakout',
  },
]

// 2048游戏道具
export const GAME2048_POWER_UPS: GamePowerUp[] = [
  {
    id: '2048-undo',
    name: '撤销',
    description: '撤销上一步操作',
    icon: '↩️',
    price: 100,
    gameId: 'game2048',
  },
  {
    id: '2048-bomb',
    name: '炸弹',
    description: '随机消除一个数字方块',
    icon: '💣',
    price: 150,
    gameId: 'game2048',
  },
  {
    id: '2048-double',
    name: '双倍',
    description: '下一个合并获得双倍分数',
    icon: '⭐',
    price: 200,
    gameId: 'game2048',
  },
]

// 飞机大战游戏道具
export const AIRPLANE_POWER_UPS: GamePowerUp[] = [
  {
    id: 'airplane-shield',
    name: '护盾',
    description: '抵挡一次伤害',
    icon: '🛡️',
    price: 150,
    gameId: 'airplane',
  },
  {
    id: 'airplane-power',
    name: '火力增强',
    description: '子弹威力提升 50% (持续 30 秒)',
    icon: '🔥',
    price: 200,
    gameId: 'airplane',
  },
  {
    id: 'airplane-life',
    name: '生命值',
    description: '增加一条生命',
    icon: '❤️',
    price: 300,
    gameId: 'airplane',
  },
]

// 消消乐游戏道具
export const MATCH3_POWER_UPS: GamePowerUp[] = [
  {
    id: 'match3-shuffle',
    name: '洗牌',
    description: '重新排列所有方块',
    icon: '🔀',
    price: 80,
    gameId: 'match3',
  },
  {
    id: 'match3-bomb',
    name: '炸弹',
    description: '消除一个区域的所有方块',
    icon: '💣',
    price: 120,
    gameId: 'match3',
  },
  {
    id: 'match3-time',
    name: '时间延长',
    description: '增加 30 秒游戏时间',
    icon: '⏰',
    price: 150,
    gameId: 'match3',
  },
]

// 获取指定游戏的道具列表
export function getGamePowerUps(gameId: string): GamePowerUp[] {
  switch (gameId) {
    case 'snake':
      return SNAKE_POWER_UPS
    case 'tetris':
      return TETRIS_POWER_UPS
    case 'breakout':
      return BREAKOUT_POWER_UPS
    case 'game2048':
      return GAME2048_POWER_UPS
    case 'airplane':
      return AIRPLANE_POWER_UPS
    case 'match3':
      return MATCH3_POWER_UPS
    default:
      return []
  }
}
