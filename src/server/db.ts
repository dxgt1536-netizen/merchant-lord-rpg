import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { MercenaryUnit, PlayerState, Quest, TownPriceEntry } from '../shared/types'
import { GOODS } from '../shared/content/goods'
import { STARTING_TOWN_ID, TOWNS } from '../shared/content/towns'
import { PROTAGONIST_TYPE_ID } from '../shared/content/mercenaryTypes'

interface StoredPlayer {
  id: string
  nickname: string
  gold: number
  currentTownId: string
  unlockedTownIds: string[]
  inventory: Record<string, number>
  roster: MercenaryUnit[]
  activeQuests: Quest[]
  createdAt: string
  lastSeenAt: string
}

interface DbShape {
  players: StoredPlayer[]
  townPrices: Record<string, Record<string, TownPriceEntry>>
}

let dataDir = join(process.cwd(), 'src/server/data')
let dbFile = join(dataDir, 'game-data.json')
let data: DbShape = { players: [], townPrices: {} }

function load(): void {
  if (existsSync(dbFile)) {
    data = JSON.parse(readFileSync(dbFile, 'utf-8')) as DbShape
  } else {
    data = { players: [], townPrices: {} }
  }
}

function save(): void {
  const tmpFile = `${dbFile}.tmp`
  writeFileSync(tmpFile, JSON.stringify(data), 'utf-8')
  renameSync(tmpFile, dbFile)
}

/** Call before any other db function to point persistence at a specific directory (e.g. Electron's userData path). */
export function setDataDir(dir: string): void {
  dataDir = dir
  dbFile = join(dataDir, 'game-data.json')
  mkdirSync(dataDir, { recursive: true })
  load()
}

mkdirSync(dataDir, { recursive: true })
load()

function createProtagonist(): MercenaryUnit {
  return {
    instanceId: 'protagonist',
    typeId: PROTAGONIST_TYPE_ID,
    level: 1,
    xp: 0,
    currentHp: -1,
    equipment: {}
  }
}

function toPlayerState(p: StoredPlayer): PlayerState {
  return {
    gold: p.gold,
    inventory: p.inventory,
    roster: p.roster,
    currentTownId: p.currentTownId,
    unlockedTownIds: p.unlockedTownIds,
    activeQuests: p.activeQuests,
    townPriceState: {}
  }
}

export interface PlayerRecord {
  id: string
  nickname: string
  state: PlayerState
}

export function getOrCreatePlayer(nickname: string): PlayerRecord {
  const now = new Date().toISOString()
  const existing = data.players.find((p) => p.nickname === nickname)

  if (existing) {
    existing.lastSeenAt = now
    save()
    return { id: existing.id, nickname: existing.nickname, state: toPlayerState(existing) }
  }

  const newPlayer: StoredPlayer = {
    id: randomUUID(),
    nickname,
    gold: 300,
    currentTownId: STARTING_TOWN_ID,
    unlockedTownIds: TOWNS.map((t) => t.id),
    inventory: {},
    roster: [createProtagonist()],
    activeQuests: [],
    createdAt: now,
    lastSeenAt: now
  }
  data.players.push(newPlayer)
  save()

  return { id: newPlayer.id, nickname: newPlayer.nickname, state: toPlayerState(newPlayer) }
}

function findPlayer(id: string): StoredPlayer {
  const p = data.players.find((p) => p.id === id)
  if (!p) throw new Error(`Unknown player: ${id}`)
  return p
}

export function getPlayerState(id: string): PlayerState {
  return toPlayerState(findPlayer(id))
}

export function updatePlayerGoldAndInventory(id: string, gold: number, inventory: Record<string, number>): void {
  const p = findPlayer(id)
  p.gold = gold
  p.inventory = inventory
  save()
}

export function updatePlayerRoster(id: string, roster: MercenaryUnit[]): void {
  const p = findPlayer(id)
  p.roster = roster
  save()
}

export function updatePlayerQuests(id: string, activeQuests: Quest[]): void {
  const p = findPlayer(id)
  p.activeQuests = activeQuests
  save()
}

export function updatePlayerTown(id: string, townId: string): void {
  const p = findPlayer(id)
  p.currentTownId = townId
  save()
}

export function updatePlayerFull(
  id: string,
  fields: { gold: number; inventory: Record<string, number>; roster: MercenaryUnit[]; activeQuests: Quest[]; currentTownId: string }
): void {
  const p = findPlayer(id)
  p.gold = fields.gold
  p.inventory = fields.inventory
  p.roster = fields.roster
  p.activeQuests = fields.activeQuests
  p.currentTownId = fields.currentTownId
  save()
}

export function getAllTownPrices(): Record<string, Record<string, TownPriceEntry>> {
  return data.townPrices
}

export function setTownPrice(townId: string, goodId: string, buy: number, sell: number): void {
  data.townPrices[townId] ??= {}
  data.townPrices[townId][goodId] = { buy, sell }
  save()
}

export function ensureTownPricesSeeded(): void {
  if (Object.keys(data.townPrices).length > 0) return

  for (const town of TOWNS) {
    for (const good of GOODS) {
      const modifier = town.priceModifiers[good.id] ?? 1
      const mid = good.basePrice * modifier
      setTownPrice(town.id, good.id, Math.round(mid * 1.1), Math.round(mid * 0.9))
    }
  }
}
