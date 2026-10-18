import type { Ack, LoginData, LoginRequest } from '../../shared/socketEvents'
import { getAllTownPrices, getOrCreatePlayer } from '../db'
import { listOnline, removeOnline, setOnline } from '../presence'
import type { TypedSocket } from '../types'

export function handleLogin(socket: TypedSocket, req: LoginRequest, ack: (res: Ack<LoginData>) => void): void {
  const nickname = req.nickname.trim().slice(0, 20)
  if (!nickname) {
    ack({ ok: false, reason: '닉네임을 입력하세요.' })
    return
  }

  const record = getOrCreatePlayer(nickname)
  socket.data.playerId = record.id
  socket.data.nickname = record.nickname

  const onlinePlayers = listOnline()
  setOnline({ playerId: record.id, nickname: record.nickname, townId: record.state.currentTownId })

  ack({
    ok: true,
    playerId: record.id,
    player: record.state,
    townPrices: getAllTownPrices(),
    onlinePlayers
  })

  socket.broadcast.emit('presence:update', { playerId: record.id, nickname: record.nickname, townId: record.state.currentTownId })
}

export function handleDisconnect(socket: TypedSocket): void {
  const playerId = socket.data.playerId
  if (!playerId) return
  removeOnline(playerId)
  socket.broadcast.emit('presence:leave', { playerId })
}
