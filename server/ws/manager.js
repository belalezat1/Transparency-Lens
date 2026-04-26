/**
 * WebSocket Manager – handles real-time event broadcasting to connected React Native clients
 * 
 * Purpose:
 *   - Maintains a list of connected WebSocket clients
 *   - Broadcasts enriched events to all connected clients
 *   - Handles client connect/disconnect lifecycle
 * 
 * Integration point:
 *   React Native app connects here: ws://<SERVER_IP>:3001
 */

let connectedClients = []

export function setupWebSocketServer(io) {
  io.on('connection', (socket) => {
    console.log(`[ws] Client connected: ${socket.id}`)
    connectedClients.push(socket)

    socket.on('disconnect', () => {
      console.log(`[ws] Client disconnected: ${socket.id}`)
      connectedClients = connectedClients.filter((c) => c.id !== socket.id)
    })

    socket.on('error', (err) => {
      console.error(`[ws] Socket error for ${socket.id}:`, err)
    })
  })
}

/**
 * Broadcast an enriched event to all connected React Native clients
 * @param {Object} enrichedEvent – the enriched event object
 */
export function broadcast(enrichedEvent) {
  if (connectedClients.length === 0) {
    console.log('[ws] No connected clients – event discarded')
    return
  }
  console.log(`[ws] Broadcasting to ${connectedClients.length} client(s):`, enrichedEvent)
  io.emit('enriched_event', enrichedEvent)
}

/**
 * Expose the io instance for external use (set by server.js)
 */
let io = null
export function setIO(ioInstance) {
  io = ioInstance
}
