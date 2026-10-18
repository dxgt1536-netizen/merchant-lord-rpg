import type { EquipmentItem } from '../types'

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'weapon_t1', name: '무쇠 검', slot: 'weapon', tier: 1, cost: 80, bonus: { attack: 4 } },
  { id: 'weapon_t2', name: '단조 도', slot: 'weapon', tier: 2, cost: 200, bonus: { attack: 9 } },
  { id: 'weapon_t3', name: '명장의 검', slot: 'weapon', tier: 3, cost: 450, bonus: { attack: 16 } },
  { id: 'armor_t1', name: '가죽 갑옷', slot: 'armor', tier: 1, cost: 80, bonus: { defense: 3, hp: 10 } },
  { id: 'armor_t2', name: '철제 갑옷', slot: 'armor', tier: 2, cost: 200, bonus: { defense: 7, hp: 25 } },
  { id: 'armor_t3', name: '판금 갑옷', slot: 'armor', tier: 3, cost: 450, bonus: { defense: 13, hp: 45 } }
]

export function getEquipmentItem(id: string): EquipmentItem {
  const item = EQUIPMENT_ITEMS.find((e) => e.id === id)
  if (!item) throw new Error(`Unknown equipment item: ${id}`)
  return item
}
