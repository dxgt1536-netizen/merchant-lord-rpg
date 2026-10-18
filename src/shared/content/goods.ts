import type { Good } from '../types'

export const GOODS: Good[] = [
  { id: 'grain', name: '쌀', icon: '🌾', basePrice: 10, category: 'food' },
  { id: 'salt', name: '소금', icon: '🧂', basePrice: 18, category: 'material' },
  { id: 'pottery', name: '도자기', icon: '🏺', basePrice: 45, category: 'craft' },
  { id: 'silk', name: '비단', icon: '🧵', basePrice: 80, category: 'luxury' },
  { id: 'ginseng', name: '인삼', icon: '🌿', basePrice: 120, category: 'luxury' }
]

export function getGood(id: string): Good {
  const good = GOODS.find((g) => g.id === id)
  if (!good) throw new Error(`Unknown good: ${id}`)
  return good
}
