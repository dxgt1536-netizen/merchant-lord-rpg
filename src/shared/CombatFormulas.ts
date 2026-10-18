import type { UnitStats } from './types'

export function resolveAttackDamage(attacker: UnitStats, defender: UnitStats): number {
  const variance = 0.85 + Math.random() * 0.3
  const raw = attacker.attack - defender.defense * 0.5
  return Math.max(1, Math.round(raw * variance))
}

export function effectiveStatsAtLevel(
  base: UnitStats,
  growthPerLevel: Partial<UnitStats>,
  level: number
): UnitStats {
  const levelsAboveOne = Math.max(0, level - 1)
  return {
    hp: Math.round(base.hp + (growthPerLevel.hp ?? 0) * levelsAboveOne),
    attack: Math.round(base.attack + (growthPerLevel.attack ?? 0) * levelsAboveOne),
    defense: Math.round(base.defense + (growthPerLevel.defense ?? 0) * levelsAboveOne),
    moveSpeed: base.moveSpeed + (growthPerLevel.moveSpeed ?? 0) * levelsAboveOne,
    attackRange: base.attackRange + (growthPerLevel.attackRange ?? 0) * levelsAboveOne,
    attackCooldownMs: base.attackCooldownMs
  }
}

export function applyEquipmentBonus(stats: UnitStats, bonuses: Partial<UnitStats>[]): UnitStats {
  const result = { ...stats }
  for (const bonus of bonuses) {
    result.hp += bonus.hp ?? 0
    result.attack += bonus.attack ?? 0
    result.defense += bonus.defense ?? 0
    result.moveSpeed += bonus.moveSpeed ?? 0
    result.attackRange += bonus.attackRange ?? 0
  }
  return result
}

export function xpToNextLevel(level: number): number {
  return 50 * level
}
