import type { OnlinePlayerInfo } from '../../shared/socketEvents'
import { eventBus } from './EventBus'

class PresenceStore {
  private players = new Map<string, OnlinePlayerInfo>()

  setInitial(list: OnlinePlayerInfo[]): void {
    this.players.clear()
    for (const p of list) this.players.set(p.playerId, p)
  }

  applyUpdate(info: OnlinePlayerInfo): void {
    this.players.set(info.playerId, info)
  }

  applyLeave(playerId: string): void {
    this.players.delete(playerId)
  }

  listByTown(townId: string, excludePlayerId?: string): OnlinePlayerInfo[] {
    return Array.from(this.players.values()).filter((p) => p.townId === townId && p.playerId !== excludePlayerId)
  }
}

export const presenceStore = new PresenceStore()

eventBus.on('net:presence-update', (info) => presenceStore.applyUpdate(info))
eventBus.on('net:presence-leave', ({ playerId }) => presenceStore.applyLeave(playerId))
