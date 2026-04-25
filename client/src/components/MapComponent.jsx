import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'

// Union NJ — the "user" origin point
const ORIGIN = [-74.2632, 40.6976]

export default function MapComponent({ trackers }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const prevLenRef = useRef(0)

  // Initialize map once
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.error('[map] VITE_MAPBOX_TOKEN not set')
      return
    }
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: ORIGIN,
      zoom: 3,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      // Origin marker (Union NJ)
      new mapboxgl.Marker({ color: '#2563eb' })
        .setLngLat(ORIGIN)
        .setPopup(new mapboxgl.Popup({ offset: 10 }).setText('You · Union, NJ'))
        .addTo(map)
    })

    return () => map.remove()
  }, [])

  // Draw arc + marker on newest tracker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || !trackers.length) return
    if (trackers.length === prevLenRef.current) return
    prevLenRef.current = trackers.length

    const newest = trackers[0]
    const dest = [newest.location.lng, newest.location.lat]

    // Skip if location is at 0,0
    if (newest.location.lat === 0 && newest.location.lng === 0) return

    // Marker
    const el = document.createElement('div')
    el.style.cssText =
      'width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.25);cursor:pointer'

    const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
      `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5">
        <strong>${newest.hostname}</strong><br/>
        ${newest.location.city} · ${newest.category}
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

    // Arc via turf great circle
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
          'line-color': '#2563eb',
          'line-width': 2,
          'line-opacity': 0.8,
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
    } catch (_) {
      // turf throws if origin === dest (same location)
    }
  }, [trackers])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-600 border border-slate-200 shadow-sm">
        Origin: Union, NJ
      </div>
    </div>
  )
}
