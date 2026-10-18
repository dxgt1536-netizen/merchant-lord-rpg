import { io, type Socket } from 'socket.io-client'
import { SERVER_URL } from '../../shared/config'
import type {
  Ack,
  BattleResultData,
  BattleResultRequest,
  ClientToServerEvents,
  EquipmentPurchaseData,
  EquipmentPurchaseRequest,
  HireData,
  HireRequest,
  LoginData,
  QuestAcceptData,
  QuestAcceptRequest,
  QuestTurnInData,
  QuestTurnInRequest,
  ServerToClientEvents,
  TradeData,
  TradeRequest,
  TravelData,
  TravelRequest
} from '../../shared/socketEvents'
import { eventBus } from '../core/EventBus'
import { gameStateStore } from '../core/GameStateStore'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: AppSocket | null = null

function requireSocket(): AppSocket {
  if (!socket) throw new Error('서버에 연결되어 있지 않습니다.')
  return socket
}

export function connectSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s: AppSocket = io(SERVER_URL, { transports: ['websocket'] })
    socket = s

    s.once('connect', () => resolve())
    s.once('connect_error', (err) => reject(err))

    s.on('disconnect', () => eventBus.emit('net:disconnected', {}))
    s.on('presence:update', (payload) => eventBus.emit('net:presence-update', payload))
    s.on('presence:leave', (payload) => eventBus.emit('net:presence-leave', payload))
    s.on('prices:update', (payload) => gameStateStore.applyPricesUpdate(payload.townId, payload.prices))
  })
}

export function login(nickname: string): Promise<Ack<LoginData>> {
  return new Promise((resolve) => requireSocket().emit('login', { nickname }, resolve))
}

export function requestBuy(req: TradeRequest): Promise<Ack<TradeData>> {
  return new Promise((resolve) => requireSocket().emit('trade:buy', req, resolve))
}

export function requestSell(req: TradeRequest): Promise<Ack<TradeData>> {
  return new Promise((resolve) => requireSocket().emit('trade:sell', req, resolve))
}

export function requestHire(req: HireRequest): Promise<Ack<HireData>> {
  return new Promise((resolve) => requireSocket().emit('mercenary:hire', req, resolve))
}

export function requestEquipmentPurchase(req: EquipmentPurchaseRequest): Promise<Ack<EquipmentPurchaseData>> {
  return new Promise((resolve) => requireSocket().emit('equipment:purchase', req, resolve))
}

export function requestQuestAccept(req: QuestAcceptRequest): Promise<Ack<QuestAcceptData>> {
  return new Promise((resolve) => requireSocket().emit('quest:accept', req, resolve))
}

export function requestQuestTurnIn(req: QuestTurnInRequest): Promise<Ack<QuestTurnInData>> {
  return new Promise((resolve) => requireSocket().emit('quest:turnIn', req, resolve))
}

export function requestTravel(req: TravelRequest): Promise<Ack<TravelData>> {
  return new Promise((resolve) => requireSocket().emit('travel:request', req, resolve))
}

export function reportBattleResult(req: BattleResultRequest): Promise<Ack<BattleResultData>> {
  return new Promise((resolve) => requireSocket().emit('battle:result', req, resolve))
}
