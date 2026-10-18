import Phaser from 'phaser'
import type { BattleResult, BattleSetup } from '../../shared/types'
import { BATTLE_HEIGHT, BATTLE_WIDTH } from './BattleConfig'
import { BattleScene } from './scenes/BattleScene'

export function startBattle(setup: BattleSetup): Promise<BattleResult> {
  return new Promise((resolve) => {
    const root = document.getElementById('battle-root')
    if (!root) throw new Error('Missing #battle-root element')
    root.innerHTML = ''

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: root,
      width: BATTLE_WIDTH,
      height: BATTLE_HEIGHT,
      backgroundColor: '#12200f',
      disableContextMenu: true,
      scene: []
    })

    game.events.once(Phaser.Core.Events.READY, () => {
      game.scene.add('BattleScene', BattleScene, true, {
        setup,
        onFinish: (result: BattleResult) => {
          resolve(result)
          window.setTimeout(() => {
            game.destroy(true)
            root.innerHTML = ''
          }, 50)
        }
      })
    })
  })
}
