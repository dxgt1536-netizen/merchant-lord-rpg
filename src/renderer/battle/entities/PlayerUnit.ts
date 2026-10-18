import Phaser from 'phaser'
import type { UnitShape } from '../../../shared/types'
import { PLAYER_TEAM, SELECTION_RING_COLOR, UNIT_RADIUS } from '../BattleConfig'
import { UnitEntity, type UnitRuntimeStats } from './UnitEntity'

export class PlayerUnit extends UnitEntity {
  instanceId: string
  typeId: string
  xpGained = 0
  private selectionRing: Phaser.GameObjects.Graphics
  private selected = false

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    instanceId: string,
    typeId: string,
    shape: UnitShape,
    color: number,
    stats: UnitRuntimeStats
  ) {
    super(scene, x, y, PLAYER_TEAM, shape, color, stats)
    this.instanceId = instanceId
    this.typeId = typeId
    this.autoEngageEnabled = true

    this.selectionRing = scene.add.graphics()
    this.selectionRing.lineStyle(2, SELECTION_RING_COLOR, 1)
    this.selectionRing.strokeCircle(0, 0, UNIT_RADIUS + 5)
    this.selectionRing.setVisible(false)
    this.addAt(this.selectionRing, 0)
  }

  setSelected(selected: boolean): void {
    this.selected = selected
    this.selectionRing.setVisible(selected)
  }

  isSelected(): boolean {
    return this.selected
  }

  protected onDeath(): void {
    this.setSelected(false)
  }
}
