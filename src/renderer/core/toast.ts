export function showToast(message: string, kind: 'info' | 'error' = 'info'): void {
  const el = document.createElement('div')
  el.className = `toast${kind === 'error' ? ' error' : ''}`
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2200)
}
