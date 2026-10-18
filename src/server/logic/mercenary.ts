import { getMercenaryType } from '../../shared/content/mercenaryTypes'
import type { MercenaryUnit } from '../../shared/types'

export const MAX_ROSTER_SIZE = 9

export function ownedCountOfType(roster: MercenaryUnit[], typeId: string): number {
  return roster.filter((u) => u.typeId === typeId).length
}

export function hireCostFor(roster: MercenaryUnit[], typeId: string): number {
  const type = getMercenaryType(typeId)
  return Math.round(type.baseHireCost + type.hireCostScalingPerOwned * ownedCountOfType(roster, typeId))
}

export function createMercenaryUnit(typeId: string): MercenaryUnit {
  return {
    instanceId: `${typeId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    typeId,
    level: 1,
    xp: 0,
    currentHp: -1,
    equipment: {}
  }
}
