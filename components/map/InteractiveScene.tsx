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

const STATUS_COLORS: mapboxgl.Expression = [
  'match',
  ['get', 'status'],
  'available', '#22c55e',
  'reserved', '#f59e0b',
  'sold', '#ef4444',
  'blocked', '#6b7280',
  '#6b7280',
]

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
    map.setFilter('plots-fill', expr as mapboxgl.FilterSpecification | null)
    map.setFilter('plots-outline', expr as mapboxgl.FilterSpecification | null)
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
    })

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

      // Explore transition: animate pitch to 45° to signal interactive mode
      map.easeTo({ pitch: 45, duration: 600 })

      map.on('mousemove', 'plots-fill', (e) => {
        if (!e.features?.length) return
        map.getCanvas().style.cursor = 'pointer'
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'plots', id: hoveredId }, { hover: false })
        }
        hoveredId = e.features[0].id as number
        map.setFeatureState({ source: 'plots', id: hoveredId }, { hover: true })
      })

      map.on('mouseleave', 'plots-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'plots', id: hoveredId }, { hover: false })
          hoveredId = null
        }
      })

      map.on('click', 'plots-fill', (e) => {
        if (!e.features?.length) return
        e.originalEvent.stopPropagation()
        if (selectedId !== null) {
          map.setFeatureState({ source: 'plots', id: selectedId }, { selected: false })
        }
        selectedId = e.features[0].id as number
        map.setFeatureState({ source: 'plots', id: selectedId }, { selected: true })
        const props = (e.features[0].properties ?? {}) as Record<string, unknown>
        const plotId = (props.geometry_ref as string) ?? selectedId
        onPlotClick(plotId, props)
      })

      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['plots-fill'] })
        if (features.length === 0 && selectedId !== null) {
          map.setFeatureState({ source: 'plots', id: selectedId }, { selected: false })
          selectedId = null
          onPlotClick('', {})
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
