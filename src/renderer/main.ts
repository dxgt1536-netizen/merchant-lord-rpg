import './styles/main.css'
import { screenManager } from './core/ScreenManager'
import { MainMenuScreen } from './screens/MainMenuScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { TownScreen } from './screens/TownScreen'
import { InventoryScreen } from './screens/InventoryScreen'
import { ResultScreen } from './screens/ResultScreen'
import { BattleContainerScreen } from './screens/BattleContainerScreen'

screenManager.register(new MainMenuScreen())
screenManager.register(new WorldMapScreen())
screenManager.register(new TownScreen())
screenManager.register(new InventoryScreen())
screenManager.register(new ResultScreen())
screenManager.register(new BattleContainerScreen())

screenManager.show('main-menu')
