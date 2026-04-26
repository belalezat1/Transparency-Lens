import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'

const ORIGIN = [-74.2632, 40.6976]

export default function MapComponent({ trackers }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const prevLenRef = useRef(0)

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.error('[map] VITE_MAPBOX_TOKEN not set')
      return
    }
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: ORIGIN,
      zoom: 3,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      new mapboxgl.Marker({ color: '#22d3ee' })
        .setLngLat(ORIGIN)
        .setPopup(new mapboxgl.Popup({ offset: 10 }).setText('You · Union, NJ'))
        .addTo(map)
    })

    return () => map.remove()
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || !trackers.length) return
    if (trackers.length === prevLenRef.current) return
    prevLenRef.current = trackers.length

    const newest = trackers[0]
    const dest = [newest.location.lng, newest.location.lat]

    if (newest.location.lat === 0 && newest.location.lng === 0) return

    const el = document.createElement('div')
    el.style.cssText =
      'width:10px;height:10px;border-radius:50%;background:#f87171;border:2px solid #1e293b;box-shadow:0 0 8px rgba(248,113,113,0.6);cursor:pointer'

    const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
      `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5;background:#0f172a;color:#e2e8f0;padding:4px">
        <strong style="color:#f1f5f9">${newest.hostname}</strong><br/>
        <span style="color:#94a3b8">${newest.location.city} · ${newest.category}</span>
      </div>`
    )
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(dest)
      .setPopup(popup)
      .addTo(map)

    markersRef.current.push(marker)
    if (markersRef.current.length > 12) {
      markersRef.current.shift().remove()
    }

    const arcId = `arc-${Date.now()}`
    try {
      const arc = turf.greatCircle(turf.point(ORIGIN), turf.point(dest), { npoints: 80 })
      map.addSource(arcId, { type: 'geojson', data: arc })
      map.addLayer({
        id: arcId,
        type: 'line',
        source: arcId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#22d3ee',
          'line-width': 1.5,
          'line-opacity': 0.85,
          'line-dasharray': [0, 6],
        },
      })

      let step = 0
      function animate() {
        step += 0.4
        if (map.getLayer(arcId)) {
          const drawn = Math.min(step, 6)
          const gap = Math.max(0, 6 - step)
          map.setPaintProperty(arcId, 'line-dasharray', [drawn, gap])
        }
        if (step < 6) {
          requestAnimationFrame(animate)
        } else {
          setTimeout(() => {
            if (map.getLayer(arcId)) map.removeLayer(arcId)
            if (map.getSource(arcId)) map.removeSource(arcId)
          }, 2500)
        }
      }
      requestAnimationFrame(animate)
    } catch (_) {}
  }, [trackers])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-400 border border-slate-700 shadow-sm">
        Origin: Union, NJ
      </div>
    </div>
  )
}
