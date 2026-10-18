import { gameStateStore } from '../core/GameStateStore'
import { requestEquipmentPurchase } from '../net/SocketClient'

export async function purchaseAndEquip(instanceId: string, equipmentId: string): Promise<{ ok: boolean; reason?: string }> {
  const res = await requestEquipmentPurchase({ instanceId, equipmentId })
  if (!res.ok) return { ok: false, reason: res.reason }
  gameStateStore.applyGoldAndInventory(res.gold, gameStateStore.getState().inventory)
  gameStateStore.applyRoster(res.roster)
  return { ok: true }
}
