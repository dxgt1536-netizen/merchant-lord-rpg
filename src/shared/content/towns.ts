import type { Town } from '../types'

export const STARTING_TOWN_ID = 'hanyang'

export const TOWNS: Town[] = [
  {
    id: 'hanyang',
    name: '한양',
    x: 400,
    y: 320,
    connections: [
      { toTownId: 'gaeseong', encounterChance: 0.15, dangerTier: 1 },
      { toTownId: 'pyongyang', encounterChance: 0.25, dangerTier: 2 }
    ],
    priceModifiers: {
      grain: 1.0,
      salt: 1.0,
      pottery: 1.0,
      silk: 1.05,
      ginseng: 1.05
    },
    availableEquipmentTierMax: 2
  },
  {
    id: 'gaeseong',
    name: '개성',
    x: 220,
    y: 200,
    connections: [
      { toTownId: 'hanyang', encounterChance: 0.15, dangerTier: 1 },
      { toTownId: 'pyongyang', encounterChance: 0.2, dangerTier: 1 },
      { toTownId: 'busan', encounterChance: 0.4, dangerTier: 3 }
    ],
    priceModifiers: {
      grain: 1.1,
      salt: 1.1,
      pottery: 1.0,
      silk: 0.9,
      ginseng: 0.6
    },
    availableEquipmentTierMax: 2
  },
  {
    id: 'pyongyang',
    name: '평양',
    x: 300,
    y: 70,
    connections: [
      { toTownId: 'hanyang', encounterChance: 0.25, dangerTier: 2 },
      { toTownId: 'gaeseong', encounterChance: 0.2, dangerTier: 1 },
      { toTownId: 'busan', encounterChance: 0.45, dangerTier: 3 }
    ],
    priceModifiers: {
      grain: 1.0,
      salt: 1.2,
      pottery: 0.8,
      silk: 0.6,
      ginseng: 1.1
    },
    availableEquipmentTierMax: 3
  },
  {
    id: 'busan',
    name: '부산',
    x: 620,
    y: 520,
    connections: [
      { toTownId: 'gaeseong', encounterChance: 0.4, dangerTier: 3 },
      { toTownId: 'pyongyang', encounterChance: 0.45, dangerTier: 3 }
    ],
    priceModifiers: {
      grain: 0.9,
      salt: 0.5,
      pottery: 1.1,
      silk: 1.2,
      ginseng: 1.3
    },
    availableEquipmentTierMax: 3
  }
]

export function getTown(id: string): Town {
  const town = TOWNS.find((t) => t.id === id)
  if (!town) throw new Error(`Unknown town: ${id}`)
  return town
}
