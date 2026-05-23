'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { PlotStatus } from '@/lib/types/database'
import FilterBar from './FilterBar'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

type GeoJSONCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>

interface InteractiveSceneProps {
  geojson: GeoJSONCollection
  style: string
  entryCamera: { center: [number, number]; zoom: number; pitch: number; bearing: number }
  onBack: () => void
  onPlotClick: (plotId: string | number, properties: Record<string, unknown>) => void
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

const INTERACTIVE_LAYERS = ['plots-extrusion', 'plots-outline', 'plots-label']

const PANEL_WIDTH_PX = 384
const PANEL_INSET_PX = 16
const FOCUS_PADDING_RIGHT = PANEL_WIDTH_PX + PANEL_INSET_PX * 2

function polygonCenter(geom: GeoJSON.Geometry): [number, number] | null {
  let ring: GeoJSON.Position[] | null = null
  if (geom.type === 'Polygon') ring = geom.coordinates[0]
  else if (geom.type === 'MultiPolygon') ring = geom.coordinates[0]?.[0] ?? null
  if (!ring || ring.length === 0) return null
  let sx = 0
  let sy = 0
  const last = ring[ring.length - 1]
  const first = ring[0]
  const closed = last[0] === first[0] && last[1] === first[1]
  const pts = closed ? ring.slice(0, -1) : ring
  for (const [x, y] of pts) {
    sx += x
    sy += y
  }
  return [sx / pts.length, sy / pts.length]
}

type FilterValue = PlotStatus | 'all'

export default function InteractiveScene({
  geojson,
  style,
  entryCamera,
  onBack,
  onPlotClick,
}: InteractiveSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')

  function handleFilterChange(value: FilterValue) {
    setActiveFilter(value)
    const map = mapRef.current
    if (!map) return
    const expr = value === 'all' ? null : ['==', ['get', 'status'], value]
    for (const layerId of INTERACTIVE_LAYERS) {
      map.setFilter(layerId, expr as mapboxgl.FilterSpecification | null)
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: entryCamera.center,
      zoom: entryCamera.zoom,
      pitch: entryCamera.pitch,
      bearing: entryCamera.bearing,
      dragRotate: true,
      pitchWithRotate: true,
      touchZoomRotate: true,
      touchPitch: true,
    })

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right')

    mapRef.current = map

    let hoveredId: number | null = null
    let selectedId: number | null = null

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

      // Explore transition: animate pitch to 55° to signal interactive mode
      map.easeTo({ pitch: 55, duration: 600 })

      map.on('mousemove', 'plots-extrusion', (e) => {
        if (!e.features?.length) return
        map.getCanvas().style.cursor = 'pointer'
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'plots', id: hoveredId }, { hover: false })
        }
        hoveredId = e.features[0].id as number
        map.setFeatureState({ source: 'plots', id: hoveredId }, { hover: true })
      })

      map.on('mouseleave', 'plots-extrusion', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'plots', id: hoveredId }, { hover: false })
          hoveredId = null
        }
      })

      map.on('click', 'plots-extrusion', (e) => {
        if (!e.features?.length) return
        e.originalEvent.stopPropagation()
        if (selectedId !== null) {
          map.setFeatureState({ source: 'plots', id: selectedId }, { selected: false })
        }
        const feature = e.features[0]
        selectedId = feature.id as number
        map.setFeatureState({ source: 'plots', id: selectedId }, { selected: true })
        const props = (feature.properties ?? {}) as Record<string, unknown>
        const plotId = (props.geometry_ref as string) ?? selectedId
        onPlotClick(plotId, props)

        const center = polygonCenter(feature.geometry)
        if (center) {
          const isDesktop =
            typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
          map.easeTo({
            center,
            zoom: Math.max(map.getZoom(), 18.5),
            padding: isDesktop
              ? { top: 0, bottom: 0, left: 0, right: FOCUS_PADDING_RIGHT }
              : { top: 0, bottom: 0, left: 0, right: 0 },
            duration: 700,
            essential: true,
          })
        }
      })

      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['plots-extrusion'] })
        if (features.length === 0 && selectedId !== null) {
          map.setFeatureState({ source: 'plots', id: selectedId }, { selected: false })
          selectedId = null
          onPlotClick('', {})
          map.easeTo({
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
            duration: 500,
            essential: true,
          })
        }
      })
    })

    return () => {
      mapRef.current = null
      map.getCanvas().style.cursor = ''
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black/90 transition-colors"
      >
        ← Back to Tour
      </button>
      <FilterBar active={activeFilter} onChange={handleFilterChange} />
    </div>
  )
}
