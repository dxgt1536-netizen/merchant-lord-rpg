import { handleDisconnect, handleLogin } from './loginHandler'
import { handleTradeBuy, handleTradeSell } from './tradeHandler'
import { handleHire } from './mercenaryHandler'
import { handleEquipmentPurchase } from './equipmentHandler'
import { handleQuestAccept, handleQuestTurnIn } from './questHandler'
import { handleTravelRequest } from './travelHandler'
import { handleBattleResult } from './battleResultHandler'
import type { TypedSocket } from '../types'

export function registerConnectionHandlers(socket: TypedSocket): void {
  socket.on('login', (req, ack) => handleLogin(socket, req, ack))
  socket.on('trade:buy', (req, ack) => handleTradeBuy(socket, req, ack))
  socket.on('trade:sell', (req, ack) => handleTradeSell(socket, req, ack))
  socket.on('mercenary:hire', (req, ack) => handleHire(socket, req, ack))
  socket.on('equipment:purchase', (req, ack) => handleEquipmentPurchase(socket, req, ack))
  socket.on('quest:accept', (req, ack) => handleQuestAccept(socket, req, ack))
  socket.on('quest:turnIn', (req, ack) => handleQuestTurnIn(socket, req, ack))
  socket.on('travel:request', (req, ack) => handleTravelRequest(socket, req, ack))
  socket.on('battle:result', (req, ack) => handleBattleResult(socket, req, ack))
  socket.on('disconnect', () => handleDisconnect(socket))
}
