import Phaser from 'phaser'
import type { BattleResult, BattleSetup, BattleUnitResult } from '../../../shared/types'
import { BATTLE_HEIGHT, BATTLE_WIDTH } from '../BattleConfig'
import { PlayerUnit } from '../entities/PlayerUnit'
import { EnemyUnit } from '../entities/EnemyUnit'
import { SelectionController } from '../control/SelectionController'
import { OrderController } from '../control/OrderController'
import { runEnemyAI } from '../ai/EnemyAI'
import { getMercenaryType, PROTAGONIST_TYPE_ID } from '../../../shared/content/mercenaryTypes'
import { getEnemyType } from '../../../shared/content/enemyTypes'
import { computeEffectiveStats, currentHpOf } from '../../systems/MercenarySystem'

export interface BattleSceneData {
  setup: BattleSetup
  onFinish: (result: BattleResult) => void
}

export class BattleScene extends Phaser.Scene {
  private battleData!: BattleSceneData
  private playerUnits: PlayerUnit[] = []
  private enemyUnits: EnemyUnit[] = []
  private selectionController!: SelectionController
  private orderController!: OrderController
  private goldLoot = 0
  private killedEnemyTypeIds: string[] = []
  private battleEnded = false
  private hudEl: HTMLElement | null = null
  private hudAccumMs = 0

  constructor() {
    super('BattleScene')
  }

  init(data: BattleSceneData): void {
    this.battleData = data
    this.playerUnits = []
    this.enemyUnits = []
    this.goldLoot = 0
    this.killedEnemyTypeIds = []
    this.battleEnded = false
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#12200f')
    this.drawArenaMarkers()
    this.spawnPlayerUnits()
    this.spawnEnemyUnits()

    this.selectionController = new SelectionController(this, () => this.playerUnits)
    this.orderController = new OrderController(
      this,
      () => this.selectionController.getSelectedUnits(),
      () => this.enemyUnits
    )

    this.hudEl = document.getElementById('battle-hud')
    this.renderHud()

    const hint = this.add.text(BATTLE_WIDTH / 2, 16, '좌클릭 드래그: 아군 선택   우클릭: 이동 / 공격', {
      fontSize: '13px',
      color: '#ecdcc0'
    })
    hint.setOrigin(0.5, 0)
  }

  private drawArenaMarkers(): void {
    const g = this.add.graphics()
    g.lineStyle(2, 0x2f4a2a, 1)
    g.strokeRect(20, 20, BATTLE_WIDTH - 40, BATTLE_HEIGHT - 40)
  }

  private spawnPlayerUnits(): void {
    const count = this.battleData.setup.playerUnits.length
    const cols = Math.ceil(Math.sqrt(count))
    const spacing = 46
    const baseX = 160
    const baseY = BATTLE_HEIGHT / 2

    this.battleData.setup.playerUnits.forEach((unit, i) => {
      const row = Math.floor(i / cols)
      const col = i % cols
      const x = baseX + col * spacing
      const y = baseY + (row - (Math.ceil(count / cols) - 1) / 2) * spacing

      const isProtagonist = unit.typeId === PROTAGONIST_TYPE_ID
      const shape = isProtagonist ? 'triangle' : getMercenaryType(unit.typeId).shape
      const color = isProtagonist ? 0xf0c063 : getMercenaryType(unit.typeId).color
      const stats = computeEffectiveStats(unit)
      const hp = currentHpOf(unit)

      const entity = new PlayerUnit(this, x, y, unit.instanceId, unit.typeId, shape, color, stats)
      entity.hp = hp
      entity.updateHpBar()
      this.playerUnits.push(entity)
    })
  }

  private spawnEnemyUnits(): void {
    const flat: string[] = []
    for (const group of this.battleData.setup.enemySquad) {
      for (let i = 0; i < group.count; i++) flat.push(group.enemyTypeId)
    }
    const cols = Math.ceil(Math.sqrt(flat.length))
    const spacing = 50
    const baseX = BATTLE_WIDTH - 160
    const baseY = BATTLE_HEIGHT / 2

    flat.forEach((enemyTypeId, i) => {
      const type = getEnemyType(enemyTypeId)
      const row = Math.floor(i / cols)
      const col = i % cols
      const x = baseX - col * spacing
      const y = baseY + (row - (Math.ceil(flat.length / cols) - 1) / 2) * spacing

      const entity = new EnemyUnit(
        this,
        x,
        y,
        type.id,
        type.shape,
        type.color,
        { ...type.baseStats },
        type.aggroRange,
        type.leashRange,
        type.xpReward,
        type.goldDropRange
      )
      this.enemyUnits.push(entity)
    })
  }

  update(time: number, delta: number): void {
    if (this.battleEnded) return

    for (const enemy of this.enemyUnits) {
      if (enemy.isDead) continue
      runEnemyAI(enemy, this.playerUnits)
      enemy.update(time, delta, () => this.playerUnits)
    }

    for (const unit of this.playerUnits) {
      if (unit.isDead) continue
      unit.update(time, delta, () => this.enemyUnits)
    }

    this.checkEnemyDeaths()
    this.checkEndConditions()

    this.hudAccumMs += delta
    if (this.hudAccumMs > 200) {
      this.hudAccumMs = 0
      this.renderHud()
    }
  }

  private processedDeaths = new Set<EnemyUnit>()

  private checkEnemyDeaths(): void {
    for (const enemy of this.enemyUnits) {
      if (enemy.isDead && !this.processedDeaths.has(enemy)) {
        this.processedDeaths.add(enemy)
        this.onEnemyDeath(enemy)
      }
    }
  }

  private onEnemyDeath(enemy: EnemyUnit): void {
    this.killedEnemyTypeIds.push(enemy.enemyTypeId)
    const [minGold, maxGold] = enemy.goldDropRange
    this.goldLoot += Phaser.Math.Between(minGold, maxGold)

    const alive = this.playerUnits.filter((u) => !u.isDead)
    if (alive.length > 0) {
      const xpEach = Math.max(1, Math.round(enemy.xpReward / alive.length))
      for (const u of alive) u.xpGained += xpEach
    }
  }

  private checkEndConditions(): void {
    const enemiesAllDead = this.enemyUnits.every((e) => e.isDead)
    const playersAllDead = this.playerUnits.every((u) => u.isDead)

    if (enemiesAllDead) {
      this.finishBattle(true)
    } else if (playersAllDead) {
      this.finishBattle(false)
    }
  }

  private finishBattle(victory: boolean): void {
    if (this.battleEnded) return
    this.battleEnded = true

    const unitResults: BattleUnitResult[] = this.playerUnits.map((u) => ({
      instanceId: u.instanceId,
      survived: !u.isDead,
      finalHp: u.isDead ? 0 : Math.round(u.hp),
      xpGained: u.xpGained
    }))

    const result: BattleResult = {
      victory,
      goldLoot: victory ? this.goldLoot : 0,
      goodsLoot: {},
      unitResults,
      killedEnemyTypeIds: this.killedEnemyTypeIds
    }

    if (this.hudEl) this.hudEl.innerHTML = ''

    this.time.delayedCall(400, () => this.battleData.onFinish(result))
  }

  private renderHud(): void {
    if (!this.hudEl) return
    const aliveEnemies = this.enemyUnits.filter((e) => !e.isDead).length
    const aliveAllies = this.playerUnits.filter((u) => !u.isDead).length
    this.hudEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;padding:10px 20px;background:rgba(20,15,10,0.7);font-size:14px;">
        <span>아군 ${aliveAllies}/${this.playerUnits.length}</span>
        <span>적 ${aliveEnemies}/${this.enemyUnits.length}</span>
      </div>
    `
  }

  shutdown(): void {
    this.selectionController?.destroy()
    this.orderController?.destroy()
    if (this.hudEl) this.hudEl.innerHTML = ''
  }
}
