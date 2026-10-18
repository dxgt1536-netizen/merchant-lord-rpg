import Phaser from 'phaser'
import { UNIT_RADIUS } from '../BattleConfig'
import type { PlayerUnit } from '../entities/PlayerUnit'
import type { EnemyUnit } from '../entities/EnemyUnit'

function formationOffset(index: number, total: number): { x: number; y: number } {
  if (total <= 1) return { x: 0, y: 0 }
  const cols = Math.ceil(Math.sqrt(total))
  const spacing = UNIT_RADIUS * 2.4
  const row = Math.floor(index / cols)
  const col = index % cols
  const offsetX = (col - (cols - 1) / 2) * spacing
  const offsetY = (row - (Math.ceil(total / cols) - 1) / 2) * spacing
  return { x: offsetX, y: offsetY }
}

export class OrderController {
  private onDown = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.button !== 2) return
    const selected = this.getSelected()
    if (selected.length === 0) return

    const enemies = this.getEnemies().filter((e) => !e.isDead)
    const target = enemies.find(
      (e) => Phaser.Math.Distance.Between(e.x, e.y, pointer.worldX, pointer.worldY) <= UNIT_RADIUS + 12
    )

    if (target) {
      selected.forEach((u) => u.attackMoveTo(target))
    } else {
      selected.forEach((u, i) => {
        const offset = formationOffset(i, selected.length)
        u.moveToPosition(pointer.worldX + offset.x, pointer.worldY + offset.y)
      })
    }
  }

  constructor(
    private scene: Phaser.Scene,
    private getSelected: () => PlayerUnit[],
    private getEnemies: () => EnemyUnit[]
  ) {
    scene.input.on('pointerdown', this.onDown)
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onDown)
  }
}
