import { gameStateStore } from '../core/GameStateStore'
import { requestBuy, requestSell } from '../net/SocketClient'

export interface TransactionResult {
  ok: boolean
  reason?: string
  totalGold?: number
}

export async function buyGood(goodId: string, qty: number): Promise<TransactionResult> {
  const res = await requestBuy({ goodId, qty })
  if (!res.ok) return { ok: false, reason: res.reason }
  gameStateStore.applyGoldAndInventory(res.gold, res.inventory)
  return { ok: true, totalGold: res.totalGold }
}

export async function sellGood(goodId: string, qty: number): Promise<TransactionResult> {
  const res = await requestSell({ goodId, qty })
  if (!res.ok) return { ok: false, reason: res.reason }
  gameStateStore.applyGoldAndInventory(res.gold, res.inventory)
  return { ok: true, totalGold: res.totalGold }
}
