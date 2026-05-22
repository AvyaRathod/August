'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

type GeoJSONFeature = GeoJSON.Feature<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>
type GeoJSONCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>

interface MapViewProps {
  geojson: GeoJSONCollection
  style: string
  initialCamera: {
    center: [number, number]
    zoom: number
    pitch: number
    bearing: number
  }
}

export interface MapViewHandle {
  map: mapboxgl.Map | null
}

const STATUS_COLORS: mapboxgl.Expression = [
  'match',
  ['get', 'status'],
  'available', '#22c55e',
  'reserved', '#f59e0b',
  'sold', '#ef4444',
  'blocked', '#6b7280',
  '#6b7280',
]

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { geojson, style, initialCamera },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useImperativeHandle(ref, () => ({ map: mapRef.current }))

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: initialCamera.center,
      zoom: initialCamera.zoom,
      pitch: initialCamera.pitch,
      bearing: initialCamera.bearing,
    })

    mapRef.current = map

    map.on('load', () => {
      map.addSource('plots', {
        type: 'geojson',
        data: geojson,
        generateId: true,
      })

      map.addLayer({
        id: 'plots-fill',
        type: 'fill',
        source: 'plots',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#3b82f6',
            ['boolean', ['feature-state', 'hover'], false], '#93c5fd',
            STATUS_COLORS,
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 1.0,
            ['boolean', ['feature-state', 'hover'], false], 0.85,
            0.6,
          ],
        },
      })

      map.addLayer({
        id: 'plots-outline',
        type: 'line',
        source: 'plots',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#1d4ed8',
            'transparent',
          ],
          'line-width': 2,
        },
      })

      // Update handle after load so parent can call map methods
      if (ref && 'current' in ref) {
        ref.current = { map }
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
})

export default MapView
