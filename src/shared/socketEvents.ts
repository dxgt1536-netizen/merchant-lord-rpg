import type { BattleResult, BattleSetup, MercenaryUnit, PlayerState, Quest, QuestOffer, TownPriceEntry } from './types'

export interface OnlinePlayerInfo {
  playerId: string
  nickname: string
  townId: string
}

export type TownPrices = Record<string, Record<string, TownPriceEntry>>

export type Ack<T> = { ok: true } & T | { ok: false; reason: string }

export interface LoginRequest {
  nickname: string
}
export interface LoginData {
  playerId: string
  player: PlayerState
  townPrices: TownPrices
  onlinePlayers: OnlinePlayerInfo[]
}

export interface TradeRequest {
  goodId: string
  qty: number
}
export interface TradeData {
  gold: number
  inventory: Record<string, number>
  totalGold: number
}

export interface HireRequest {
  typeId: string
}
export interface HireData {
  gold: number
  roster: MercenaryUnit[]
}

export interface EquipmentPurchaseRequest {
  instanceId: string
  equipmentId: string
}
export interface EquipmentPurchaseData {
  gold: number
  roster: MercenaryUnit[]
}

export interface QuestAcceptRequest {
  offer: QuestOffer
}
export interface QuestAcceptData {
  activeQuests: Quest[]
}

export interface QuestTurnInRequest {
  questInstanceId: string
}
export interface QuestTurnInData {
  gold: number
  inventory: Record<string, number>
  activeQuests: Quest[]
}

export interface TravelRequest {
  destinationTownId: string
}
export type TravelData =
  | { encounter: false; townId: string }
  | { encounter: true; battleSetup: BattleSetup }

export interface BattleResultRequest {
  result: BattleResult
}
export interface BattleResultData {
  gold: number
  inventory: Record<string, number>
  roster: MercenaryUnit[]
  activeQuests: Quest[]
  currentTownId: string
}

export interface ClientToServerEvents {
  login: (req: LoginRequest, ack: (res: Ack<LoginData>) => void) => void
  'trade:buy': (req: TradeRequest, ack: (res: Ack<TradeData>) => void) => void
  'trade:sell': (req: TradeRequest, ack: (res: Ack<TradeData>) => void) => void
  'mercenary:hire': (req: HireRequest, ack: (res: Ack<HireData>) => void) => void
  'equipment:purchase': (req: EquipmentPurchaseRequest, ack: (res: Ack<EquipmentPurchaseData>) => void) => void
  'quest:accept': (req: QuestAcceptRequest, ack: (res: Ack<QuestAcceptData>) => void) => void
  'quest:turnIn': (req: QuestTurnInRequest, ack: (res: Ack<QuestTurnInData>) => void) => void
  'travel:request': (req: TravelRequest, ack: (res: Ack<TravelData>) => void) => void
  'battle:result': (req: BattleResultRequest, ack: (res: Ack<BattleResultData>) => void) => void
}

export interface ServerToClientEvents {
  'prices:update': (payload: { townId: string; prices: Record<string, TownPriceEntry> }) => void
  'presence:update': (payload: OnlinePlayerInfo) => void
  'presence:leave': (payload: { playerId: string }) => void
}
