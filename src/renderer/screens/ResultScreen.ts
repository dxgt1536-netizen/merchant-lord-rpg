import type { Screen } from '../core/ScreenManager'
import { screenManager } from '../core/ScreenManager'
import { getGood } from '../../shared/content/goods'

export interface ResultPayload {
  victory: boolean
  goldLoot?: number
  goodsLoot?: Record<string, number>
  goldLost?: number
  goodsLost?: Record<string, number>
  xpSummary: { name: string; xpGained: number; leveledUp: boolean }[]
}

export class ResultScreen implements Screen<ResultPayload> {
  id = 'result'

  mount(container: HTMLElement, payload: ResultPayload): void {
    container.innerHTML = ''
    const wrap = document.createElement('div')
    wrap.className = 'centered'

    const title = document.createElement('h1')
    title.textContent = payload.victory ? '전투 승리!' : '패퇴...'
    title.style.color = payload.victory ? 'var(--success)' : 'var(--danger)'
    wrap.appendChild(title)

    const panel = document.createElement('div')
    panel.className = 'panel'
    panel.style.minWidth = '360px'

    if (payload.victory) {
      const gold = document.createElement('div')
      gold.textContent = `획득 골드: ${payload.goldLoot ?? 0} 냥`
      panel.appendChild(gold)

      const goods = Object.entries(payload.goodsLoot ?? {}).filter(([, qty]) => qty > 0)
      if (goods.length > 0) {
        const goodsEl = document.createElement('div')
        goodsEl.textContent = `노획물: ${goods.map(([id, qty]) => `${getGood(id).name} x${qty}`).join(', ')}`
        panel.appendChild(goodsEl)
      }
    } else {
      const gold = document.createElement('div')
      gold.textContent = `손실 골드: ${payload.goldLost ?? 0} 냥`
      panel.appendChild(gold)

      const goods = Object.entries(payload.goodsLost ?? {}).filter(([, qty]) => qty > 0)
      if (goods.length > 0) {
        const goodsEl = document.createElement('div')
        goodsEl.textContent = `분실 화물: ${goods.map(([id, qty]) => `${getGood(id).name} x${qty}`).join(', ')}`
        panel.appendChild(goodsEl)
      }
      const note = document.createElement('div')
      note.style.color = 'var(--text-dim)'
      note.style.marginTop = '6px'
      note.textContent = '용병들은 무사히 퇴각했습니다.'
      panel.appendChild(note)
    }

    if (payload.xpSummary.length > 0) {
      const xpTitle = document.createElement('h3')
      xpTitle.textContent = '경험치'
      xpTitle.style.marginTop = '12px'
      panel.appendChild(xpTitle)
      for (const entry of payload.xpSummary) {
        const line = document.createElement('div')
        line.className = 'stat-line'
        line.innerHTML = `<span>${entry.name}</span><span>+${entry.xpGained} XP${entry.leveledUp ? ' (레벨 업!)' : ''}</span>`
        panel.appendChild(line)
      }
    }

    wrap.appendChild(panel)

    const continueBtn = document.createElement('button')
    continueBtn.className = 'primary'
    continueBtn.textContent = '계속'
    continueBtn.onclick = () => screenManager.show('world-map')
    wrap.appendChild(continueBtn)

    container.appendChild(wrap)
  }

  unmount(): void {}
}
