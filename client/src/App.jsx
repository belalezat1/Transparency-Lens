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
import Logo from './components/Logo'

const SCORE_PENALTIES   = { Advertising: 3, Fingerprinting: 5, Analytics: 1, Social: 2 }
const VALUE_MULTIPLIERS = { Advertising: 3, Fingerprinting: 5, Analytics: 1, Social: 2 }
const BASE_VALUE = 0.001

function calcScore(list) {
  return Math.max(0, list.reduce((s, t) => s - (SCORE_PENALTIES[t.category] || 1), 100))
}
function calcValue(list) {
  return list.reduce((s, t) => s + BASE_VALUE * (VALUE_MULTIPLIERS[t.category] || 1), 0)
}

export default function App() {
  const [trackers, setTrackers]         = useState([])
  const [stats, setStats]               = useState({ categoryCounts: {}, total: 0 })
  const [privacyScore, setPrivacyScore] = useState(100)
  const [sessionValue, setSessionValue] = useState(0)
  const [shadowProfile, setShadowProfile] = useState(
    'Observing session — shadow profile generates after 5 minutes of activity.'
  )
  const trackersRef = useRef([])

  useEffect(() => { trackersRef.current = trackers }, [trackers])

  useEffect(() => {
    fetch('/api/trackers').then(r => r.json()).then(data => {
      setTrackers(data)
      setPrivacyScore(calcScore(data))
      setSessionValue(calcValue(data))
    }).catch(() => {})

    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})

    const socket = io('http://localhost:3001', { transports: ['websocket'] })
    socket.on('new_tracker', event => {
      setTrackers(prev => {
        const updated = [event, ...prev].slice(0, 100)
        setPrivacyScore(calcScore(updated))
        setSessionValue(calcValue(updated))
        return updated
      })
      setStats(prev => ({
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

  return (
    <div className="flex min-h-screen w-full flex-col font-sans">

      {/* Header */}
      <header style={{ background: '#10252C', borderBottom: '1px solid #3D4D55' }} className="shrink-0 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-sm font-semibold tracking-tight" style={{ color: '#D3C3B9' }}>
                Transparency Lens
              </h1>
              <p className="text-xs" style={{ color: '#3D4D55' }}>Real-time tracker surveillance dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="label">Intercepted</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: '#D3C3B9' }}>{stats.total}</p>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#3D4D55' }} />
            <div className="text-right">
              <p className="label">Privacy Score</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: '#D3C3B9' }}>
                {privacyScore}<span className="text-xs font-normal" style={{ color: '#3D4D55' }}>/100</span>
              </p>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#3D4D55' }} />
            <div className="flex items-center gap-2 rounded-md px-3 py-2" style={{ background: '#1B1B1B', border: '1px solid #3D4D55' }}>
              <span className="relative h-2 w-2 shrink-0">
                <span className="live-dot absolute inset-0 rounded-full" style={{ background: '#B58863' }} />
                <span className="relative block h-2 w-2 rounded-full" style={{ background: '#B58863' }} />
              </span>
              <span className="text-xs font-medium" style={{ color: '#A79E9C' }}>Live</span>
            </div>
            <button
              onClick={() => fetch('/demo', { method: 'POST' }).catch(() => {})}
              className="rounded-md px-4 py-2 text-xs font-semibold transition active:scale-95"
              style={{ background: '#B58863', color: '#1B1B1B' }}
              onMouseEnter={e => e.target.style.background = '#c9956e'}
              onMouseLeave={e => e.target.style.background = '#B58863'}
            >
              Simulate Tracker
            </button>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="grid flex-1 grid-cols-[300px_minmax(0,1fr)_320px] gap-3 overflow-hidden p-3">
        <aside className="overflow-hidden">
          <EducationalFeed trackers={trackers} />
        </aside>

        <section className="flex flex-col gap-3 overflow-hidden">
          <div className="card relative overflow-hidden min-h-0" style={{ height: '340px' }}>
            <MapComponent trackers={trackers} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PrivacyScorecard score={privacyScore} />
            <DataValueEstimator sessionValue={sessionValue} />
          </div>
        </section>

        <aside className="flex flex-col gap-3 overflow-hidden">
          <CategoryPieChart stats={stats} />
          <ShadowProfileSummary profile={shadowProfile} />
          <GlobalAnalytics />
        </aside>
      </main>

      <HowItWorks />
    </div>
  )
}
