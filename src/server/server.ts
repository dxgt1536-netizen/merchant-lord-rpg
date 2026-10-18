import { createServer } from 'http'
import { Server } from 'socket.io'
import { SERVER_PORT } from '../shared/config'
import { ensureTownPricesSeeded, setDataDir } from './db'
import { registerConnectionHandlers } from './handlers'
import type { TypedServer } from './types'

export function startServer(dataDir?: string): void {
  if (dataDir) setDataDir(dataDir)
  ensureTownPricesSeeded()

  const httpServer = createServer()
  const io: TypedServer = new Server(httpServer, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    console.log(`[server] socket connected: ${socket.id}`)
    registerConnectionHandlers(socket)
  })

  httpServer.listen(SERVER_PORT, () => {
    console.log(`[server] listening on http://localhost:${SERVER_PORT}`)
  })
}
