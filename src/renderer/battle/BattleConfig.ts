export const BATTLE_WIDTH = 960
export const BATTLE_HEIGHT = 600
export const UNIT_RADIUS = 14
export const SELECTION_RING_COLOR = 0xf0c063
export const PLAYER_TEAM = 'player' as const
export const ENEMY_TEAM = 'enemy' as const
export type Team = typeof PLAYER_TEAM | typeof ENEMY_TEAM
