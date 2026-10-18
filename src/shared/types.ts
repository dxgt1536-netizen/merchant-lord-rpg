// -- Content (static, authored) --

export interface Good {
  id: string
  name: string
  icon: string
  basePrice: number
  category: 'food' | 'craft' | 'luxury' | 'material'
}

export interface TownConnection {
  toTownId: string
  encounterChance: number
  dangerTier: number
}

export interface Town {
  id: string
  name: string
  x: number
  y: number
  connections: TownConnection[]
  priceModifiers: Record<string, number>
  availableEquipmentTierMax: number
}

export interface UnitStats {
  hp: number
  attack: number
  defense: number
  moveSpeed: number
  attackRange: number
  attackCooldownMs: number
}

export type UnitShape = 'circle' | 'triangle' | 'square'

export interface MercenaryType {
  id: string
  name: string
  icon: string
  shape: UnitShape
  color: number
  role: 'melee' | 'ranged' | 'tank'
  baseStats: UnitStats
  statGrowthPerLevel: Partial<UnitStats>
  baseHireCost: number
  hireCostScalingPerOwned: number
}

export interface EquipmentItem {
  id: string
  name: string
  slot: 'weapon' | 'armor'
  tier: number
  cost: number
  bonus: Partial<UnitStats>
}

export interface EnemyType {
  id: string
  name: string
  icon: string
  shape: UnitShape
  color: number
  baseStats: UnitStats
  aggroRange: number
  leashRange: number
  xpReward: number
  goldDropRange: [number, number]
}

export type QuestType = 'delivery' | 'bounty'

// -- Runtime instances (persisted in save file) --

export interface MercenaryUnit {
  instanceId: string
  typeId: string // -> MercenaryType.id, or 'protagonist'
  level: number
  xp: number
  currentHp: number
  equipment: { weapon?: string; armor?: string }
}

export interface Quest {
  instanceId: string
  type: QuestType
  status: 'active' | 'completed' | 'expired'
  townOfferedId: string
  rewardGold: number
  rewardXp?: number
  // delivery fields
  goodId?: string
  quantity?: number
  destinationTownId?: string
  // bounty fields
  enemyTypeId?: string
  requiredKills?: number
  currentKills?: number
}

export type QuestOffer = Omit<Quest, 'instanceId' | 'status'>

export interface TownPriceEntry {
  buy: number
  sell: number
}

export interface PlayerState {
  gold: number
  inventory: Record<string, number>
  roster: MercenaryUnit[]
  currentTownId: string
  unlockedTownIds: string[]
  activeQuests: Quest[]
  townPriceState: Record<string, Record<string, TownPriceEntry>>
}

// -- Battle-scoped (not persisted) --

export interface BattleSetup {
  playerUnits: MercenaryUnit[]
  enemySquad: { enemyTypeId: string; count: number }[]
}

export interface BattleUnitResult {
  instanceId: string
  survived: boolean
  finalHp: number
  xpGained: number
}

export interface BattleResult {
  victory: boolean
  goldLoot: number
  goodsLoot: Record<string, number>
  unitResults: BattleUnitResult[]
  killedEnemyTypeIds: string[]
}
