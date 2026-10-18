import Phaser from 'phaser'
import type { EnemyUnit } from '../entities/EnemyUnit'
import type { PlayerUnit } from '../entities/PlayerUnit'

function findNearestTarget(enemy: EnemyUnit, playerUnits: PlayerUnit[], maxRange: number): PlayerUnit | null {
  let nearest: PlayerUnit | null = null
  let nearestDist = Infinity
  for (const unit of playerUnits) {
    if (unit.isDead) continue
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, unit.x, unit.y)
    if (dist <= maxRange && dist < nearestDist) {
      nearest = unit
      nearestDist = dist
    }
  }
  return nearest
}

export function runEnemyAI(enemy: EnemyUnit, playerUnits: PlayerUnit[]): void {
  if (enemy.isDead) return

  if (enemy.aiState === 'idle') {
    const target = findNearestTarget(enemy, playerUnits, enemy.aggroRange)
    if (target) {
      enemy.aiState = 'chase'
      enemy.attackMoveTo(target)
    }
    return
  }

  if (enemy.aiState === 'chase' || enemy.aiState === 'attack') {
    if (!enemy.attackTargetUnit || enemy.attackTargetUnit.isDead) {
      enemy.aiState = 'return'
      enemy.moveToPosition(enemy.spawnPoint.x, enemy.spawnPoint.y)
      return
    }
    const distFromSpawn = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.spawnPoint.x, enemy.spawnPoint.y)
    if (distFromSpawn > enemy.leashRange) {
      enemy.aiState = 'return'
      enemy.attackTargetUnit = null
      enemy.moveToPosition(enemy.spawnPoint.x, enemy.spawnPoint.y)
      return
    }
    const distToTarget = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.attackTargetUnit.x, enemy.attackTargetUnit.y)
    enemy.aiState = distToTarget <= enemy.stats.attackRange ? 'attack' : 'chase'
    return
  }

  if (enemy.aiState === 'return') {
    if (!enemy.moveTargetPoint) {
      enemy.aiState = 'idle'
    }
  }
}
