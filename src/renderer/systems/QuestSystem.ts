import type { Quest, QuestOffer } from '../../shared/types'
import { gameStateStore } from '../core/GameStateStore'
import { GOODS, getGood } from '../../shared/content/goods'
import { TOWNS, getTown } from '../../shared/content/towns'
import { ENEMY_TYPES, getEnemyType } from '../../shared/content/enemyTypes'
import { requestQuestAccept, requestQuestTurnIn } from '../net/SocketClient'

export type { QuestOffer }

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateQuestOffers(townId: string): QuestOffer[] {
  const offers: QuestOffer[] = []
  const otherTowns = TOWNS.filter((t) => t.id !== townId)

  // one delivery offer
  const good = GOODS[randomInt(0, GOODS.length - 1)]
  const destination = otherTowns[randomInt(0, otherTowns.length - 1)]
  const quantity = randomInt(5, 15)
  offers.push({
    type: 'delivery',
    townOfferedId: townId,
    goodId: good.id,
    quantity,
    destinationTownId: destination.id,
    rewardGold: Math.round(quantity * good.basePrice * 1.6)
  })

  // one bounty offer
  const enemyType = ENEMY_TYPES[randomInt(0, ENEMY_TYPES.length - 1)]
  const requiredKills = randomInt(2, 5)
  offers.push({
    type: 'bounty',
    townOfferedId: townId,
    enemyTypeId: enemyType.id,
    requiredKills,
    currentKills: 0,
    rewardGold: Math.round(enemyType.xpReward * requiredKills * 2.2),
    rewardXp: Math.round(enemyType.xpReward * requiredKills * 0.6)
  })

  return offers
}

export async function acceptQuest(offer: QuestOffer): Promise<{ ok: boolean; reason?: string }> {
  const res = await requestQuestAccept({ offer })
  if (!res.ok) return { ok: false, reason: res.reason }
  gameStateStore.applyQuests(res.activeQuests)
  return { ok: true }
}

export function canTurnIn(quest: Quest, currentTownId: string): boolean {
  if (quest.status !== 'active') return false
  if (quest.type === 'delivery') {
    return currentTownId === quest.destinationTownId
  }
  if (quest.type === 'bounty') {
    return currentTownId === quest.townOfferedId && (quest.currentKills ?? 0) >= (quest.requiredKills ?? 0)
  }
  return false
}

export async function turnInQuest(instanceId: string): Promise<{ ok: boolean; reason?: string }> {
  const res = await requestQuestTurnIn({ questInstanceId: instanceId })
  if (!res.ok) return { ok: false, reason: res.reason }
  gameStateStore.applyGoldAndInventory(res.gold, res.inventory)
  gameStateStore.applyQuests(res.activeQuests)
  return { ok: true }
}

export function describeQuest(quest: Quest | QuestOffer): string {
  if (quest.type === 'delivery' && quest.goodId && quest.quantity && quest.destinationTownId) {
    return `${getTown(quest.destinationTownId).name}로 ${getGood(quest.goodId).name} ${quest.quantity}개 운송`
  }
  if (quest.type === 'bounty' && quest.enemyTypeId && quest.requiredKills) {
    return `${getEnemyType(quest.enemyTypeId).name} ${quest.requiredKills}마리 토벌`
  }
  return '알 수 없는 의뢰'
}
