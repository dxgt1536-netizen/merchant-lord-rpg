import type { Ack, HireData, HireRequest } from '../../shared/socketEvents'
import { getPlayerState, updatePlayerGoldAndInventory, updatePlayerRoster } from '../db'
import { MAX_ROSTER_SIZE, createMercenaryUnit, hireCostFor } from '../logic/mercenary'
import type { TypedSocket } from '../types'

export function handleHire(socket: TypedSocket, req: HireRequest, ack: (res: Ack<HireData>) => void): void {
  const playerId = socket.data.playerId
  if (!playerId) {
    ack({ ok: false, reason: '로그인이 필요합니다.' })
    return
  }

  const player = getPlayerState(playerId)
  if (player.roster.length >= MAX_ROSTER_SIZE) {
    ack({ ok: false, reason: '용병단 인원이 가득 찼습니다.' })
    return
  }

  const cost = hireCostFor(player.roster, req.typeId)
  if (player.gold < cost) {
    ack({ ok: false, reason: '골드가 부족합니다.' })
    return
  }

  const newGold = player.gold - cost
  const newRoster = [...player.roster, createMercenaryUnit(req.typeId)]
  updatePlayerGoldAndInventory(playerId, newGold, player.inventory)
  updatePlayerRoster(playerId, newRoster)

  ack({ ok: true, gold: newGold, roster: newRoster })
}
