import type { Ack, TravelData, TravelRequest } from '../../shared/socketEvents'
import type { BattleSetup } from '../../shared/types'
import { getPlayerState, updatePlayerTown } from '../db'
import { connectionTo, maxLootForSquad, pickEnemySquadForDanger } from '../logic/travel'
import { setPendingEncounter } from '../pendingEncounters'
import { updateTown } from '../presence'
import type { TypedSocket } from '../types'

export function handleTravelRequest(socket: TypedSocket, req: TravelRequest, ack: (res: Ack<TravelData>) => void): void {
  const playerId = socket.data.playerId
  if (!playerId) {
    ack({ ok: false, reason: '로그인이 필요합니다.' })
    return
  }

  const player = getPlayerState(playerId)
  let connection
  try {
    connection = connectionTo(player.currentTownId, req.destinationTownId)
  } catch {
    ack({ ok: false, reason: '연결된 경로가 없습니다.' })
    return
  }

  const encounter = Math.random() < connection.encounterChance

  if (!encounter) {
    updatePlayerTown(playerId, req.destinationTownId)
    const info = updateTown(playerId, req.destinationTownId)
    if (info) socket.broadcast.emit('presence:update', info)
    ack({ ok: true, encounter: false, townId: req.destinationTownId })
    return
  }

  const enemySquad = pickEnemySquadForDanger(connection.dangerTier)
  const battleSetup: BattleSetup = {
    playerUnits: structuredClone(player.roster),
    enemySquad
  }
  const { maxGold, maxXp } = maxLootForSquad(enemySquad)
  setPendingEncounter(playerId, {
    destinationTownId: req.destinationTownId,
    dangerTier: connection.dangerTier,
    maxGold,
    maxXp,
    battleSetup
  })

  ack({ ok: true, encounter: true, battleSetup })
}
