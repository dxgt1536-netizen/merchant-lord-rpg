import type { Ack, BattleResultData, BattleResultRequest } from '../../shared/socketEvents'
import type { MercenaryUnit, Quest } from '../../shared/types'
import { xpToNextLevel } from '../../shared/CombatFormulas'
import { getPlayerState, updatePlayerFull } from '../db'
import { applyDefeatPenalty } from '../logic/travel'
import { takePendingEncounter } from '../pendingEncounters'
import { updateTown } from '../presence'
import type { TypedSocket } from '../types'

function grantXp(unit: MercenaryUnit, amount: number): MercenaryUnit {
  let xp = unit.xp + amount
  let level = unit.level
  let leveledUp = false
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level)
    level += 1
    leveledUp = true
  }
  return { ...unit, xp, level, currentHp: leveledUp ? -1 : unit.currentHp }
}

function progressBountyQuests(quests: Quest[], killedEnemyTypeIds: string[]): Quest[] {
  const killCounts = new Map<string, number>()
  for (const id of killedEnemyTypeIds) killCounts.set(id, (killCounts.get(id) ?? 0) + 1)

  return quests.map((q) => {
    if (q.status !== 'active' || q.type !== 'bounty' || !q.enemyTypeId) return q
    const kills = killCounts.get(q.enemyTypeId)
    if (!kills) return q
    const currentKills = Math.min(q.requiredKills ?? 0, (q.currentKills ?? 0) + kills)
    return { ...q, currentKills }
  })
}

export function handleBattleResult(socket: TypedSocket, req: BattleResultRequest, ack: (res: Ack<BattleResultData>) => void): void {
  const playerId = socket.data.playerId
  if (!playerId) {
    ack({ ok: false, reason: '로그인이 필요합니다.' })
    return
  }

  const pending = takePendingEncounter(playerId)
  if (!pending) {
    ack({ ok: false, reason: '진행 중인 전투가 없습니다.' })
    return
  }

  const player = getPlayerState(playerId)
  const { result } = req

  // heal all reported units and grant (clamped) xp — mercenaries never die permanently
  const claimedXpTotal = result.unitResults.reduce((sum, u) => sum + Math.max(0, u.xpGained), 0)
  const xpScale = claimedXpTotal > pending.maxXp && claimedXpTotal > 0 ? pending.maxXp / claimedXpTotal : 1

  let roster = player.roster
  for (const unitResult of result.unitResults) {
    const idx = roster.findIndex((u) => u.instanceId === unitResult.instanceId)
    if (idx === -1) continue
    const xpGained = Math.round(Math.max(0, unitResult.xpGained) * xpScale)
    const healed: MercenaryUnit = { ...roster[idx], currentHp: -1 }
    roster = roster.map((u, i) => (i === idx ? grantXp(healed, xpGained) : u))
  }

  const activeQuests = progressBountyQuests(player.activeQuests, result.killedEnemyTypeIds)

  let gold = player.gold
  let inventory = player.inventory
  let currentTownId = player.currentTownId

  if (result.victory) {
    const goldLoot = Math.max(0, Math.min(result.goldLoot, pending.maxGold))
    gold = player.gold + goldLoot
    inventory = { ...player.inventory }
    for (const [goodId, qty] of Object.entries(result.goodsLoot)) {
      inventory[goodId] = (inventory[goodId] ?? 0) + qty
    }
    currentTownId = pending.destinationTownId
  } else {
    const penalty = applyDefeatPenalty(player.gold, player.inventory)
    gold = penalty.gold
    inventory = penalty.inventory
  }

  updatePlayerFull(playerId, { gold, inventory, roster, activeQuests, currentTownId })

  if (result.victory) {
    const info = updateTown(playerId, currentTownId)
    if (info) socket.broadcast.emit('presence:update', info)
  }

  ack({ ok: true, gold, inventory, roster, activeQuests, currentTownId })
}
