export interface Screen<TPayload = void> {
  id: string
  mount(container: HTMLElement, payload: TPayload): void
  unmount(): void
}

class ScreenManager {
  private screens = new Map<string, Screen<any>>()
  private currentScreenId: string | null = null

  register(screen: Screen<any>): void {
    this.screens.set(screen.id, screen)
  }

  private containerFor(id: string): HTMLElement {
    const el = document.getElementById(`screen-${id}`)
    if (!el) throw new Error(`Missing DOM container #screen-${id} for screen "${id}"`)
    return el
  }

  show<TPayload>(id: string, payload?: TPayload): void {
    const screen = this.screens.get(id)
    if (!screen) throw new Error(`Screen not registered: ${id}`)

    if (this.currentScreenId) {
      const prev = this.screens.get(this.currentScreenId)
      prev?.unmount()
      this.containerFor(this.currentScreenId).style.display = 'none'
    }

    this.currentScreenId = id
    const container = this.containerFor(id)
    container.style.display = 'flex'
    screen.mount(container, payload as TPayload)
  }
}

export const screenManager = new ScreenManager()
