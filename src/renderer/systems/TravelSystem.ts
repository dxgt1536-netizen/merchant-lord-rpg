import type { BattleSetup } from '../../shared/types'
import { gameStateStore } from '../core/GameStateStore'
import { getTown } from '../../shared/content/towns'
import { requestTravel } from '../net/SocketClient'

export interface TravelOutcome {
  encounter: boolean
  destinationTownId: string
  battleSetup?: BattleSetup
}

export function connectionTo(destinationTownId: string) {
  const state = gameStateStore.getState()
  const currentTown = getTown(state.currentTownId)
  const connection = currentTown.connections.find((c) => c.toTownId === destinationTownId)
  if (!connection) throw new Error(`No route from ${currentTown.id} to ${destinationTownId}`)
  return connection
}

export async function attemptTravel(destinationTownId: string): Promise<TravelOutcome> {
  const res = await requestTravel({ destinationTownId })
  if (!res.ok) throw new Error(res.reason)

  if (!res.encounter) {
    gameStateStore.applyCurrentTown(res.townId)
    return { encounter: false, destinationTownId: res.townId }
  }

  return { encounter: true, destinationTownId, battleSetup: res.battleSetup }
}
