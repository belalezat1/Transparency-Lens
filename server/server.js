import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import mongoose from 'mongoose'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createRequire } from 'module'
import { setupWebSocketServer, setIO } from './ws/manager.js'
import ingestRouter from './routes/ingest.js'

const require = createRequire(import.meta.url)
const snowflake = require('snowflake-sdk')

// ─── App setup ────────────────────────────────────────────────────────────────
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
})

// ─── WebSocket setup for React Native clients ────────────────────────────────
// React Native app connects to: ws://<SERVER_IP>:3001
setupWebSocketServer(io)
setIO(io)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use(ingestRouter)

// ─── Gemma 4 via Gemini API ───────────────────────────────────────────────────
// Model: set GEMMA_MODEL env var to the current Gemma 4 ID (e.g. gemma-3-4b-it or gemma-4-4b-it)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemma-3-4b-it'

async function gemmaGenerate(prompt) {
  const model = genAI.getGenerativeModel({ model: GEMMA_MODEL })
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

// ─── Snowflake ────────────────────────────────────────────────────────────────
let sfConn = null

function initSnowflake() {
  if (!process.env.SNOWFLAKE_ACCOUNT) {
    console.warn('[snowflake] SNOWFLAKE_ACCOUNT not set — Snowflake features disabled')
    return
  }
  sfConn = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USER,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  })
  sfConn.connect((err) => {
    if (err) console.error('[snowflake] Connection failed:', err.message)
    else console.log('[snowflake] Connected')
  })
}

function sfQuery(sql, binds = []) {
  return new Promise((resolve, reject) => {
    if (!sfConn) return reject(new Error('Snowflake not connected'))
    sfConn.execute({
      sqlText: sql,
      binds,
      complete: (err, _stmt, rows) => (err ? reject(err) : resolve(rows)),
    })
  })
}

function sfInsertAsync(event) {
  if (!sfConn) return
  setImmediate(async () => {
    try {
      await sfQuery(
        `INSERT INTO TRACKER_EVENTS (ID, HOSTNAME, IP, CITY, LAT, LNG, CATEGORY, EDUCATIONAL_SUMMARY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(event._id),
          event.hostname,
          event.ip,
          event.location.city,
          event.location.lat,
          event.location.lng,
          event.category,
          event.educational_summary,
        ]
      )
    } catch (err) {
      console.error('[snowflake] Insert failed:', err.message)
    }
  })
}

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const trackerSchema = new mongoose.Schema({
  hostname: { type: String, required: true },
  ip: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    city: { type: String, default: 'Unknown' },
  },
  educational_summary: { type: String, required: true },
  category: {
    type: String,
    enum: ['Advertising', 'Analytics', 'Fingerprinting', 'Social'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
})

const TrackerEvent = mongoose.model('TrackerEvent', trackerSchema)

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_TRACKERS = [
  { hostname: 'doubleclick.net', ip: '172.217.4.78', location: { lat: 37.422, lng: -122.084, city: 'Mountain View' }, category: 'Advertising' },
  { hostname: 'scorecardresearch.com', ip: '104.16.88.200', location: { lat: 40.7128, lng: -74.006, city: 'New York' }, category: 'Analytics' },
  { hostname: 'fingerprintjs.com', ip: '104.21.234.50', location: { lat: 51.5074, lng: -0.1278, city: 'London' }, category: 'Fingerprinting' },
  { hostname: 'connect.facebook.net', ip: '157.240.22.35', location: { lat: 37.4845, lng: -122.1477, city: 'Menlo Park' }, category: 'Social' },
  { hostname: 'google-analytics.com', ip: '142.250.80.110', location: { lat: 37.422, lng: -122.084, city: 'Mountain View' }, category: 'Analytics' },
  { hostname: 'ads.twitter.com', ip: '104.244.42.65', location: { lat: 37.7749, lng: -122.4194, city: 'San Francisco' }, category: 'Advertising' },
  { hostname: 'rubiconproject.com', ip: '209.197.3.15', location: { lat: 34.0522, lng: -118.2437, city: 'Los Angeles' }, category: 'Advertising' },
  { hostname: 'hotjar.com', ip: '104.22.48.200', location: { lat: 35.8997, lng: 14.5147, city: 'Malta' }, category: 'Analytics' },
  { hostname: 'iovation.com', ip: '54.213.0.1', location: { lat: 45.5231, lng: -122.6765, city: 'Portland' }, category: 'Fingerprinting' },
  { hostname: 'platform.linkedin.com', ip: '13.107.42.14', location: { lat: 37.3688, lng: -122.0363, city: 'Sunnyvale' }, category: 'Social' },
]

// ─── Routes ───────────────────────────────────────────────────────────────────
app.post('/ingest', async (req, res) => {
  const { hostname, ip, location, educational_summary, category } = req.body
  if (!hostname || !ip || !location?.lat || !location?.lng || !educational_summary || !category) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  try {
    const event = new TrackerEvent({ hostname, ip, location, educational_summary, category })
    await event.save()
    io.emit('new_tracker', event.toObject())
    sfInsertAsync(event.toObject())
    res.status(201).json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/trackers', async (_req, res) => {
  try {
    const trackers = await TrackerEvent.find().sort({ timestamp: -1 }).limit(100)
    res.json(trackers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/stats', async (_req, res) => {
  try {
    const counts = await TrackerEvent.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ])
    const total = await TrackerEvent.countDocuments()
    const categoryCounts = {}
    counts.forEach((c) => { categoryCounts[c._id] = c.count })
    res.json({ categoryCounts, total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Gemma 4: generate educational summary for a hostname
app.get('/api/educational-summary', async (req, res) => {
  const { hostname } = req.query
  if (!hostname) return res.status(400).json({ error: 'hostname required' })
  try {
    const prompt =
      `Act as a privacy educator. In one professional sentence, explain what a data tracker ` +
      `at ${hostname} is and how its data collection contributes to a user's digital profile. ` +
      `Be objective and factual.`
    const summary = await gemmaGenerate(prompt)
    res.json({ summary })
  } catch (err) {
    res.status(500).json({ error: err.message, summary: `${hostname} collects user behavioral data to build advertising profiles.` })
  }
})

// Gemma 4: generate shadow profile from recent trackers
app.post('/api/shadow-profile', async (req, res) => {
  const { trackers } = req.body
  if (!trackers?.length) return res.json({ profile: 'No tracker data yet to build a profile.' })
  try {
    const summary = trackers
      .slice(0, 20)
      .map((t) => `${t.hostname} (${t.category})`)
      .join(', ')
    const prompt =
      `You are a digital literacy instructor. Based on these intercepted network trackers: ${summary}. ` +
      `In 2 factual sentences, describe what a data broker could infer about this user's interests and demographics. ` +
      `Be educational and objective. Start with "Based on intercepted traffic,"`
    const profile = await gemmaGenerate(prompt)
    res.json({ profile })
  } catch (err) {
    const cats = [...new Set(trackers.map((t) => t.category))].join(', ')
    res.json({ profile: `Based on intercepted traffic, this session shows exposure to ${cats} trackers across ${trackers.length} domains, indicating active browsing of ad-supported and analytics-heavy websites.` })
  }
})

// Snowflake: global cross-session analytics
app.get('/api/global-analytics', async (_req, res) => {
  try {
    const rows = await sfQuery(`
      SELECT CATEGORY, COUNT(*) AS TOTAL, COUNT(DISTINCT HOSTNAME) AS UNIQUE_HOSTS
      FROM TRACKER_EVENTS
      GROUP BY CATEGORY
      ORDER BY TOTAL DESC
    `)
    res.json({ rows: rows || [] })
  } catch (err) {
    res.json({ rows: [], error: 'Snowflake unavailable' })
  }
})

// Snowflake Cortex: AI-powered global insight
app.get('/api/cortex-insight', async (_req, res) => {
  try {
    const statsRows = await sfQuery(`
      SELECT CATEGORY, COUNT(*) AS CNT FROM TRACKER_EVENTS GROUP BY CATEGORY
    `)
    if (!statsRows?.length) return res.json({ insight: 'No data yet for Cortex analysis.' })
    const summary = statsRows.map((r) => `${r.CATEGORY}: ${r.CNT}`).join(', ').replace(/'/g, "''")
    const rows = await sfQuery(`
      SELECT SNOWFLAKE.CORTEX.COMPLETE(
        'mistral-7b',
        'Based on this tracker category data: ${summary}. In one educational sentence, what does this reveal about modern digital surveillance and user privacy?'
      ) AS INSIGHT
    `)
    res.json({ insight: rows?.[0]?.INSIGHT || 'Cortex analysis unavailable.' })
  } catch (err) {
    res.json({ insight: 'Modern websites deploy an average of 10+ trackers per page, creating detailed behavioral profiles without explicit user awareness.' })
  }
})

// Demo endpoint: simulate a tracker event using Gemma 4 for the summary
app.post('/demo', async (_req, res) => {
  const base = DEMO_TRACKERS[Math.floor(Math.random() * DEMO_TRACKERS.length)]
  let educational_summary = `${base.hostname} collects user behavioral and technical metadata to support targeted advertising and analytics pipelines.`
  try {
    const prompt =
      `Act as a privacy educator. In one professional sentence, explain what a data tracker ` +
      `at ${base.hostname} is and how its data collection contributes to a user's digital profile. ` +
      `Be objective and factual.`
    educational_summary = await gemmaGenerate(prompt)
  } catch (_) { /* use fallback */ }
  try {
    const event = new TrackerEvent({ ...base, educational_summary })
    await event.save()
    io.emit('new_tracker', event.toObject())
    sfInsertAsync(event.toObject())
    res.status(201).json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Start ─────────────────────────────────────────────────────────────────────
initSnowflake()

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[mongodb] Connected')
    const PORT = process.env.PORT || 3001
    httpServer.listen(PORT, () => console.log(`[server] Running on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('[mongodb] Connection failed:', err.message)
    process.exit(1)
  })
