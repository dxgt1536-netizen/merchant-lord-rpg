import Phaser from 'phaser'
import type { UnitShape } from '../../../shared/types'
import { ENEMY_TEAM } from '../BattleConfig'
import { UnitEntity, type UnitRuntimeStats } from './UnitEntity'

export type EnemyAiState = 'idle' | 'chase' | 'attack' | 'return'

export class EnemyUnit extends UnitEntity {
  enemyTypeId: string
  aggroRange: number
  leashRange: number
  xpReward: number
  goldDropRange: [number, number]
  spawnPoint: { x: number; y: number }
  aiState: EnemyAiState = 'idle'

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemyTypeId: string,
    shape: UnitShape,
    color: number,
    stats: UnitRuntimeStats,
    aggroRange: number,
    leashRange: number,
    xpReward: number,
    goldDropRange: [number, number]
  ) {
    super(scene, x, y, ENEMY_TEAM, shape, color, stats)
    this.enemyTypeId = enemyTypeId
    this.aggroRange = aggroRange
    this.leashRange = leashRange
    this.xpReward = xpReward
    this.goldDropRange = goldDropRange
    this.spawnPoint = { x, y }
  }

  protected onDeath(): void {}
}
