import type { MercenaryUnit, PlayerState, Quest, TownPriceEntry } from '../../shared/types'
import { eventBus } from './EventBus'

export interface BattleResultStateData {
  gold: number
  inventory: Record<string, number>
  roster: MercenaryUnit[]
  activeQuests: Quest[]
  currentTownId: string
}

class GameStateStore {
  private state: PlayerState | null = null
  private id: string | null = null
  private name: string | null = null

  get playerId(): string {
    if (!this.id) throw new Error('로그인되어 있지 않습니다.')
    return this.id
  }

  get nickname(): string {
    return this.name ?? ''
  }

  getState(): PlayerState {
    if (!this.state) throw new Error('로그인되어 있지 않습니다.')
    return this.state
  }

  applyLogin(playerId: string, nickname: string, player: PlayerState, townPrices: Record<string, Record<string, TownPriceEntry>>): void {
    this.id = playerId
    this.name = nickname
    this.state = { ...player, townPriceState: townPrices }

    eventBus.emit('state:gold-changed', { gold: this.state.gold })
    eventBus.emit('state:inventory-changed', {})
    eventBus.emit('state:roster-changed', {})
    eventBus.emit('state:town-changed', { townId: this.state.currentTownId })
    eventBus.emit('state:quests-changed', {})
  }

  applyPricesUpdate(townId: string, prices: Record<string, TownPriceEntry>): void {
    const state = this.getState()
    state.townPriceState[townId] = { ...(state.townPriceState[townId] ?? {}), ...prices }
    eventBus.emit('state:prices-changed', { townId })
  }

  applyGoldAndInventory(gold: number, inventory: Record<string, number>): void {
    const state = this.getState()
    state.gold = gold
    state.inventory = inventory
    eventBus.emit('state:gold-changed', { gold })
    eventBus.emit('state:inventory-changed', {})
  }

  applyCurrentTown(townId: string): void {
    this.getState().currentTownId = townId
    eventBus.emit('state:town-changed', { townId })
  }

  applyRoster(roster: MercenaryUnit[]): void {
    this.getState().roster = roster
    eventBus.emit('state:roster-changed', {})
  }

  applyQuests(activeQuests: Quest[]): void {
    this.getState().activeQuests = activeQuests
    eventBus.emit('state:quests-changed', {})
  }

  applyBattleResultData(data: BattleResultStateData): void {
    const state = this.getState()
    state.gold = data.gold
    state.inventory = data.inventory
    state.roster = data.roster
    state.activeQuests = data.activeQuests
    state.currentTownId = data.currentTownId

    eventBus.emit('state:gold-changed', { gold: data.gold })
    eventBus.emit('state:inventory-changed', {})
    eventBus.emit('state:roster-changed', {})
    eventBus.emit('state:quests-changed', {})
    eventBus.emit('state:town-changed', { townId: data.currentTownId })
  }

  getTownPrices(townId: string): Record<string, TownPriceEntry> {
    return this.getState().townPriceState[townId] ?? {}
  }
}

export const gameStateStore = new GameStateStore()
