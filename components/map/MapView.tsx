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
  onReady?: () => void
}

export interface MapViewHandle {
  map: mapboxgl.Map | null
}

const STATUS_TEXT_COLORS: mapboxgl.Expression = [
  'match',
  ['get', 'status'],
  'available', '#15803d',
  'reserved', '#b45309',
  'sold', '#b91c1c',
  'blocked', '#374151',
  '#374151',
]

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { geojson, style, initialCamera, onReady },
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
      dragRotate: true,
      pitchWithRotate: true,
      touchZoomRotate: true,
      touchPitch: true,
    })

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right')

    mapRef.current = map

    map.on('load', () => {
      map.addSource('plots', {
        type: 'geojson',
        data: geojson,
        generateId: true,
      })

      map.addLayer({
        id: 'plots-extrusion',
        type: 'fill-extrusion',
        source: 'plots',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#3b82f6',
            ['boolean', ['feature-state', 'hover'], false], '#e0f2fe',
            '#ffffff',
          ],
          'fill-extrusion-height': 6,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.95,
          'fill-extrusion-vertical-gradient': true,
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
            '#475569',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2.5,
            0.5,
          ],
        },
      })

      map.addLayer({
        id: 'plots-label',
        type: 'symbol',
        source: 'plots',
        layout: {
          'text-field': [
            'format',
            ['get', 'plot_number'], { 'font-scale': 1.0 },
            '\n', {},
            ['upcase', ['coalesce', ['get', 'status'], 'unknown']], { 'font-scale': 0.78 },
          ],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-justify': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': STATUS_TEXT_COLORS,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.6,
          'text-halo-blur': 0.4,
        },
      })

      // Update handle after load so parent can call map methods
      if (ref && 'current' in ref) {
        ref.current = { map }
      }

      // Wait for first idle (tiles + style fully painted) before signalling ready
      map.once('idle', () => {
        onReady?.()
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="w-full h-full" data-lenis-prevent />
})

export default MapView
