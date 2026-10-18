import type { EnemyType } from '../types'

export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'bandit',
    name: '도적',
    icon: '🗡️',
    shape: 'square',
    color: 0x995533,
    baseStats: { hp: 60, attack: 10, defense: 3, moveSpeed: 100, attackRange: 32, attackCooldownMs: 900 },
    aggroRange: 150,
    leashRange: 250,
    xpReward: 15,
    goldDropRange: [5, 15]
  },
  {
    id: 'bandit_archer',
    name: '도적 궁수',
    icon: '🏹',
    shape: 'circle',
    color: 0x777733,
    baseStats: { hp: 40, attack: 12, defense: 1, moveSpeed: 100, attackRange: 140, attackCooldownMs: 1100 },
    aggroRange: 180,
    leashRange: 260,
    xpReward: 18,
    goldDropRange: [8, 18]
  },
  {
    id: 'wolf',
    name: '들개',
    icon: '🐺',
    shape: 'triangle',
    color: 0x666666,
    baseStats: { hp: 45, attack: 9, defense: 2, moveSpeed: 170, attackRange: 28, attackCooldownMs: 700 },
    aggroRange: 130,
    leashRange: 200,
    xpReward: 10,
    goldDropRange: [2, 8]
  },
  {
    id: 'bandit_leader',
    name: '산적 두목',
    icon: '💀',
    shape: 'square',
    color: 0x882222,
    baseStats: { hp: 160, attack: 16, defense: 8, moveSpeed: 110, attackRange: 38, attackCooldownMs: 850 },
    aggroRange: 200,
    leashRange: 300,
    xpReward: 40,
    goldDropRange: [20, 50]
  }
]

export function getEnemyType(id: string): EnemyType {
  const type = ENEMY_TYPES.find((t) => t.id === id)
  if (!type) throw new Error(`Unknown enemy type: ${id}`)
  return type
}
