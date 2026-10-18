import Phaser from 'phaser'
import { SELECTION_RING_COLOR, UNIT_RADIUS } from '../BattleConfig'
import type { PlayerUnit } from '../entities/PlayerUnit'

const DRAG_THRESHOLD = 6

export class SelectionController {
  private dragStart: { x: number; y: number } | null = null
  private dragging = false
  private rectGfx: Phaser.GameObjects.Graphics
  private selected = new Set<PlayerUnit>()

  private onDown = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.button !== 0) return
    this.dragStart = { x: pointer.worldX, y: pointer.worldY }
    this.dragging = false
  }

  private onMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.dragStart || !pointer.leftButtonDown()) return
    const dx = pointer.worldX - this.dragStart.x
    const dy = pointer.worldY - this.dragStart.y
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      this.dragging = true
    }
    if (!this.dragging) return
    const rx = Math.min(this.dragStart.x, pointer.worldX)
    const ry = Math.min(this.dragStart.y, pointer.worldY)
    this.rectGfx.clear()
    this.rectGfx.lineStyle(1, SELECTION_RING_COLOR, 1)
    this.rectGfx.fillStyle(SELECTION_RING_COLOR, 0.15)
    this.rectGfx.fillRect(rx, ry, Math.abs(dx), Math.abs(dy))
    this.rectGfx.strokeRect(rx, ry, Math.abs(dx), Math.abs(dy))
  }

  private onUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.dragStart || pointer.button !== 0) return
    this.rectGfx.clear()
    const units = this.getUnits().filter((u) => !u.isDead)

    if (this.dragging) {
      const rx = Math.min(this.dragStart.x, pointer.worldX)
      const ry = Math.min(this.dragStart.y, pointer.worldY)
      const rw = Math.abs(pointer.worldX - this.dragStart.x)
      const rh = Math.abs(pointer.worldY - this.dragStart.y)
      const rect = new Phaser.Geom.Rectangle(rx, ry, rw, rh)
      this.setSelection(units.filter((u) => rect.contains(u.x, u.y)))
    } else {
      const clicked = units.find(
        (u) => Phaser.Math.Distance.Between(u.x, u.y, pointer.worldX, pointer.worldY) <= UNIT_RADIUS + 4
      )
      this.setSelection(clicked ? [clicked] : [])
    }

    this.dragStart = null
    this.dragging = false
  }

  constructor(private scene: Phaser.Scene, private getUnits: () => PlayerUnit[]) {
    this.rectGfx = scene.add.graphics().setDepth(1000)
    scene.input.on('pointerdown', this.onDown)
    scene.input.on('pointermove', this.onMove)
    scene.input.on('pointerup', this.onUp)
  }

  private setSelection(units: PlayerUnit[]): void {
    this.selected.forEach((u) => u.setSelected(false))
    this.selected = new Set(units)
    this.selected.forEach((u) => u.setSelected(true))
  }

  getSelectedUnits(): PlayerUnit[] {
    return Array.from(this.selected).filter((u) => !u.isDead)
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onDown)
    this.scene.input.off('pointermove', this.onMove)
    this.scene.input.off('pointerup', this.onUp)
    this.rectGfx.destroy()
  }
}
