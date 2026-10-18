import type { Screen } from '../core/ScreenManager'
import { screenManager } from '../core/ScreenManager'
import { gameStateStore } from '../core/GameStateStore'
import { eventBus } from '../core/EventBus'
import { getGood } from '../../shared/content/goods'
import { PROTAGONIST_TYPE_ID } from '../../shared/content/mercenaryTypes'
import { getMercenaryType } from '../../shared/content/mercenaryTypes'
import { computeEffectiveStats, currentHpOf, getUnitDisplayName, maxHpOf } from '../systems/MercenarySystem'
import { xpToNextLevel } from '../../shared/CombatFormulas'

export class InventoryScreen implements Screen {
  id = 'inventory'
  private container: HTMLElement | null = null
  private unsubs: (() => void)[] = []

  mount(container: HTMLElement): void {
    this.container = container
    this.render()
    this.unsubs.push(eventBus.on('state:roster-changed', () => this.render()))
    this.unsubs.push(eventBus.on('state:inventory-changed', () => this.render()))
    this.unsubs.push(eventBus.on('state:gold-changed', () => this.render()))
  }

  unmount(): void {
    this.unsubs.forEach((fn) => fn())
    this.unsubs = []
  }

  private render(): void {
    if (!this.container) return
    const state = gameStateStore.getState()
    this.container.innerHTML = ''

    const topbar = document.createElement('div')
    topbar.className = 'topbar'
    topbar.innerHTML = `<div><strong>용병단 / 화물</strong></div>`
    const goldEl = document.createElement('div')
    goldEl.className = 'gold-display'
    goldEl.textContent = `💰 ${state.gold} 냥`
    const backBtn = document.createElement('button')
    backBtn.textContent = '뒤로'
    backBtn.onclick = () => screenManager.show('world-map')
    topbar.appendChild(backBtn)
    topbar.appendChild(goldEl)
    this.container.appendChild(topbar)

    const content = document.createElement('div')
    content.className = 'content'

    const rosterPanel = document.createElement('div')
    rosterPanel.className = 'panel'
    const rosterTitle = document.createElement('h2')
    rosterTitle.textContent = `용병단 (${state.roster.length})`
    rosterPanel.appendChild(rosterTitle)

    const grid = document.createElement('div')
    grid.className = 'card-grid'
    for (const unit of state.roster) {
      const isProtagonist = unit.typeId === PROTAGONIST_TYPE_ID
      const icon = isProtagonist ? '🧑‍💼' : getMercenaryType(unit.typeId).icon
      const stats = computeEffectiveStats(unit)
      const hp = currentHpOf(unit)
      const maxHp = maxHpOf(unit)
      const xpNeeded = xpToNextLevel(unit.level)

      const card = document.createElement('div')
      card.className = 'card'
      card.innerHTML = `
        <div class="icon">${icon}</div>
        <div><strong>${getUnitDisplayName(unit)}</strong> Lv.${unit.level}</div>
        <div class="stat-line"><span>HP</span><span>${hp}/${maxHp}</span></div>
        <div class="hp-bar-track"><div class="hp-bar-fill" style="width:${Math.round((hp / maxHp) * 100)}%"></div></div>
        <div class="stat-line"><span>공격</span><span>${stats.attack}</span></div>
        <div class="stat-line"><span>방어</span><span>${stats.defense}</span></div>
        <div class="stat-line"><span>경험치</span><span>${unit.xp}/${xpNeeded}</span></div>
        <div class="stat-line"><span>장비</span><span>${unit.equipment.weapon ? '⚔️' : ''}${unit.equipment.armor ? '🛡️' : ''}</span></div>
      `
      grid.appendChild(card)
    }
    rosterPanel.appendChild(grid)
    content.appendChild(rosterPanel)

    const goodsPanel = document.createElement('div')
    goodsPanel.className = 'panel'
    const goodsTitle = document.createElement('h2')
    goodsTitle.textContent = '보유 화물'
    goodsPanel.appendChild(goodsTitle)

    const entries = Object.entries(state.inventory).filter(([, qty]) => qty > 0)
    if (entries.length === 0) {
      const empty = document.createElement('div')
      empty.style.color = 'var(--text-dim)'
      empty.textContent = '보유한 화물이 없습니다.'
      goodsPanel.appendChild(empty)
    } else {
      const table = document.createElement('table')
      table.innerHTML = '<thead><tr><th>품목</th><th>수량</th></tr></thead>'
      const tbody = document.createElement('tbody')
      for (const [goodId, qty] of entries) {
        const tr = document.createElement('tr')
        const good = getGood(goodId)
        tr.innerHTML = `<td>${good.icon} ${good.name}</td><td>${qty}</td>`
        tbody.appendChild(tr)
      }
      table.appendChild(tbody)
      goodsPanel.appendChild(table)
    }
    content.appendChild(goodsPanel)

    this.container.appendChild(content)
  }
}
