import type { MercenaryUnit, UnitStats } from '../../shared/types'
import { gameStateStore } from '../core/GameStateStore'
import {
  MERCENARY_TYPES,
  PROTAGONIST_BASE_STATS,
  PROTAGONIST_STAT_GROWTH,
  PROTAGONIST_TYPE_ID,
  getMercenaryType
} from '../../shared/content/mercenaryTypes'
import { getEquipmentItem } from '../../shared/content/equipment'
import { applyEquipmentBonus, effectiveStatsAtLevel } from '../../shared/CombatFormulas'
import { requestHire } from '../net/SocketClient'

export const MAX_ROSTER_SIZE = 9 // protagonist + up to 8 mercenaries

export function getUnitDisplayName(unit: MercenaryUnit): string {
  if (unit.typeId === PROTAGONIST_TYPE_ID) return '주인공'
  return getMercenaryType(unit.typeId).name
}

export function computeEffectiveStats(unit: MercenaryUnit): UnitStats {
  const base = unit.typeId === PROTAGONIST_TYPE_ID ? PROTAGONIST_BASE_STATS : getMercenaryType(unit.typeId).baseStats
  const growth = unit.typeId === PROTAGONIST_TYPE_ID ? PROTAGONIST_STAT_GROWTH : getMercenaryType(unit.typeId).statGrowthPerLevel
  const leveled = effectiveStatsAtLevel(base, growth, unit.level)
  const bonuses = Object.values(unit.equipment)
    .filter((id): id is string => !!id)
    .map((id) => getEquipmentItem(id).bonus)
  return applyEquipmentBonus(leveled, bonuses)
}

export function maxHpOf(unit: MercenaryUnit): number {
  return computeEffectiveStats(unit).hp
}

export function currentHpOf(unit: MercenaryUnit): number {
  return unit.currentHp < 0 ? maxHpOf(unit) : Math.min(unit.currentHp, maxHpOf(unit))
}

// Display-only estimate (server is authoritative and re-validates on hire).
export function ownedCountOfType(typeId: string): number {
  return gameStateStore.getState().roster.filter((u) => u.typeId === typeId).length
}

export function hireCostFor(typeId: string): number {
  const type = getMercenaryType(typeId)
  return Math.round(type.baseHireCost + type.hireCostScalingPerOwned * ownedCountOfType(typeId))
}

export function canHire(typeId: string): { ok: boolean; reason?: string } {
  if (gameStateStore.getState().roster.length >= MAX_ROSTER_SIZE) {
    return { ok: false, reason: '용병단 인원이 가득 찼습니다.' }
  }
  if (gameStateStore.getState().gold < hireCostFor(typeId)) {
    return { ok: false, reason: '골드가 부족합니다.' }
  }
  return { ok: true }
}

export async function hireMercenary(typeId: string): Promise<{ ok: boolean; reason?: string }> {
  const res = await requestHire({ typeId })
  if (!res.ok) return { ok: false, reason: res.reason }
  gameStateStore.applyGoldAndInventory(res.gold, gameStateStore.getState().inventory)
  gameStateStore.applyRoster(res.roster)
  return { ok: true }
}

export function allMercenaryTypes() {
  return MERCENARY_TYPES
}
