import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as turf from '@turf/turf'

const ORIGIN_GEO = [-74.2632, 40.6976]
const ORIGIN_LL  = [40.6976, -74.2632]

export default function MapComponent({ trackers }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const prevLenRef   = useRef(0)

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: ORIGIN_LL,
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 0.8,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 12,
      noWrap: true,
    }).addTo(map)

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://openstreetmap.org" style="color:#3D4D55">OSM</a> &copy; <a href="https://carto.com" style="color:#3D4D55">CARTO</a>')
      .addTo(map)

    L.circleMarker(ORIGIN_LL, {
      radius: 7,
      fillColor: '#B58863',
      color: '#1B1B1B',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map).bindPopup('You &middot; Union, NJ')

    mapRef.current = map

    // Force Leaflet to recalculate container size after mount
    setTimeout(() => map.invalidateSize(), 100)

    // Also recompute on window resize
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !trackers.length) return
    if (trackers.length === prevLenRef.current) return
    prevLenRef.current = trackers.length

    const t = trackers[0]
    if (t.location.lat === 0 && t.location.lng === 0) return

    const destLL  = [t.location.lat, t.location.lng]
    const destGeo = [t.location.lng, t.location.lat]

    const marker = L.circleMarker(destLL, {
      radius: 6,
      fillColor: '#c0614a',
      color: '#1B1B1B',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map)
    marker.bindPopup(
      `<div style="font:12px/1.5 Inter,sans-serif;background:#10252C;color:#D3C3B9;padding:8px 12px;border-radius:6px;margin:-4px -8px">
        <strong style="color:#D3C3B9">${t.hostname}</strong><br/>
        <span style="color:#A79E9C">${t.location.city} &middot; ${t.category}</span>
      </div>`
    )

    markersRef.current.push(marker)
    if (markersRef.current.length > 12) markersRef.current.shift().remove()

    try {
      const arc    = turf.greatCircle(turf.point(ORIGIN_GEO), turf.point(destGeo), { npoints: 80 })
      const coords = arc.geometry.coordinates.map(([lng, lat]) => [lat, lng])

      const line = L.polyline(coords, {
        color: '#B58863',
        weight: 1.5,
        opacity: 0,
        dashArray: '5 7',
      }).addTo(map)

      let op = 0
      const fadeIn = setInterval(() => {
        op = Math.min(op + 0.08, 0.7)
        line.setStyle({ opacity: op })
        if (op >= 0.7) clearInterval(fadeIn)
      }, 30)

      setTimeout(() => {
        let out = 0.7
        const fadeOut = setInterval(() => {
          out = Math.max(out - 0.06, 0)
          line.setStyle({ opacity: out })
          if (out <= 0) { clearInterval(fadeOut); map.removeLayer(line) }
        }, 40)
      }, 3500)
    } catch (_) {}
  }, [trackers])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div
        className="absolute left-3 top-3 z-[1000] rounded-lg px-3 py-2 shadow-sm"
        style={{ background: 'rgba(16,37,44,0.92)', border: '1px solid #3D4D55' }}
      >
        <p className="section-title text-xs">Live Route Map</p>
        <p className="mt-0.5 text-[11px]" style={{ color: '#A79E9C' }}>Tracker endpoints by location</p>
      </div>
      <div
        className="absolute bottom-7 left-3 z-[1000] rounded-lg px-3 py-1.5"
        style={{ background: 'rgba(16,37,44,0.92)', border: '1px solid #3D4D55' }}
      >
        <p className="label">Origin</p>
        <p className="mt-0.5 text-xs font-medium" style={{ color: '#D3C3B9' }}>Union, NJ</p>
      </div>
    </div>
  )
}
