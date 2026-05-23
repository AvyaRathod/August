'use client'

import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import type { AmenityDef, CameraStage } from '@/lib/types/project'
import MapView, { type MapViewHandle } from './MapView'
import AmenityOverlay from './AmenityOverlay'

type GeoJSONCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>

type Camera = { center: [number, number]; zoom: number; pitch: number; bearing: number }

interface ScrollSceneProps {
  geojson: GeoJSONCollection
  style: string
  cameraStages: CameraStage[]
  initialCamera: Camera
  amenities?: AmenityDef[]
  projectSlug: string
  onExplore?: (camera: Camera) => void
  onMapReady?: () => void
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpCamera(
  from: CameraStage,
  to: CameraStage,
  t: number
): { center: [number, number]; zoom: number; pitch: number; bearing: number } {
  return {
    center: [lerp(from.center[0], to.center[0], t), lerp(from.center[1], to.center[1], t)],
    zoom: lerp(from.zoom, to.zoom, t),
    pitch: lerp(from.pitch, to.pitch, t),
    bearing: lerp(from.bearing, to.bearing, t),
  }
}

export default function ScrollScene({
  geojson,
  style,
  cameraStages,
  initialCamera,
  amenities = [],
  projectSlug,
  onExplore,
  onMapReady,
}: ScrollSceneProps) {
  const mapHandleRef = useRef<MapViewHandle>(null)
  const isMapLoaded = useRef(false)
  const lenisRef = useRef<Lenis | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true })
    lenisRef.current = lenis

    lenis.on('scroll', ({ scroll, limit }: { scroll: number; limit: number }) => {
      const p = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0
      setProgress(p)

      if (!isMapLoaded.current || cameraStages.length === 0) return

      const map = mapHandleRef.current?.map
      if (!map) return

      const sorted = [...cameraStages].sort((a, b) => a.scrollProgress - b.scrollProgress)

      let from = sorted[0]
      let to = sorted[sorted.length - 1]
      let t = 0

      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i]
        const next = sorted[i + 1]
        if (p >= curr.scrollProgress && p <= next.scrollProgress) {
          from = curr
          to = next
          const range = next.scrollProgress - curr.scrollProgress
          t = range > 0 ? (p - curr.scrollProgress) / range : 0
          break
        }
      }

      if (p < sorted[0].scrollProgress) {
        from = sorted[0]
        to = sorted[0]
        t = 0
      } else if (p > sorted[sorted.length - 1].scrollProgress) {
        from = sorted[sorted.length - 1]
        to = sorted[sorted.length - 1]
        t = 0
      }

      map.easeTo({ ...lerpCamera(from, to, t), duration: 0 })
    })

    const loadCheck = setInterval(() => {
      const map = mapHandleRef.current?.map
      if (map && map.isStyleLoaded()) {
        isMapLoaded.current = true
        clearInterval(loadCheck)
      }
    }, 100)

    return () => {
      lenis.destroy()
      lenisRef.current = null
      clearInterval(loadCheck)
    }
  }, [cameraStages])

  function pauseScroll() {
    lenisRef.current?.stop()
  }

  function resumeScroll() {
    lenisRef.current?.start()
  }

  return (
    <div style={{ height: '300vh' }} className="relative">
      <div className="sticky top-0 w-full h-screen relative">
        <MapView
          ref={mapHandleRef}
          geojson={geojson}
          style={style}
          initialCamera={initialCamera}
          onReady={onMapReady}
        />
        <AmenityOverlay
          amenities={amenities}
          progress={progress}
          projectSlug={projectSlug}
          onModalOpen={pauseScroll}
          onModalClose={resumeScroll}
        />
        {onExplore && (
          <button
            onClick={() => {
              const map = mapHandleRef.current?.map
              if (!map) return
              const c = map.getCenter()
              onExplore({ center: [c.lng, c.lat], zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() })
            }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-white text-black px-6 py-3 rounded-full text-sm font-semibold shadow-lg hover:bg-gray-100 transition-colors"
          >
            Explore Plots →
          </button>
        )}
      </div>
    </div>
  )
}
