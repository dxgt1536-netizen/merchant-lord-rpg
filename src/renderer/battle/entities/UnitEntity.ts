import Phaser from 'phaser'
import type { UnitShape } from '../../../shared/types'
import type { Team } from '../BattleConfig'
import { UNIT_RADIUS } from '../BattleConfig'
import { resolveAttackDamage } from '../../../shared/CombatFormulas'

export interface UnitRuntimeStats {
  hp: number
  attack: number
  defense: number
  moveSpeed: number
  attackRange: number
  attackCooldownMs: number
}

export type UnitState = 'idle' | 'moving' | 'attacking' | 'dead'

export abstract class UnitEntity extends Phaser.GameObjects.Container {
  team: Team
  stats: UnitRuntimeStats
  maxHp: number
  hp: number
  state: UnitState = 'idle'
  moveTargetPoint: { x: number; y: number } | null = null
  attackTargetUnit: UnitEntity | null = null
  lastAttackAtMs = 0
  isDead = false

  protected shapeGfx: Phaser.GameObjects.Graphics
  protected hpBarBg: Phaser.GameObjects.Rectangle
  protected hpBarFill: Phaser.GameObjects.Rectangle

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    team: Team,
    shape: UnitShape,
    color: number,
    stats: UnitRuntimeStats
  ) {
    super(scene, x, y)
    this.team = team
    this.stats = stats
    this.maxHp = stats.hp
    this.hp = stats.hp

    this.shapeGfx = scene.add.graphics()
    this.drawShape(shape, color)
    this.add(this.shapeGfx)

    this.hpBarBg = scene.add.rectangle(0, -UNIT_RADIUS - 10, 28, 5, 0x222222).setOrigin(0.5)
    this.hpBarFill = scene.add.rectangle(0, -UNIT_RADIUS - 10, 28, 5, 0x5a9c5a).setOrigin(0.5)
    this.add(this.hpBarBg)
    this.add(this.hpBarFill)

    scene.add.existing(this)
  }

  private drawShape(shape: UnitShape, color: number): void {
    this.shapeGfx.clear()
    this.shapeGfx.fillStyle(color, 1)
    this.shapeGfx.lineStyle(2, 0xffffff, 0.5)
    const r = UNIT_RADIUS
    if (shape === 'circle') {
      this.shapeGfx.fillCircle(0, 0, r)
      this.shapeGfx.strokeCircle(0, 0, r)
    } else if (shape === 'square') {
      this.shapeGfx.fillRect(-r, -r, r * 2, r * 2)
      this.shapeGfx.strokeRect(-r, -r, r * 2, r * 2)
    } else {
      this.shapeGfx.beginPath()
      this.shapeGfx.moveTo(0, -r)
      this.shapeGfx.lineTo(r, r)
      this.shapeGfx.lineTo(-r, r)
      this.shapeGfx.closePath()
      this.shapeGfx.fillPath()
      this.shapeGfx.strokePath()
    }
  }

  updateHpBar(): void {
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1)
    this.hpBarFill.width = 28 * ratio
    this.hpBarFill.x = -14 * (1 - ratio)
    this.hpBarFill.fillColor = ratio > 0.4 ? 0x5a9c5a : 0xc1503d
  }

  moveToPosition(x: number, y: number): void {
    this.moveTargetPoint = { x, y }
    this.attackTargetUnit = null
    this.state = 'moving'
  }

  attackMoveTo(target: UnitEntity): void {
    this.attackTargetUnit = target
    this.moveTargetPoint = null
    this.state = 'moving'
  }

  takeDamage(amount: number): void {
    if (this.isDead) return
    this.hp = Math.max(0, this.hp - amount)
    this.updateHpBar()
    if (this.hp <= 0) {
      this.die()
    }
  }

  protected die(): void {
    this.isDead = true
    this.state = 'dead'
    this.onDeath()
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.4,
      duration: 250,
      onComplete: () => this.destroy()
    })
  }

  protected abstract onDeath(): void

  /** When true, the unit auto-engages a hostile unit it comes within range of, even on a plain move order. */
  protected autoEngageEnabled = false
  protected autoEngageRadius = 70

  private findAutoEngageTarget(enemiesOf: () => UnitEntity[]): UnitEntity | null {
    let nearest: UnitEntity | null = null
    let nearestDist = this.autoEngageRadius
    for (const other of enemiesOf()) {
      if (other.isDead) continue
      const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y)
      if (dist <= nearestDist) {
        nearest = other
        nearestDist = dist
      }
    }
    return nearest
  }

  update(_time: number, delta: number, enemiesOf: () => UnitEntity[]): void {
    if (this.isDead) return

    if (this.autoEngageEnabled && !this.attackTargetUnit) {
      const found = this.findAutoEngageTarget(enemiesOf)
      if (found) {
        this.attackTargetUnit = found
      }
    }

    if (this.attackTargetUnit) {
      if (this.attackTargetUnit.isDead) {
        this.attackTargetUnit = null
        this.state = 'idle'
        return
      }
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.attackTargetUnit.x, this.attackTargetUnit.y)
      if (dist <= this.stats.attackRange) {
        this.state = 'attacking'
        this.performAttackIfReady(this.attackTargetUnit)
      } else {
        this.state = 'moving'
        this.stepToward(this.attackTargetUnit.x, this.attackTargetUnit.y, delta)
      }
      return
    }

    if (this.moveTargetPoint) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.moveTargetPoint.x, this.moveTargetPoint.y)
      if (dist < 4) {
        this.moveTargetPoint = null
        this.state = 'idle'
      } else {
        this.state = 'moving'
        this.stepToward(this.moveTargetPoint.x, this.moveTargetPoint.y, delta)
      }
      return
    }

    this.state = 'idle'
  }

  protected stepToward(tx: number, ty: number, delta: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty)
    const distStep = (this.stats.moveSpeed * delta) / 1000
    this.x += Math.cos(angle) * distStep
    this.y += Math.sin(angle) * distStep
  }

  protected performAttackIfReady(target: UnitEntity): void {
    const now = this.scene.time.now
    if (now - this.lastAttackAtMs < this.stats.attackCooldownMs) return
    this.lastAttackAtMs = now
    const damage = resolveAttackDamage(this.stats, target.stats)
    target.takeDamage(damage)
    this.onAttackLanded(target, damage)
  }

  protected onAttackLanded(_target: UnitEntity, _damage: number): void {}
}
