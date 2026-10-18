import type { BattleResult } from '../../shared/types'
import type { OnlinePlayerInfo } from '../../shared/socketEvents'

export interface GameEvents {
  'state:gold-changed': { gold: number }
  'state:inventory-changed': Record<string, never>
  'state:roster-changed': Record<string, never>
  'state:town-changed': { townId: string }
  'state:quests-changed': Record<string, never>
  'state:prices-changed': { townId: string }
  'battle:finished': { result: BattleResult }
  'net:presence-update': OnlinePlayerInfo
  'net:presence-leave': { playerId: string }
  'net:disconnected': Record<string, never>
}

type Listener<T> = (payload: T) => void

class EventBus {
  private listeners = new Map<keyof GameEvents, Set<Listener<unknown>>>()

  on<K extends keyof GameEvents>(event: K, listener: Listener<GameEvents[K]>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(listener as Listener<unknown>)
    return () => set!.delete(listener as Listener<unknown>)
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload))
  }
}

export const eventBus = new EventBus()
