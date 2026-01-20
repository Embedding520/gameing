import { ItemType } from './types'

// 根据关卡计算难度参数
export function getDifficultyParams(level: number) {
  // 物品数量：随关卡增加而增加，但后期增加更多石头
  let itemCount: number
  if (level <= 3) {
    itemCount = 12 + level * 2 // 12-18个
  } else if (level <= 6) {
    itemCount = 18 + (level - 3) * 3 // 18-27个
  } else if (level <= 10) {
    itemCount = 25 + (level - 6) * 2 // 25-33个
  } else {
    itemCount = 30 + Math.min(level - 10, 10) * 1 // 30-40个
  }

  // 物品类型概率分布（随关卡变化）
  let probabilities: {
    smallGold: number
    mediumGold: number
    largeGold: number
    diamond: number
    stone: number
    bag: number
  }

  if (level <= 3) {
    // 简单：更多高价值物品，较少石头
    probabilities = {
      smallGold: 0.25,
      mediumGold: 0.20,
      largeGold: 0.20,
      diamond: 0.15,
      stone: 0.10,
      bag: 0.10,
    }
  } else if (level <= 6) {
    // 中等：平衡分布
    probabilities = {
      smallGold: 0.30,
      mediumGold: 0.25,
      largeGold: 0.15,
      diamond: 0.10,
      stone: 0.15,
      bag: 0.05,
    }
  } else if (level <= 10) {
    // 困难：更多石头，高价值物品减少
    probabilities = {
      smallGold: 0.35,
      mediumGold: 0.25,
      largeGold: 0.10,
      diamond: 0.05,
      stone: 0.20,
      bag: 0.05,
    }
  } else {
    // 极难：大量石头，高价值物品很少
    probabilities = {
      smallGold: 0.40,
      mediumGold: 0.20,
      largeGold: 0.05,
      diamond: 0.02,
      stone: 0.30,
      bag: 0.03,
    }
  }

  // 物品分布范围（随关卡增加，物品分布更分散，更难抓取）
  let spreadFactor: number
  if (level <= 3) {
    spreadFactor = 0.6 // 较集中
  } else if (level <= 6) {
    spreadFactor = 0.8 // 中等分散
  } else if (level <= 10) {
    spreadFactor = 1.0 // 分散
  } else {
    spreadFactor = 1.2 // 非常分散
  }

  return {
    itemCount: Math.floor(itemCount),
    probabilities,
    spreadFactor,
  }
}

export function generateItems(
  level: number = 1,
  width: number = 800,
  height: number = 600
): Array<{
  id: string
  type: ItemType
  x: number
  y: number
  value: number
  weight: number
  size: number
  caught: boolean
}> {
  const items: Array<{
    id: string
    type: ItemType
    x: number
    y: number
    value: number
    weight: number
    size: number
    caught: boolean
  }> = []

  const { itemCount, probabilities, spreadFactor } = getDifficultyParams(level)

  // 计算累积概率
  const cumProb = {
    smallGold: probabilities.smallGold,
    mediumGold: probabilities.smallGold + probabilities.mediumGold,
    largeGold: probabilities.smallGold + probabilities.mediumGold + probabilities.largeGold,
    diamond: probabilities.smallGold + probabilities.mediumGold + probabilities.largeGold + probabilities.diamond,
    stone: probabilities.smallGold + probabilities.mediumGold + probabilities.largeGold + probabilities.diamond + probabilities.stone,
    bag: 1.0,
  }

  // 生成各种物品
  for (let i = 0; i < itemCount; i++) {
    // 物品位置：随关卡增加，分布更分散
    const baseX = width * 0.2
    const baseY = height * 0.3
    const rangeX = (width - baseX * 2) * spreadFactor
    const rangeY = (height - baseY * 1.5) * spreadFactor
    
    const x = Math.max(50, Math.min(width - 50, baseX + Math.random() * rangeX))
    const y = Math.max(150, Math.min(height - 100, baseY + Math.random() * rangeY))

    let type: ItemType
    let value: number
    let weight: number
    let size: number

    const rand = Math.random()

    if (rand < cumProb.smallGold) {
      // 小金币
      type = ItemType.SMALL_GOLD
      value = 50
      weight = 1
      size = 15
    } else if (rand < cumProb.mediumGold) {
      // 中金币
      type = ItemType.MEDIUM_GOLD
      value = 100
      weight = 2
      size = 25
    } else if (rand < cumProb.largeGold) {
      // 大金币
      type = ItemType.LARGE_GOLD
      value = 200
      weight = 3
      size = 35
    } else if (rand < cumProb.diamond) {
      // 钻石
      type = ItemType.DIAMOND
      value = 500
      weight = 1
      size = 20
    } else if (rand < cumProb.stone) {
      // 石头
      type = ItemType.STONE
      value = 0
      weight = 5
      size = 30
    } else {
      // 袋子
      type = ItemType.BAG
      value = 300
      weight = 2
      size = 28
    }

    items.push({
      id: `item-${i}`,
      type,
      x,
      y,
      value,
      weight,
      size,
      caught: false,
    })
  }

  return items
}

export function getItemColor(type: ItemType): string {
  switch (type) {
    case ItemType.SMALL_GOLD:
      return '#FFD700'
    case ItemType.MEDIUM_GOLD:
      return '#FFA500'
    case ItemType.LARGE_GOLD:
      return '#FF8C00'
    case ItemType.DIAMOND:
      return '#00CED1'
    case ItemType.STONE:
      return '#696969'
    case ItemType.BAG:
      return '#8B4513'
    default:
      return '#FFFFFF'
  }
}
