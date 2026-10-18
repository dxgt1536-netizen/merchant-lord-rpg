import { getTown } from '../../shared/content/towns'
import { getEnemyType } from '../../shared/content/enemyTypes'

export function connectionTo(currentTownId: string, destinationTownId: string) {
  const town = getTown(currentTownId)
  const conn = town.connections.find((c) => c.toTownId === destinationTownId)
  if (!conn) throw new Error(`No route from ${currentTownId} to ${destinationTownId}`)
  return conn
}

export function pickEnemySquadForDanger(dangerTier: number): { enemyTypeId: string; count: number }[] {
  if (dangerTier <= 1) {
    return [{ enemyTypeId: 'bandit', count: 2 }]
  }
  if (dangerTier === 2) {
    return [
      { enemyTypeId: 'bandit', count: 2 },
      { enemyTypeId: 'wolf', count: 1 }
    ]
  }
  return [
    { enemyTypeId: 'bandit', count: 2 },
    { enemyTypeId: 'bandit_archer', count: 1 },
    { enemyTypeId: 'bandit_leader', count: 1 }
  ]
}

const DEFEAT_GOLD_LOSS_PCT = 0.2

export function applyDefeatPenalty(
  gold: number,
  inventory: Record<string, number>
): { gold: number; inventory: Record<string, number>; goldLost: number; goodsLost: Record<string, number> } {
  const goldLost = Math.round(gold * DEFEAT_GOLD_LOSS_PCT)
  const newInventory = { ...inventory }
  const goodsLost: Record<string, number> = {}
  for (const [goodId, qty] of Object.entries(inventory)) {
    if (qty <= 0) continue
    const lost = Math.round(qty * DEFEAT_GOLD_LOSS_PCT)
    if (lost > 0) {
      newInventory[goodId] = qty - lost
      goodsLost[goodId] = lost
    }
  }
  return { gold: gold - goldLost, inventory: newInventory, goldLost, goodsLost }
}

export function maxLootForSquad(squad: { enemyTypeId: string; count: number }[]): { maxGold: number; maxXp: number } {
  let maxGold = 0
  let maxXp = 0
  for (const group of squad) {
    const type = getEnemyType(group.enemyTypeId)
    maxGold += type.goldDropRange[1] * group.count
    maxXp += type.xpReward * group.count
  }
  return { maxGold, maxXp }
}
