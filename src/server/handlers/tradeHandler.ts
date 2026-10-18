import type { Ack, TradeData, TradeRequest } from '../../shared/socketEvents'
import { getAllTownPrices, getPlayerState, setTownPrice, updatePlayerGoldAndInventory } from '../db'
import { computeBuy, computeSell } from '../logic/economy'
import type { TypedSocket } from '../types'

export function handleTradeBuy(socket: TypedSocket, req: TradeRequest, ack: (res: Ack<TradeData>) => void): void {
  const playerId = socket.data.playerId
  if (!playerId) {
    ack({ ok: false, reason: '로그인이 필요합니다.' })
    return
  }
  if (req.qty <= 0) {
    ack({ ok: false, reason: '수량을 확인하세요.' })
    return
  }

  const player = getPlayerState(playerId)
  const prices = getAllTownPrices()
  const entry = prices[player.currentTownId]?.[req.goodId]
  if (!entry) {
    ack({ ok: false, reason: '거래할 수 없는 품목입니다.' })
    return
  }

  const { totalCost, newBuy, newSell } = computeBuy(entry, req.goodId, req.qty)
  if (player.gold < totalCost) {
    ack({ ok: false, reason: '골드가 부족합니다.' })
    return
  }

  const newGold = player.gold - totalCost
  const newInventory = { ...player.inventory, [req.goodId]: (player.inventory[req.goodId] ?? 0) + req.qty }
  updatePlayerGoldAndInventory(playerId, newGold, newInventory)
  setTownPrice(player.currentTownId, req.goodId, newBuy, newSell)

  ack({ ok: true, gold: newGold, inventory: newInventory, totalGold: totalCost })
  socket.broadcast.emit('prices:update', { townId: player.currentTownId, prices: { [req.goodId]: { buy: newBuy, sell: newSell } } })
}

export function handleTradeSell(socket: TypedSocket, req: TradeRequest, ack: (res: Ack<TradeData>) => void): void {
  const playerId = socket.data.playerId
  if (!playerId) {
    ack({ ok: false, reason: '로그인이 필요합니다.' })
    return
  }
  if (req.qty <= 0) {
    ack({ ok: false, reason: '수량을 확인하세요.' })
    return
  }

  const player = getPlayerState(playerId)
  const owned = player.inventory[req.goodId] ?? 0
  if (owned < req.qty) {
    ack({ ok: false, reason: '보유한 화물이 부족합니다.' })
    return
  }

  const prices = getAllTownPrices()
  const entry = prices[player.currentTownId]?.[req.goodId]
  if (!entry) {
    ack({ ok: false, reason: '거래할 수 없는 품목입니다.' })
    return
  }

  const { totalGain, newBuy, newSell } = computeSell(entry, req.goodId, req.qty)
  const newGold = player.gold + totalGain
  const newInventory = { ...player.inventory, [req.goodId]: owned - req.qty }
  updatePlayerGoldAndInventory(playerId, newGold, newInventory)
  setTownPrice(player.currentTownId, req.goodId, newBuy, newSell)

  ack({ ok: true, gold: newGold, inventory: newInventory, totalGold: totalGain })
  socket.broadcast.emit('prices:update', { townId: player.currentTownId, prices: { [req.goodId]: { buy: newBuy, sell: newSell } } })
}
