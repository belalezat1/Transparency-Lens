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
      } catch (error) {
        console.warn('[shadow-profile] refresh failed', error)
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full font-sans" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

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
            <div className="flex items-center gap-2 rounded-md px-3 py-2" style={{ background: '#1B1B1B', border: '1px solid #3D4D55' }}>
              <span className="relative h-2 w-2 shrink-0">
                <span className="live-dot absolute inset-0 rounded-full" style={{ background: '#B58863' }} />
                <span className="relative block h-2 w-2 rounded-full" style={{ background: '#B58863' }} />
              </span>
              <span className="text-xs font-medium" style={{ color: '#A79E9C' }}>Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main style={{
        flex: '1 1 0',
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '300px minmax(0,1fr) 320px',
        gridTemplateRows: '1fr',
        gap: '12px',
        padding: '12px',
        overflow: 'hidden',
      }}>
        <aside style={{ minHeight: 0, overflow: 'hidden' }}>
          <EducationalFeed trackers={trackers} />
        </aside>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
          <div className="card" style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            <MapComponent trackers={trackers} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexShrink: 0 }}>
            <PrivacyScorecard score={privacyScore} />
            <DataValueEstimator sessionValue={sessionValue} />
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0, overflow: 'hidden' }}>
          <CategoryPieChart stats={stats} />
          <ShadowProfileSummary profile={shadowProfile} />
          <GlobalAnalytics />
        </aside>
      </main>

      <HowItWorks />
    </div>
  )
}
