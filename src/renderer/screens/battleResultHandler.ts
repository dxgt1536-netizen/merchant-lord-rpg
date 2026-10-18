import type { BattleResult } from '../../shared/types'
import { screenManager } from '../core/ScreenManager'
import { gameStateStore } from '../core/GameStateStore'
import { getUnitDisplayName } from '../systems/MercenarySystem'
import { reportBattleResult } from '../net/SocketClient'
import { showToast } from '../core/toast'
import type { ResultPayload } from './ResultScreen'

export async function applyBattleResult(result: BattleResult): Promise<void> {
  const before = gameStateStore.getState()
  const beforeGold = before.gold
  const beforeInventory = { ...before.inventory }
  const beforeRoster = before.roster

  const res = await reportBattleResult({ result })
  if (!res.ok) {
    showToast(res.reason ?? '전투 결과 처리에 실패했습니다.', 'error')
    screenManager.show('world-map')
    return
  }

  const xpSummary: ResultPayload['xpSummary'] = []
  for (const unitResult of result.unitResults) {
    const beforeUnit = beforeRoster.find((u) => u.instanceId === unitResult.instanceId)
    const afterUnit = res.roster.find((u) => u.instanceId === unitResult.instanceId)
    if (!beforeUnit || !afterUnit) continue
    xpSummary.push({
      name: getUnitDisplayName(beforeUnit),
      xpGained: Math.max(0, unitResult.xpGained),
      leveledUp: afterUnit.level > beforeUnit.level
    })
  }

  gameStateStore.applyBattleResultData(res)

  if (result.victory) {
    screenManager.show<ResultPayload>('result', {
      victory: true,
      goldLoot: res.gold - beforeGold,
      goodsLoot: result.goodsLoot,
      xpSummary
    })
  } else {
    const goodsLost: Record<string, number> = {}
    for (const [goodId, qtyBefore] of Object.entries(beforeInventory)) {
      const qtyAfter = res.inventory[goodId] ?? 0
      if (qtyBefore > qtyAfter) goodsLost[goodId] = qtyBefore - qtyAfter
    }
    screenManager.show<ResultPayload>('result', {
      victory: false,
      goldLost: beforeGold - res.gold,
      goodsLost,
      xpSummary
    })
  }
}
