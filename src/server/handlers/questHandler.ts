import { randomUUID } from 'crypto'
import type { Ack, QuestAcceptData, QuestAcceptRequest, QuestTurnInData, QuestTurnInRequest } from '../../shared/socketEvents'
import type { Quest } from '../../shared/types'
import { getGood } from '../../shared/content/goods'
import { getPlayerState, updatePlayerGoldAndInventory, updatePlayerQuests } from '../db'
import type { TypedSocket } from '../types'

const MAX_PLAUSIBLE_REWARD = 5000

function isPlausibleOffer(offer: QuestAcceptRequest['offer']): boolean {
  if (offer.rewardGold < 0 || offer.rewardGold > MAX_PLAUSIBLE_REWARD) return false
  if (offer.rewardXp !== undefined && (offer.rewardXp < 0 || offer.rewardXp > MAX_PLAUSIBLE_REWARD)) return false
  return true
}

export function handleQuestAccept(socket: TypedSocket, req: QuestAcceptRequest, ack: (res: Ack<QuestAcceptData>) => void): void {
  const playerId = socket.data.playerId
  if (!playerId) {
    ack({ ok: false, reason: '로그인이 필요합니다.' })
    return
  }
  if (!isPlausibleOffer(req.offer)) {
    ack({ ok: false, reason: '유효하지 않은 의뢰입니다.' })
    return
  }

  const player = getPlayerState(playerId)
  const quest: Quest = { ...req.offer, instanceId: randomUUID(), status: 'active' }
  const newQuests = [...player.activeQuests, quest]
  updatePlayerQuests(playerId, newQuests)

  ack({ ok: true, activeQuests: newQuests })
}

export function handleQuestTurnIn(socket: TypedSocket, req: QuestTurnInRequest, ack: (res: Ack<QuestTurnInData>) => void): void {
  const playerId = socket.data.playerId
  if (!playerId) {
    ack({ ok: false, reason: '로그인이 필요합니다.' })
    return
  }

  const player = getPlayerState(playerId)
  const quest = player.activeQuests.find((q) => q.instanceId === req.questInstanceId)
  if (!quest || quest.status !== 'active') {
    ack({ ok: false, reason: '의뢰를 찾을 수 없습니다.' })
    return
  }

  if (quest.type === 'delivery') {
    if (player.currentTownId !== quest.destinationTownId) {
      ack({ ok: false, reason: '목적지 마을에서만 완료할 수 있습니다.' })
      return
    }
    const owned = player.inventory[quest.goodId!] ?? 0
    if (owned < (quest.quantity ?? 0)) {
      ack({ ok: false, reason: `${getGood(quest.goodId!).name}이(가) 부족합니다.` })
      return
    }
  } else if (quest.type === 'bounty') {
    if (player.currentTownId !== quest.townOfferedId) {
      ack({ ok: false, reason: '의뢰를 받은 마을에서만 완료할 수 있습니다.' })
      return
    }
    if ((quest.currentKills ?? 0) < (quest.requiredKills ?? 0)) {
      ack({ ok: false, reason: '아직 완료 조건을 만족하지 않았습니다.' })
      return
    }
  }

  const newInventory = { ...player.inventory }
  if (quest.type === 'delivery') {
    newInventory[quest.goodId!] = (newInventory[quest.goodId!] ?? 0) - (quest.quantity ?? 0)
  }
  const newGold = player.gold + quest.rewardGold
  const newQuests = player.activeQuests.map((q) => (q.instanceId === quest.instanceId ? { ...q, status: 'completed' as const } : q))

  updatePlayerGoldAndInventory(playerId, newGold, newInventory)
  updatePlayerQuests(playerId, newQuests)

  ack({ ok: true, gold: newGold, inventory: newInventory, activeQuests: newQuests })
}
