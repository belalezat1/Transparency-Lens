import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as topojson from 'topojson-client'
import * as turf from '@turf/turf'
import worldData from 'world-atlas/countries-110m.json'

const ORIGIN_GEO = [-74.2632, 40.6976]
const ORIGIN_LL  = [40.6976, -74.2632]

const CAT_COLOR = {
  Fingerprinting: '#c0614a',
  Advertising:    '#B58863',
  Social:         '#c07840',
  Analytics:      '#4d9aab',
}

// ── Antimeridian fix ──────────────────────────────────────────────────────────
// Splits any ring that crosses ±180° into two valid rings so Leaflet's SVG
// renderer never draws a horizontal line across the whole map.
function splitRing(ring) {
  let hasCross = false
  for (let i = 1; i < ring.length; i++) {
    if (Math.abs(ring[i][0] - ring[i - 1][0]) > 180) { hasCross = true; break }
  }
  if (!hasCross) return [ring]

  const parts = []
  let cur = []
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i], b = ring[i + 1]
    cur.push(a)
    const diff = b[0] - a[0]
    if (Math.abs(diff) > 180) {
      const sign = diff > 0 ? 1 : -1
      const t    = (sign * 180 - a[0]) / diff
      const lat  = a[1] + t * (b[1] - a[1])
      cur.push([sign * 180, lat])
      cur.push(cur[0])
      if (cur.length >= 4) parts.push(cur)
      cur = [[-sign * 180, lat]]
    }
  }
  cur.push(cur[0])
  if (cur.length >= 4) parts.push(cur)
  return parts.length ? parts : [ring]
}

function fixGeometry(g) {
  if (!g) return g
  if (g.type === 'Polygon') {
    const rings = g.coordinates.flatMap(r => splitRing(r))
    return rings.length === 1
      ? { ...g, coordinates: rings }
      : { type: 'MultiPolygon', coordinates: rings.map(r => [r]) }
  }
  if (g.type === 'MultiPolygon') {
    const rings = g.coordinates.flatMap(p => p.flatMap(r => splitRing(r)))
    return { ...g, coordinates: rings.map(r => [r]) }
  }
  return g
}

const RAW_GEO      = topojson.feature(worldData, worldData.objects.countries)
const COUNTRIES_GEO = {
  ...RAW_GEO,
  features: RAW_GEO.features.map(f => ({ ...f, geometry: fixGeometry(f.geometry) })),
}

// ── Color scale ───────────────────────────────────────────────────────────────
function countryFill(t) {
  if (t <= 0)   return { color: '#162535', opacity: 0.22 }
  if (t < 0.20) return { color: '#c8a97a', opacity: 0.38 }
  if (t < 0.40) return { color: '#c07840', opacity: 0.48 }
  if (t < 0.60) return { color: '#c0614a', opacity: 0.55 }
  if (t < 0.80) return { color: '#a02010', opacity: 0.62 }
  return               { color: '#6b0f08', opacity: 0.68 }
}

function fillLabel(t) {
  if (t <= 0)   return 'No activity'
  if (t < 0.20) return 'Low'
  if (t < 0.40) return 'Moderate'
  if (t < 0.60) return 'High'
  if (t < 0.80) return 'Severe'
  return               'Critical'
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapComponent({ trackers }) {
  const wrapperRef    = useRef(null)
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const choroplethRef = useRef(null)
  const scoresRef     = useRef({})
  const markersRef    = useRef([])
  const prevLenRef    = useRef(0)

  useEffect(() => {
    // SVG renderer (default) — no canvas bounding-rect artifact
    const map = L.map(containerRef.current, {
      center: ORIGIN_LL,
      zoom: 3,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 10, noWrap: true,
    }).addTo(map)

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://openstreetmap.org" style="color:#3D4D55">OSM</a> &copy; <a href="https://carto.com" style="color:#3D4D55">CARTO</a>')
      .addTo(map)

    // Choropleth — antimeridian-safe GeoJSON, SVG renderer, no stroke
    const layer = L.geoJSON(COUNTRIES_GEO, {
      style: { fillColor: '#162535', fillOpacity: 0.22, color: 'none', weight: 0 },
      onEachFeature(feature, lyr) {
        lyr.on({
          mouseover(e) {
            const count = scoresRef.current[feature.id] || 0
            const t     = count / (Math.max(...Object.values(scoresRef.current), 1))
            e.target.setStyle({ fillOpacity: Math.min((countryFill(t).opacity + 0.18), 0.88) })
          },
          mouseout(e) {
            layer.resetStyle(e.target)
          },
          click(e) {
            const count = scoresRef.current[feature.id] || 0
            const t     = count / (Math.max(...Object.values(scoresRef.current), 1))
            L.popup({ className: 'dark-popup' })
              .setLatLng(e.latlng)
              .setContent(
                `<div style="font:12px/1.6 Inter,sans-serif;background:#10252C;color:#D3C3B9;padding:10px 14px;border-radius:8px;margin:-4px -8px;min-width:120px">
                  <strong style="font-size:13px">${count} tracker${count !== 1 ? 's' : ''}</strong><br/>
                  <span style="color:#A79E9C">${fillLabel(t)} activity</span>
                </div>`
              )
              .openOn(map)
          },
        })
      },
    }).addTo(map)
    choroplethRef.current = layer

    // Origin pin
    L.circleMarker(ORIGIN_LL, {
      radius: 7, fillColor: '#B58863', color: '#10252C', weight: 2, fillOpacity: 1,
    }).addTo(map).bindPopup('<div style="font:12px Inter,sans-serif;background:#10252C;color:#D3C3B9;padding:8px 12px;border-radius:6px;margin:-4px -8px">You &middot; Union, NJ</div>')

    mapRef.current = map

    const ro = new ResizeObserver(() => map.invalidateSize())
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    requestAnimationFrame(() => map.invalidateSize())
    setTimeout(() => map.invalidateSize(), 200)
    map._ro = ro

    return () => {
      map._ro?.disconnect()
      map.remove()
      mapRef.current = null
      choroplethRef.current = null
    }
  }, [])

  // Recolor countries on tracker update
  useEffect(() => {
    const layer = choroplethRef.current
    if (!layer) return

    const scores = {}
    trackers
      .filter(t => t.location.lat !== 0 || t.location.lng !== 0)
      .forEach(t => {
        const pt = turf.point([t.location.lng, t.location.lat])
        for (const feature of COUNTRIES_GEO.features) {
          try {
            if (turf.booleanPointInPolygon(pt, feature)) {
              scores[feature.id] = (scores[feature.id] || 0) + 1
              break
            }
          } catch (_) {}
        }
      })

    scoresRef.current = scores
    const max = Math.max(...Object.values(scores), 1)

    layer.setStyle(feature => {
      const fill = countryFill((scores[feature.id] || 0) / max)
      return { fillColor: fill.color, fillOpacity: fill.opacity, color: 'none', weight: 0 }
    })
  }, [trackers])

  // Arc + marker per new tracker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !trackers.length) return
    if (trackers.length === prevLenRef.current) return
    prevLenRef.current = trackers.length

    const t = trackers[0]
    if (t.location.lat === 0 && t.location.lng === 0) return

    const destLL  = [t.location.lat, t.location.lng]
    const destGeo = [t.location.lng, t.location.lat]
    const color   = CAT_COLOR[t.category] || '#A79E9C'

    const marker = L.circleMarker(destLL, {
      radius: 5, fillColor: color, color: '#10252C', weight: 1.5, fillOpacity: 1,
    }).addTo(map)
    marker.bindPopup(
      `<div style="font:12px/1.5 Inter,sans-serif;background:#10252C;color:#D3C3B9;padding:8px 12px;border-radius:6px;margin:-4px -8px">
        <strong style="color:#D3C3B9">${t.hostname}</strong><br/>
        <span style="color:#A79E9C">${t.location.city} &middot; ${t.category}</span>
      </div>`
    )
    markersRef.current.push(marker)
    if (markersRef.current.length > 20) markersRef.current.shift().remove()

    try {
      const arc    = turf.greatCircle(turf.point(ORIGIN_GEO), turf.point(destGeo), { npoints: 80 })
      const coords = arc.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      const line   = L.polyline(coords, { color: '#B58863', weight: 1.5, opacity: 0, dashArray: '5 7' }).addTo(map)
      let op = 0
      const fadeIn = setInterval(() => {
        op = Math.min(op + 0.08, 0.7); line.setStyle({ opacity: op })
        if (op >= 0.7) clearInterval(fadeIn)
      }, 30)
      setTimeout(() => {
        let out = 0.7
        const fadeOut = setInterval(() => {
          out = Math.max(out - 0.06, 0); line.setStyle({ opacity: out })
          if (out <= 0) { clearInterval(fadeOut); map.removeLayer(line) }
        }, 40)
      }, 3500)
    } catch (_) {}
  }, [trackers])

  const zoom = delta => mapRef.current?.setZoom((mapRef.current.getZoom() + delta))
  const reset = () => mapRef.current?.setView(ORIGIN_LL, 3)

  return (
    <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Top-left label */}
      <div className="absolute left-3 top-3 z-[1000] rounded-lg px-3 py-2 shadow-sm"
        style={{ background: 'rgba(16,37,44,0.92)', border: '1px solid #3D4D55' }}>
        <p className="section-title text-xs">Live Route Map</p>
        <p className="mt-0.5 text-[11px]" style={{ color: '#A79E9C' }}>Click a country for tracker count</p>
      </div>

      {/* Zoom + reset controls */}
      <div className="absolute right-3 bottom-10 z-[1000] flex flex-col gap-1">
        {[['＋', () => zoom(1)], ['－', () => zoom(-1)], ['⌖', reset]].map(([icon, fn]) => (
          <button key={icon} onClick={fn}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold transition active:scale-95"
            style={{ background: 'rgba(16,37,44,0.92)', border: '1px solid #3D4D55', color: '#D3C3B9' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#B58863'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#3D4D55'}
          >{icon}</button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute right-3 top-3 z-[1000] rounded-lg px-3 py-2"
        style={{ background: 'rgba(16,37,44,0.92)', border: '1px solid #3D4D55' }}>
        <p className="label mb-2">Activity Level</p>
        {[
          ['#162535', 'No activity'],
          ['#c8a97a', 'Low'],
          ['#c07840', 'Moderate'],
          ['#c0614a', 'High'],
          ['#a02010', 'Severe'],
          ['#6b0f08', 'Critical'],
        ].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
            <div style={{ width: '11px', height: '11px', borderRadius: '2px', background: color, border: '1px solid #3D4D55', flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: '#A79E9C' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Origin label */}
      <div className="absolute bottom-10 left-3 z-[1000] rounded-lg px-3 py-1.5"
        style={{ background: 'rgba(16,37,44,0.92)', border: '1px solid #3D4D55' }}>
        <p className="label">Origin</p>
        <p className="mt-0.5 text-xs font-medium" style={{ color: '#D3C3B9' }}>Union, NJ</p>
      </div>
    </div>
  )
}
