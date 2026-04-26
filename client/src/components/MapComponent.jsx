import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ORIGIN_LL = [40.6976, -74.2632]

const COUNTRY_LABELS = [
  { name: 'Canada', latLng: [57, -106] },
  { name: 'United States', latLng: [39, -98] },
  { name: 'Mexico', latLng: [23, -102] },
  { name: 'Brazil', latLng: [-10, -52] },
  { name: 'Argentina', latLng: [-38, -64] },
  { name: 'United Kingdom', latLng: [55, -3] },
  { name: 'France', latLng: [46.5, 2] },
  { name: 'Germany', latLng: [51, 10] },
  { name: 'Spain', latLng: [40, -4] },
  { name: 'Italy', latLng: [42.5, 12.5] },
  { name: 'Russia', latLng: [61, 90] },
  { name: 'China', latLng: [35, 104] },
  { name: 'India', latLng: [22, 79] },
  { name: 'Japan', latLng: [37, 138] },
  { name: 'South Korea', latLng: [36, 128] },
  { name: 'Indonesia', latLng: [-2, 118] },
  { name: 'Australia', latLng: [-25, 134] },
  { name: 'South Africa', latLng: [-30, 25] },
  { name: 'Nigeria', latLng: [9, 8] },
  { name: 'Egypt', latLng: [27, 30] },
  { name: 'Saudi Arabia', latLng: [24, 45] },
  { name: 'Turkey', latLng: [39, 35] },
]

const CATEGORY_STYLE = {
  Fingerprinting: { color: '#c0614a', label: 'Fingerprinting' },
  Advertising: { color: '#b58863', label: 'Advertising' },
  Social: { color: '#c07840', label: 'Social' },
  Analytics: { color: '#4d9aab', label: 'Analytics' },
}

const NETWORK_HUBS = [
  { name: 'New York IX', latLng: [40.7128, -74.006] },
  { name: 'Ashburn Backbone', latLng: [39.0438, -77.4874] },
  { name: 'Chicago Exchange', latLng: [41.8781, -87.6298] },
  { name: 'Dallas Exchange', latLng: [32.7767, -96.797] },
  { name: 'Los Angeles Edge', latLng: [34.0522, -118.2437] },
  { name: 'London IX', latLng: [51.5074, -0.1278] },
  { name: 'Frankfurt IX', latLng: [50.1109, 8.6821] },
  { name: 'Singapore IX', latLng: [1.3521, 103.8198] },
  { name: 'Tokyo Edge', latLng: [35.6762, 139.6503] },
  { name: 'Sydney Edge', latLng: [-33.8688, 151.2093] },
  { name: 'Sao Paulo IX', latLng: [-23.5505, -46.6333] },
  { name: 'Johannesburg IX', latLng: [-26.2041, 28.0473] },
]

function validLocation(tracker) {
  return tracker?.location && (tracker.location.lat !== 0 || tracker.location.lng !== 0)
}

function distanceScore(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
}

function nearestHub(destination, exclude = []) {
  const excluded = new Set(exclude.map((hub) => hub.name))
  return NETWORK_HUBS
    .filter((hub) => !excluded.has(hub.name))
    .sort((a, b) => distanceScore(a.latLng, destination) - distanceScore(b.latLng, destination))[0]
}

function midpointHop(a, b, label) {
  return {
    name: label,
    latLng: [
      a[0] + (b[0] - a[0]) * 0.52,
      a[1] + (b[1] - a[1]) * 0.52,
    ],
  }
}

function simulatedRoute(destination) {
  const firstHop = { name: 'Local Gateway', latLng: [40.72, -74.12] }
  const metro = { name: 'Metro Edge', latLng: [40.7128, -74.006] }
  const destinationHub = nearestHub(destination, [])
  const route = [
    { name: 'Origin', latLng: ORIGIN_LL },
    firstHop,
    metro,
  ]

  if (destinationHub && distanceScore(destinationHub.latLng, metro.latLng) > 18) {
    route.push(midpointHop(metro.latLng, destinationHub.latLng, 'Backbone Transit'))
    route.push(destinationHub)
  }

  route.push({ name: 'Tracker Endpoint', latLng: destination })

  return route.filter((hop, index, arr) => {
    if (index === 0) return true
    return distanceScore(hop.latLng, arr[index - 1].latLng) > 0.4
  })
}

function connectionSegments(origin, destination) {
  const [originLat, originLng] = origin
  const [destLat, destLng] = destination
  const diff = destLng - originLng

  if (Math.abs(diff) <= 180) return [[origin, destination]]

  const adjustedDestLng = diff > 180 ? destLng - 360 : destLng + 360
  const edgeLng = diff > 180 ? -180 : 180
  const oppositeEdgeLng = diff > 180 ? 180 : -180
  const t = (edgeLng - originLng) / (adjustedDestLng - originLng)
  const edgeLat = originLat + t * (destLat - originLat)

  return [
    [origin, [edgeLat, edgeLng]],
    [[edgeLat, oppositeEdgeLng], destination],
  ]
}

function popupHtml(title, meta) {
  return `
    <div style="font:12px/1.45 Inter,system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:9px 12px;border-radius:6px;margin:-4px -8px;min-width:150px">
      <strong style="display:block;margin-bottom:3px;color:#f8fafc">${title}</strong>
      <span style="color:#94a3b8">${meta}</span>
    </div>
  `
}

export default function MapComponent({ trackers }) {
  const wrapperRef = useRef(null)
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const endpointLayerRef = useRef(null)
  const connectionLayerRef = useRef(null)
  const labelLayerRef = useRef(null)

  const visibleTrackers = useMemo(
    () => trackers.filter(validLocation).slice(0, 40),
    [trackers]
  )
  const latest = visibleTrackers[0]

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: ORIGIN_LL,
      zoom: 3,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: false,
      maxBounds: [[-75, -180], [85, 180]],
      maxBoundsViscosity: 0.8,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 8,
      noWrap: true,
    }).addTo(map)

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; OpenStreetMap &copy; CARTO')
      .addTo(map)

    map.createPane('ping-connections')
    map.getPane('ping-connections').style.zIndex = 420
    map.getPane('ping-connections').style.pointerEvents = 'none'

    L.circleMarker(ORIGIN_LL, {
      radius: 7,
      fillColor: '#22d3ee',
      color: '#0f172a',
      weight: 2,
      fillOpacity: 1,
      interactive: true,
    })
      .addTo(map)
      .bindPopup(popupHtml('Origin', 'Union, NJ'))

    connectionLayerRef.current = L.layerGroup().addTo(map)
    endpointLayerRef.current = L.layerGroup().addTo(map)
    labelLayerRef.current = L.layerGroup().addTo(map)
    COUNTRY_LABELS.forEach((label) => {
      L.marker(label.latLng, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'country-label-marker',
          html: `<span>${label.name}</span>`,
          iconSize: [120, 18],
          iconAnchor: [60, 9],
        }),
      }).addTo(labelLayerRef.current)
    })
    mapRef.current = map

    const ro = new ResizeObserver(() => map.invalidateSize())
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    requestAnimationFrame(() => map.invalidateSize())
    setTimeout(() => map.invalidateSize(), 200)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      endpointLayerRef.current = null
      connectionLayerRef.current = null
      labelLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const endpointLayer = endpointLayerRef.current
    const connectionLayer = connectionLayerRef.current
    if (!map || !endpointLayer || !connectionLayer) return

    endpointLayer.clearLayers()
    connectionLayer.clearLayers()

    visibleTrackers.forEach((tracker, index) => {
      const style = CATEGORY_STYLE[tracker.category] || { color: '#94a3b8', label: tracker.category || 'Unknown' }
      const isLatest = index === 0
      const destination = [tracker.location.lat, tracker.location.lng]
      const route = simulatedRoute(destination)

      route.slice(0, -1).forEach((hop, hopIndex) => {
        const nextHop = route[hopIndex + 1]
        connectionSegments(hop.latLng, nextHop.latLng).forEach((segment) => {
          L.polyline(segment, {
            pane: 'ping-connections',
            color: style.color,
            weight: isLatest ? 2.2 : 1.2,
            opacity: isLatest ? 0.74 : 0.28,
            dashArray: isLatest ? '4 7' : '2 9',
            lineCap: 'round',
            interactive: false,
          }).addTo(connectionLayer)
        })
      })

      if (isLatest) {
        route.slice(1, -1).forEach((hop, hopIndex) => {
          L.circleMarker(hop.latLng, {
            radius: 3.2,
            fillColor: '#D3C3B9',
            color: '#10252C',
            weight: 1,
            fillOpacity: 0.86,
            opacity: 1,
          })
            .bindPopup(popupHtml(`Hop ${hopIndex + 1}`, hop.name))
            .addTo(connectionLayer)
        })
      }

      L.circleMarker(destination, {
        radius: isLatest ? 7 : 5,
        fillColor: style.color,
        color: '#0f172a',
        weight: isLatest ? 2 : 1.5,
        fillOpacity: isLatest ? 1 : 0.82,
        opacity: 1,
      })
        .bindPopup(
          popupHtml(
            tracker.hostname || 'Unknown hostname',
            `${tracker.location.city || 'Unknown location'} · ${style.label}`
          )
        )
        .addTo(endpointLayer)
    })
  }, [visibleTrackers])

  function zoom(delta) {
    const map = mapRef.current
    if (map) map.setZoom(map.getZoom() + delta)
  }

  function reset() {
    mapRef.current?.setView(ORIGIN_LL, 3)
  }

  return (
    <div ref={wrapperRef} className="absolute inset-0 overflow-hidden bg-slate-950">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute left-3 top-3 z-[1000] rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 shadow-sm">
        <p className="section-title text-xs">Endpoint Map</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Multi-hop paths simulate outbound tracker routes</p>
      </div>

      <div className="absolute right-3 top-3 z-[1000] rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 shadow-sm">
        <p className="label mb-2">Categories</p>
        {Object.entries(CATEGORY_STYLE).map(([key, item]) => (
          <div key={key} className="mb-1 flex items-center gap-2 last:mb-0">
            <span
              className="h-2.5 w-2.5 rounded-full border border-slate-900"
              style={{ background: item.color }}
            />
            <span className="text-[10px] text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 shadow-sm">
        <p className="label">Origin</p>
        <p className="mt-0.5 text-xs font-medium text-slate-200">Union, NJ</p>
      </div>

      <div className="absolute bottom-3 right-3 z-[1000] flex items-end gap-2">
        {latest && (
          <div className="hidden max-w-[220px] rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 shadow-sm sm:block">
            <p className="label">Latest endpoint</p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-200">{latest.hostname}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {latest.location.city || 'Unknown location'} · {latest.category}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => zoom(1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-950/90 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoom(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-950/90 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-950/90 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
            aria-label="Reset map"
          >
            R
          </button>
        </div>
      </div>
    </div>
  )
}
