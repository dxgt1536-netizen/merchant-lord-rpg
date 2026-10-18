import type { Screen } from '../core/ScreenManager'
import { screenManager } from '../core/ScreenManager'
import { gameStateStore } from '../core/GameStateStore'
import { eventBus } from '../core/EventBus'
import { showToast } from '../core/toast'
import { getTown } from '../../shared/content/towns'
import { getGood } from '../../shared/content/goods'
import { buyGood, sellGood } from '../systems/EconomySystem'
import {
  allMercenaryTypes,
  canHire,
  getUnitDisplayName,
  hireCostFor,
  hireMercenary,
  ownedCountOfType
} from '../systems/MercenarySystem'
import { EQUIPMENT_ITEMS } from '../../shared/content/equipment'
import { purchaseAndEquip } from '../systems/EquipmentSystem'
import { PROTAGONIST_TYPE_ID } from '../../shared/content/mercenaryTypes'
import type { Quest } from '../../shared/types'
import { acceptQuest, canTurnIn, describeQuest, generateQuestOffers, turnInQuest, type QuestOffer } from '../systems/QuestSystem'

type TabId = 'trade' | 'hire' | 'shop' | 'quest'

export class TownScreen implements Screen {
  id = 'town'
  private container: HTMLElement | null = null
  private unsubs: (() => void)[] = []
  private activeTab: TabId = 'trade'
  private questOffers: QuestOffer[] = []
  private questOffersTownId = ''

  mount(container: HTMLElement): void {
    this.container = container
    this.activeTab = 'trade'
    this.render()
    this.unsubs.push(eventBus.on('state:gold-changed', () => this.render()))
    this.unsubs.push(eventBus.on('state:inventory-changed', () => this.render()))
    this.unsubs.push(eventBus.on('state:roster-changed', () => this.render()))
    this.unsubs.push(eventBus.on('state:quests-changed', () => this.render()))
    this.unsubs.push(eventBus.on('state:prices-changed', () => this.render()))
  }

  unmount(): void {
    this.unsubs.forEach((fn) => fn())
    this.unsubs = []
  }

  private ensureQuestOffers(townId: string): void {
    if (this.questOffersTownId !== townId) {
      this.questOffers = generateQuestOffers(townId)
      this.questOffersTownId = townId
    }
  }

  private render(): void {
    if (!this.container) return
    const state = gameStateStore.getState()
    const town = getTown(state.currentTownId)
    this.ensureQuestOffers(town.id)

    this.container.innerHTML = ''

    const topbar = document.createElement('div')
    topbar.className = 'topbar'
    topbar.innerHTML = `<div><strong>${town.name}</strong></div>`
    const goldEl = document.createElement('div')
    goldEl.className = 'gold-display'
    goldEl.textContent = `💰 ${state.gold} 냥`
    const nav = document.createElement('div')
    nav.className = 'nav'

    const invBtn = document.createElement('button')
    invBtn.textContent = '용병단/화물'
    invBtn.onclick = () => screenManager.show('inventory')
    const leaveBtn = document.createElement('button')
    leaveBtn.textContent = '마을 떠나기'
    leaveBtn.onclick = () => screenManager.show('world-map')

    nav.appendChild(invBtn)
    nav.appendChild(leaveBtn)
    topbar.appendChild(nav)
    topbar.appendChild(goldEl)
    this.container.appendChild(topbar)

    const tabs = document.createElement('div')
    tabs.className = 'tabs'
    tabs.style.margin = '16px 20px 0 20px'
    const tabDefs: { id: TabId; label: string }[] = [
      { id: 'trade', label: '교역' },
      { id: 'hire', label: '용병 고용' },
      { id: 'shop', label: '장비점' },
      { id: 'quest', label: '의뢰' }
    ]
    for (const def of tabDefs) {
      const btn = document.createElement('button')
      btn.textContent = def.label
      if (def.id === this.activeTab) btn.classList.add('active')
      btn.onclick = () => {
        this.activeTab = def.id
        this.render()
      }
      tabs.appendChild(btn)
    }
    this.container.appendChild(tabs)

    const content = document.createElement('div')
    content.className = 'content'
    if (this.activeTab === 'trade') this.renderTrade(content, town.id)
    else if (this.activeTab === 'hire') this.renderHire(content)
    else if (this.activeTab === 'shop') this.renderShop(content, town.id)
    else this.renderQuest(content, town.id)
    this.container.appendChild(content)
  }

  private renderTrade(content: HTMLElement, townId: string): void {
    const prices = gameStateStore.getTownPrices(townId)
    const inventory = gameStateStore.getState().inventory

    const panel = document.createElement('div')
    panel.className = 'panel'
    const table = document.createElement('table')
    table.innerHTML = '<thead><tr><th>품목</th><th>매입가</th><th>판매가</th><th>보유</th><th>거래</th></tr></thead>'
    const tbody = document.createElement('tbody')

    for (const [goodId, entry] of Object.entries(prices)) {
      const good = getGood(goodId)
      const tr = document.createElement('tr')
      const qtyInput = document.createElement('input')
      qtyInput.type = 'number'
      qtyInput.className = 'qty-input'
      qtyInput.min = '1'
      qtyInput.value = '1'

      const buyBtn = document.createElement('button')
      buyBtn.textContent = '구매'
      buyBtn.onclick = async () => {
        const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1)
        const result = await buyGood(goodId, qty)
        if (!result.ok) showToast(result.reason ?? '구매 실패', 'error')
        else showToast(`${good.name} ${qty}개 구매 (-${result.totalGold} 냥)`)
      }
      const sellBtn = document.createElement('button')
      sellBtn.textContent = '판매'
      sellBtn.onclick = async () => {
        const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1)
        const result = await sellGood(goodId, qty)
        if (!result.ok) showToast(result.reason ?? '판매 실패', 'error')
        else showToast(`${good.name} ${qty}개 판매 (+${result.totalGold} 냥)`)
      }

      const actions = document.createElement('div')
      actions.className = 'row-actions'
      actions.appendChild(qtyInput)
      actions.appendChild(buyBtn)
      actions.appendChild(sellBtn)

      const tdActions = document.createElement('td')
      tdActions.appendChild(actions)

      tr.innerHTML = `<td>${good.icon} ${good.name}</td><td>${entry.buy}</td><td>${entry.sell}</td><td>${inventory[goodId] ?? 0}</td>`
      tr.appendChild(tdActions)
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    panel.appendChild(table)
    content.appendChild(panel)
  }

  private renderHire(content: HTMLElement): void {
    const panel = document.createElement('div')
    panel.className = 'panel'
    const title = document.createElement('h2')
    title.textContent = '용병 고용'
    panel.appendChild(title)

    const grid = document.createElement('div')
    grid.className = 'card-grid'
    for (const type of allMercenaryTypes()) {
      const cost = hireCostFor(type.id)
      const check = canHire(type.id)
      const card = document.createElement('div')
      card.className = 'card'
      card.innerHTML = `
        <div class="icon">${type.icon}</div>
        <div><strong>${type.name}</strong> (${type.role})</div>
        <div class="stat-line"><span>보유</span><span>${ownedCountOfType(type.id)}명</span></div>
        <div class="stat-line"><span>HP</span><span>${type.baseStats.hp}</span></div>
        <div class="stat-line"><span>공격</span><span>${type.baseStats.attack}</span></div>
        <div class="stat-line"><span>방어</span><span>${type.baseStats.defense}</span></div>
        <div class="stat-line"><span>고용비</span><span>${cost} 냥</span></div>
      `
      const hireBtn = document.createElement('button')
      hireBtn.className = 'primary'
      hireBtn.textContent = '고용'
      hireBtn.disabled = !check.ok
      hireBtn.title = check.reason ?? ''
      hireBtn.style.marginTop = '8px'
      hireBtn.style.width = '100%'
      hireBtn.onclick = async () => {
        const result = await hireMercenary(type.id)
        if (!result.ok) showToast(result.reason ?? '고용 실패', 'error')
        else showToast(`${type.name}을(를) 고용했습니다.`)
      }
      card.appendChild(hireBtn)
      grid.appendChild(card)
    }
    panel.appendChild(grid)
    content.appendChild(panel)
  }

  private renderShop(content: HTMLElement, townId: string): void {
    const town = getTown(townId)
    const roster = gameStateStore.getState().roster

    const panel = document.createElement('div')
    panel.className = 'panel'
    const title = document.createElement('h2')
    title.textContent = '장비점'
    panel.appendChild(title)

    const selectRow = document.createElement('div')
    selectRow.style.marginBottom = '12px'
    const label = document.createElement('label')
    label.textContent = '장비 대상: '
    const select = document.createElement('select')
    select.className = 'qty-input'
    select.style.width = 'auto'
    for (const unit of roster) {
      const opt = document.createElement('option')
      opt.value = unit.instanceId
      opt.textContent = unit.typeId === PROTAGONIST_TYPE_ID ? '주인공' : getUnitDisplayName(unit)
      select.appendChild(opt)
    }
    label.appendChild(select)
    selectRow.appendChild(label)
    panel.appendChild(selectRow)

    const grid = document.createElement('div')
    grid.className = 'card-grid'
    const available = EQUIPMENT_ITEMS.filter((item) => item.tier <= town.availableEquipmentTierMax)
    for (const item of available) {
      const card = document.createElement('div')
      card.className = 'card'
      const bonusText = Object.entries(item.bonus)
        .map(([k, v]) => `${k} +${v}`)
        .join(', ')
      card.innerHTML = `
        <div><strong>${item.name}</strong> (${item.slot === 'weapon' ? '무기' : '방어구'} T${item.tier})</div>
        <div class="stat-line"><span>보너스</span><span>${bonusText}</span></div>
        <div class="stat-line"><span>가격</span><span>${item.cost} 냥</span></div>
      `
      const buyBtn = document.createElement('button')
      buyBtn.className = 'primary'
      buyBtn.textContent = '구매 및 장착'
      buyBtn.style.marginTop = '8px'
      buyBtn.style.width = '100%'
      buyBtn.onclick = async () => {
        const result = await purchaseAndEquip(select.value, item.id)
        if (!result.ok) showToast(result.reason ?? '구매 실패', 'error')
        else showToast(`${item.name}을(를) 장착했습니다.`)
      }
      card.appendChild(buyBtn)
      grid.appendChild(card)
    }
    panel.appendChild(grid)
    content.appendChild(panel)
  }

  private renderQuest(content: HTMLElement, townId: string): void {
    const state = gameStateStore.getState()

    const offersPanel = document.createElement('div')
    offersPanel.className = 'panel'
    const offersTitle = document.createElement('h2')
    offersTitle.textContent = '새로운 의뢰'
    offersPanel.appendChild(offersTitle)

    for (const offer of this.questOffers) {
      const alreadyActive = state.activeQuests.some(
        (q) => q.status === 'active' && q.type === offer.type && q.townOfferedId === offer.townOfferedId && describeQuest(q) === describeQuest(offer)
      )
      const row = document.createElement('div')
      row.className = 'card'
      row.style.marginBottom = '8px'
      row.innerHTML = `<div>${describeQuest(offer)}</div><div class="stat-line"><span>보상</span><span>${offer.rewardGold} 냥${offer.rewardXp ? ` / ${offer.rewardXp} XP` : ''}</span></div>`
      const acceptBtn = document.createElement('button')
      acceptBtn.className = 'primary'
      acceptBtn.textContent = alreadyActive ? '수락됨' : '수락'
      acceptBtn.disabled = alreadyActive
      acceptBtn.style.marginTop = '6px'
      acceptBtn.onclick = async () => {
        const result = await acceptQuest(offer)
        if (!result.ok) showToast(result.reason ?? '수락 실패', 'error')
        else showToast('의뢰를 수락했습니다.')
      }
      row.appendChild(acceptBtn)
      offersPanel.appendChild(row)
    }
    content.appendChild(offersPanel)

    const activePanel = document.createElement('div')
    activePanel.className = 'panel'
    const activeTitle = document.createElement('h2')
    activeTitle.textContent = '진행 중인 의뢰'
    activePanel.appendChild(activeTitle)

    const relevant = state.activeQuests.filter((q: Quest) => q.status === 'active')
    if (relevant.length === 0) {
      const empty = document.createElement('div')
      empty.style.color = 'var(--text-dim)'
      empty.textContent = '진행 중인 의뢰가 없습니다.'
      activePanel.appendChild(empty)
    }
    for (const quest of relevant) {
      const row = document.createElement('div')
      row.className = 'card'
      row.style.marginBottom = '8px'
      const progress = quest.type === 'bounty' ? ` (${quest.currentKills ?? 0}/${quest.requiredKills ?? 0})` : ''
      row.innerHTML = `<div>${describeQuest(quest)}${progress}</div><div class="stat-line"><span>보상</span><span>${quest.rewardGold} 냥</span></div>`
      const turnable = canTurnIn(quest, townId)
      const turnInBtn = document.createElement('button')
      turnInBtn.className = 'primary'
      turnInBtn.textContent = '완료 보고'
      turnInBtn.disabled = !turnable
      turnInBtn.style.marginTop = '6px'
      turnInBtn.onclick = async () => {
        const result = await turnInQuest(quest.instanceId)
        if (!result.ok) showToast(result.reason ?? '완료 실패', 'error')
        else showToast('의뢰를 완료했습니다.')
      }
      row.appendChild(turnInBtn)
      activePanel.appendChild(row)
    }
    content.appendChild(activePanel)
  }
}
