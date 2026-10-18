import type { BattleSetup } from '../shared/types'

interface PendingEncounter {
  destinationTownId: string
  dangerTier: number
  maxGold: number
  maxXp: number
  battleSetup: BattleSetup
}

const pending = new Map<string, PendingEncounter>()

export function setPendingEncounter(playerId: string, encounter: PendingEncounter): void {
  pending.set(playerId, encounter)
}

export function takePendingEncounter(playerId: string): PendingEncounter | undefined {
  const encounter = pending.get(playerId)
  pending.delete(playerId)
  return encounter
}
