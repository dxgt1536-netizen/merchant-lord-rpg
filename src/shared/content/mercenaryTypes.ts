import type { MercenaryType, UnitStats } from '../types'

export const PROTAGONIST_TYPE_ID = 'protagonist'

export const PROTAGONIST_BASE_STATS: UnitStats = {
  hp: 120,
  attack: 18,
  defense: 8,
  moveSpeed: 140,
  attackRange: 40,
  attackCooldownMs: 800
}

export const PROTAGONIST_STAT_GROWTH: Partial<UnitStats> = {
  hp: 10,
  attack: 2,
  defense: 1
}

export const MERCENARY_TYPES: MercenaryType[] = [
  {
    id: 'swordsman',
    name: '검사',
    icon: '⚔️',
    shape: 'square',
    color: 0xcc4444,
    role: 'melee',
    baseStats: { hp: 80, attack: 14, defense: 6, moveSpeed: 130, attackRange: 35, attackCooldownMs: 800 },
    statGrowthPerLevel: { hp: 8, attack: 2, defense: 1 },
    baseHireCost: 50,
    hireCostScalingPerOwned: 20
  },
  {
    id: 'spearman',
    name: '창병',
    icon: '🔱',
    shape: 'triangle',
    color: 0x4477cc,
    role: 'melee',
    baseStats: { hp: 90, attack: 12, defense: 8, moveSpeed: 110, attackRange: 55, attackCooldownMs: 900 },
    statGrowthPerLevel: { hp: 9, attack: 1.5, defense: 1.5 },
    baseHireCost: 60,
    hireCostScalingPerOwned: 20
  },
  {
    id: 'archer',
    name: '궁수',
    icon: '🏹',
    shape: 'circle',
    color: 0x44aa44,
    role: 'ranged',
    baseStats: { hp: 55, attack: 16, defense: 2, moveSpeed: 120, attackRange: 160, attackCooldownMs: 1000 },
    statGrowthPerLevel: { hp: 5, attack: 2.5, defense: 0.5 },
    baseHireCost: 70,
    hireCostScalingPerOwned: 25
  },
  {
    id: 'shieldbearer',
    name: '방패병',
    icon: '🛡️',
    shape: 'square',
    color: 0x888888,
    role: 'tank',
    baseStats: { hp: 140, attack: 8, defense: 14, moveSpeed: 90, attackRange: 30, attackCooldownMs: 900 },
    statGrowthPerLevel: { hp: 14, attack: 1, defense: 2 },
    baseHireCost: 55,
    hireCostScalingPerOwned: 20
  }
]

export function getMercenaryType(id: string): MercenaryType {
  const type = MERCENARY_TYPES.find((t) => t.id === id)
  if (!type) throw new Error(`Unknown mercenary type: ${id}`)
  return type
}
