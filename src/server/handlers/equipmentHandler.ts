import type { Ack, EquipmentPurchaseData, EquipmentPurchaseRequest } from '../../shared/socketEvents'
import { getEquipmentItem } from '../../shared/content/equipment'
import { getPlayerState, updatePlayerGoldAndInventory, updatePlayerRoster } from '../db'
import type { TypedSocket } from '../types'

export function handleEquipmentPurchase(
  socket: TypedSocket,
  req: EquipmentPurchaseRequest,
  ack: (res: Ack<EquipmentPurchaseData>) => void
): void {
  const playerId = socket.data.playerId
  if (!playerId) {
    ack({ ok: false, reason: '로그인이 필요합니다.' })
    return
  }

  const player = getPlayerState(playerId)
  const unit = player.roster.find((u) => u.instanceId === req.instanceId)
  if (!unit) {
    ack({ ok: false, reason: '대상 용병을 찾을 수 없습니다.' })
    return
  }

  let item
  try {
    item = getEquipmentItem(req.equipmentId)
  } catch {
    ack({ ok: false, reason: '존재하지 않는 장비입니다.' })
    return
  }

  if (player.gold < item.cost) {
    ack({ ok: false, reason: '골드가 부족합니다.' })
    return
  }

  const newGold = player.gold - item.cost
  const newRoster = player.roster.map((u) =>
    u.instanceId === req.instanceId ? { ...u, equipment: { ...u.equipment, [item.slot]: item.id } } : u
  )
  updatePlayerGoldAndInventory(playerId, newGold, player.inventory)
  updatePlayerRoster(playerId, newRoster)

  ack({ ok: true, gold: newGold, roster: newRoster })
}
