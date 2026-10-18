import type { Screen } from '../core/ScreenManager'
import { screenManager } from '../core/ScreenManager'
import { gameStateStore } from '../core/GameStateStore'
import { eventBus } from '../core/EventBus'
import { presenceStore } from '../core/PresenceStore'
import { showToast } from '../core/toast'
import { TOWNS, getTown } from '../../shared/content/towns'
import { attemptTravel, connectionTo } from '../systems/TravelSystem'
import { startBattle } from '../battle/PhaserGameHost'
import { applyBattleResult } from './battleResultHandler'

const MAP_W = 800
const MAP_H = 600

export class WorldMapScreen implements Screen {
  id = 'world-map'
  private container: HTMLElement | null = null
  private unsubs: (() => void)[] = []

  mount(container: HTMLElement): void {
    this.container = container
    this.render()
    this.unsubs.push(eventBus.on('state:town-changed', () => this.render()))
    this.unsubs.push(eventBus.on('state:gold-changed', () => this.render()))
    this.unsubs.push(eventBus.on('net:presence-update', () => this.render()))
    this.unsubs.push(eventBus.on('net:presence-leave', () => this.render()))
  }

  unmount(): void {
    this.unsubs.forEach((fn) => fn())
    this.unsubs = []
  }

  private render(): void {
    if (!this.container) return
    const state = gameStateStore.getState()
    const currentTownId = state.currentTownId
    const currentTown = getTown(currentTownId)

    this.container.innerHTML = ''

    const topbar = document.createElement('div')
    topbar.className = 'topbar'
    topbar.innerHTML = `<div><strong>${currentTown.name}</strong> 인근 - 세계 지도 <span style="color:var(--text-dim)">(${gameStateStore.nickname})</span></div>`
    const goldEl = document.createElement('div')
    goldEl.className = 'gold-display'
    goldEl.textContent = `💰 ${state.gold} 냥`
    const nav = document.createElement('div')
    nav.className = 'nav'
    const enterBtn = document.createElement('button')
    enterBtn.className = 'primary'
    enterBtn.textContent = `${currentTown.name} 마을 진입`
    enterBtn.onclick = () => screenManager.show('town')
    const invBtn = document.createElement('button')
    invBtn.textContent = '용병단/화물'
    invBtn.onclick = () => screenManager.show('inventory')
    nav.appendChild(enterBtn)
    nav.appendChild(invBtn)
    topbar.appendChild(nav)
    topbar.appendChild(goldEl)
    this.container.appendChild(topbar)

    const content = document.createElement('div')
    content.className = 'content'
    content.style.padding = '0'

    const mapCanvas = document.createElement('div')
    mapCanvas.className = 'map-canvas'

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'map-svg-lines')
    svg.setAttribute('viewBox', `0 0 ${MAP_W} ${MAP_H}`)
    svg.setAttribute('preserveAspectRatio', 'none')

    const drawn = new Set<string>()
    for (const town of TOWNS) {
      for (const conn of town.connections) {
        const key = [town.id, conn.toTownId].sort().join('-')
        if (drawn.has(key)) continue
        drawn.add(key)
        const other = getTown(conn.toTownId)
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', String(town.x))
        line.setAttribute('y1', String(town.y))
        line.setAttribute('x2', String(other.x))
        line.setAttribute('y2', String(other.y))
        line.setAttribute('stroke', '#6b4f2f')
        line.setAttribute('stroke-width', '2')
        line.setAttribute('stroke-dasharray', '6 4')
        svg.appendChild(line)
      }
    }
    mapCanvas.appendChild(svg)

    for (const town of TOWNS) {
      const node = document.createElement('button')
      node.className = 'town-node' + (town.id === currentTownId ? ' current' : '')
      node.style.left = `${(town.x / MAP_W) * 100}%`
      node.style.top = `${(town.y / MAP_H) * 100}%`

      const dot = document.createElement('div')
      dot.className = 'dot'
      const label = document.createElement('div')
      label.textContent = town.name
      node.appendChild(dot)
      node.appendChild(label)

      const others = presenceStore.listByTown(town.id, gameStateStore.playerId)
      if (others.length > 0) {
        const badge = document.createElement('div')
        badge.style.fontSize = '11px'
        badge.style.color = 'var(--accent-strong)'
        badge.textContent = `👥 ${others.length} (${others.map((o) => o.nickname).join(', ')})`
        node.appendChild(badge)
      }

      if (town.id === currentTownId) {
        node.title = '현재 위치'
        node.onclick = () => screenManager.show('town')
      } else {
        const reachable = currentTown.connections.some((c) => c.toTownId === town.id)
        if (reachable) {
          const conn = connectionTo(town.id)
          node.title = `이동 (조우 확률 ${Math.round(conn.encounterChance * 100)}%)`
          node.onclick = () => this.travelTo(town.id)
        } else {
          node.style.opacity = '0.4'
          node.title = '직접 연결된 경로가 없습니다'
        }
      }
      mapCanvas.appendChild(node)
    }

    content.appendChild(mapCanvas)
    this.container.appendChild(content)
  }

  private async travelTo(destinationTownId: string): Promise<void> {
    let outcome
    try {
      outcome = await attemptTravel(destinationTownId)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '이동에 실패했습니다.', 'error')
      return
    }

    if (!outcome.encounter) {
      showToast(`${getTown(destinationTownId).name}에 도착했습니다.`)
      return
    }

    showToast('노상에서 습격을 받았습니다!', 'error')
    screenManager.show('battle')
    const result = await startBattle(outcome.battleSetup!)
    await applyBattleResult(result)
  }
}
