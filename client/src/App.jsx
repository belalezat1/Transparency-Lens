import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import MapComponent from './components/MapComponent'
import EducationalFeed from './components/EducationalFeed'
import CategoryPieChart from './components/CategoryPieChart'
import PrivacyScorecard from './components/PrivacyScorecard'
import DataValueEstimator from './components/DataValueEstimator'
import ShadowProfileSummary from './components/ShadowProfileSummary'
import GlobalAnalytics from './components/GlobalAnalytics'
import HowItWorks from './components/HowItWorks'

const SCORE_PENALTIES = { Advertising: 3, Fingerprinting: 5, Analytics: 1, Social: 2 }
const VALUE_MULTIPLIERS = { Advertising: 3, Fingerprinting: 5, Analytics: 1, Social: 2 }
const BASE_VALUE = 0.001

function calcScore(list) {
  return Math.max(0, list.reduce((s, t) => s - (SCORE_PENALTIES[t.category] || 1), 100))
}

function calcValue(list) {
  return list.reduce((s, t) => s + BASE_VALUE * (VALUE_MULTIPLIERS[t.category] || 1), 0)
}

export default function App() {
  const [trackers, setTrackers] = useState([])
  const [stats, setStats] = useState({ categoryCounts: {}, total: 0 })
  const [privacyScore, setPrivacyScore] = useState(100)
  const [sessionValue, setSessionValue] = useState(0)
  const [shadowProfile, setShadowProfile] = useState(
    'Observing session... Shadow profile will generate after 5 minutes of activity.'
  )
  const trackersRef = useRef([])
  trackersRef.current = trackers

  useEffect(() => {
    fetch('/api/trackers')
      .then((r) => r.json())
      .then((data) => {
        setTrackers(data)
        setPrivacyScore(calcScore(data))
        setSessionValue(calcValue(data))
      })
      .catch(() => {})

    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})

    const socket = io('http://localhost:3001', { transports: ['websocket'] })

    socket.on('new_tracker', (event) => {
      setTrackers((prev) => {
        const updated = [event, ...prev].slice(0, 100)
        setPrivacyScore(calcScore(updated))
        setSessionValue(calcValue(updated))
        return updated
      })
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        categoryCounts: {
          ...prev.categoryCounts,
          [event.category]: (prev.categoryCounts[event.category] || 0) + 1,
        },
      }))
    })

    return () => socket.disconnect()
  }, [])

  useEffect(() => {
    const timer = setInterval(async () => {
      const current = trackersRef.current
      if (!current.length) return
      try {
        const res = await fetch('/api/shadow-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackers: current }),
        })
        const data = await res.json()
        if (data.profile) setShadowProfile(data.profile)
      } catch (_) {}
    }, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  function simulateTracker() {
    fetch('/demo', { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-slate-950 text-xs font-black">TL</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 leading-none tracking-tight">
              Transparency Lens
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Real-Time Privacy Intelligence · KeanUHackThis 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
            <span className="relative w-2 h-2">
              <span className="live-dot absolute inset-0 rounded-full bg-cyan-400" />
              <span className="relative w-2 h-2 rounded-full bg-cyan-400 block" />
            </span>
            Live
          </span>
          <span className="text-xs text-slate-500 tabular-nums">
            {stats.total} trackers intercepted
          </span>
        </div>
      </header>

      {/* Main 3-column grid */}
      <main className="flex-1 grid grid-cols-[300px_1fr_300px] gap-3 p-3 overflow-hidden">
        <aside className="flex flex-col gap-3 overflow-hidden min-h-0">
          <EducationalFeed trackers={trackers} />
        </aside>

        <section className="flex flex-col gap-3 overflow-hidden min-h-0">
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 shadow-sm min-h-0">
            <MapComponent trackers={trackers} />
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <PrivacyScorecard score={privacyScore} />
            <DataValueEstimator sessionValue={sessionValue} />
          </div>
        </section>

        <aside className="flex flex-col gap-3 overflow-hidden min-h-0">
          <CategoryPieChart stats={stats} />
          <ShadowProfileSummary profile={shadowProfile} />
          <GlobalAnalytics />
        </aside>
      </main>

      <HowItWorks />

      <button
        onClick={simulateTracker}
        className="fixed bottom-6 right-6 bg-cyan-500 text-slate-950 px-5 py-2.5 rounded-full shadow-lg shadow-cyan-500/25 text-sm font-semibold hover:bg-cyan-400 active:scale-95 transition-all"
      >
        Simulate Tracker
      </button>
    </div>
  )
}
