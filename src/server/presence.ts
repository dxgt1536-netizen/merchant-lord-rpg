import type { OnlinePlayerInfo } from '../shared/socketEvents'

const online = new Map<string, OnlinePlayerInfo>()

export function setOnline(info: OnlinePlayerInfo): void {
  online.set(info.playerId, info)
}

export function updateTown(playerId: string, townId: string): OnlinePlayerInfo | undefined {
  const info = online.get(playerId)
  if (!info) return undefined
  info.townId = townId
  return info
}

export function removeOnline(playerId: string): void {
  online.delete(playerId)
}

export function listOnline(): OnlinePlayerInfo[] {
  return Array.from(online.values())
}
