import { getGood } from '../../shared/content/goods'
import type { TownPriceEntry } from '../../shared/types'

const MIN_PRICE_FACTOR = 0.5
const MAX_PRICE_FACTOR = 1.8
const TRADE_IMPACT_PCT = 0.03

function clampPrice(price: number, basePrice: number): number {
  return Math.max(Math.round(basePrice * MIN_PRICE_FACTOR), Math.min(Math.round(basePrice * MAX_PRICE_FACTOR), price))
}

export function computeBuy(entry: TownPriceEntry, goodId: string, qty: number) {
  const good = getGood(goodId)
  const totalCost = entry.buy * qty
  const newBuy = clampPrice(Math.round(entry.buy * (1 + TRADE_IMPACT_PCT * Math.min(qty, 10))), good.basePrice)
  const newSell = clampPrice(Math.round(entry.sell * (1 + TRADE_IMPACT_PCT * 0.5 * Math.min(qty, 10))), good.basePrice)
  return { totalCost, newBuy, newSell }
}

export function computeSell(entry: TownPriceEntry, goodId: string, qty: number) {
  const good = getGood(goodId)
  const totalGain = entry.sell * qty
  const newSell = clampPrice(Math.round(entry.sell * (1 - TRADE_IMPACT_PCT * Math.min(qty, 10))), good.basePrice)
  const newBuy = clampPrice(Math.round(entry.buy * (1 - TRADE_IMPACT_PCT * 0.5 * Math.min(qty, 10))), good.basePrice)
  return { totalGain, newBuy, newSell }
}
