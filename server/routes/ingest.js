/**
 * POST /ingest – receives raw tracking events from Raspberry Pi
 * 
 * Purpose:
 *   - Accepts raw event data: { hostname, ip, timestamp }
 *   - Validates the payload
 *   - Enriches the event with metadata and AI insights
 *   - Broadcasts enriched event to all connected WebSocket clients
 *   - Returns { status: "ok" }
 * 
 * Integration point:
 *   Raspberry Pi sends here: POST http://<SERVER_IP>:3001/ingest
 *   Body: { "hostname": "example.com", "ip": "1.2.3.4", "timestamp": 1714070000 }
 */

import { Router } from 'express'
import { enrichEvent } from '../ai/enrich.js'
import { broadcast } from '../ws/manager.js'

const router = Router()

router.post('/ingest', async (req, res) => {
  try {
    const { hostname, ip, timestamp } = req.body

    // Validate required fields
    if (!hostname || !ip || !timestamp) {
      console.warn('[ingest] Validation failed: missing required fields', req.body)
      return res.status(400).json({
        error: 'Missing required fields: hostname, ip, timestamp',
      })
    }

    console.log('[ingest] Raw event received:', { hostname, ip, timestamp })

    // Enrich the event with metadata, location, AI insights, risk score
    const enrichedEvent = await enrichEvent({ hostname, ip, timestamp })

    // Broadcast the enriched event to all connected React Native clients
    broadcast(enrichedEvent)

    // Respond to Raspberry Pi with success
    res.status(200).json({ status: 'ok', event: enrichedEvent })
  } catch (err) {
    console.error('[ingest] Error processing event:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
