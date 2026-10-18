import type { Screen } from '../core/ScreenManager'
import { screenManager } from '../core/ScreenManager'
import { gameStateStore } from '../core/GameStateStore'
import { presenceStore } from '../core/PresenceStore'
import { showToast } from '../core/toast'
import { connectSocket, login } from '../net/SocketClient'

export class MainMenuScreen implements Screen {
  id = 'main-menu'

  mount(container: HTMLElement): void {
    container.innerHTML = ''
    const wrap = document.createElement('div')
    wrap.className = 'centered'

    const title = document.createElement('div')
    title.className = 'title-main'
    title.textContent = '상단(商團)'
    wrap.appendChild(title)

    const subtitle = document.createElement('div')
    subtitle.style.color = 'var(--text-dim)'
    subtitle.textContent = '상인의 길 - 교역과 정벌의 이야기'
    wrap.appendChild(subtitle)

    const form = document.createElement('div')
    form.style.marginTop = '24px'
    form.style.display = 'flex'
    form.style.gap = '12px'

    const nicknameInput = document.createElement('input')
    nicknameInput.type = 'text'
    nicknameInput.placeholder = '닉네임을 입력하세요'
    nicknameInput.className = 'qty-input'
    nicknameInput.style.width = '200px'
    nicknameInput.maxLength = 20

    const connectBtn = document.createElement('button')
    connectBtn.className = 'primary'
    connectBtn.textContent = '접속'

    const status = document.createElement('div')
    status.style.marginTop = '10px'
    status.style.color = 'var(--text-dim)'
    status.style.fontSize = '13px'

    const doLogin = async () => {
      const nickname = nicknameInput.value.trim()
      if (!nickname) {
        showToast('닉네임을 입력하세요.', 'error')
        return
      }
      connectBtn.disabled = true
      status.textContent = '서버에 접속하는 중...'
      try {
        await connectSocket()
        const res = await login(nickname)
        if (!res.ok) {
          showToast(res.reason ?? '접속에 실패했습니다.', 'error')
          connectBtn.disabled = false
          status.textContent = ''
          return
        }
        gameStateStore.applyLogin(res.playerId, nickname, res.player, res.townPrices)
        presenceStore.setInitial(res.onlinePlayers)
        screenManager.show('world-map')
      } catch {
        showToast('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.', 'error')
        connectBtn.disabled = false
        status.textContent = ''
      }
    }

    connectBtn.onclick = doLogin
    nicknameInput.onkeydown = (e) => {
      if (e.key === 'Enter') doLogin()
    }

    form.appendChild(nicknameInput)
    form.appendChild(connectBtn)
    wrap.appendChild(form)
    wrap.appendChild(status)

    container.appendChild(wrap)
    nicknameInput.focus()
  }

  unmount(): void {}
}
