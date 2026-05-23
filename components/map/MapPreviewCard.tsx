'use client'

import MapView from './MapView'

type GeoJSONCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>

type Camera = { center: [number, number]; zoom: number; pitch: number; bearing: number }

interface MapPreviewCardProps {
  geojson: GeoJSONCollection
  style: string
  initialCamera: Camera
  onExplore: () => void
}

export default function MapPreviewCard({
  geojson,
  style,
  initialCamera,
  onExplore,
}: MapPreviewCardProps) {
  return (
    <section
      data-snap-section
      className="relative h-screen flex flex-col items-center justify-center bg-surface-dark px-6 py-20 gap-10 overflow-hidden"
    >
      <div className="text-center max-w-2xl">
        <p className="text-brand-primary text-xs uppercase tracking-[0.4em] mb-4">
          The Layout
        </p>
        <h2 className="text-4xl sm:text-5xl font-semibold text-text-primary leading-tight">
          Explore Every Plot
        </h2>
        <p className="mt-4 text-text-muted text-base sm:text-lg leading-relaxed">
          Pan, tilt, filter by availability. Click any plot for price, dimensions, and to register interest.
        </p>
      </div>

      <div className="relative w-full max-w-4xl aspect-[16/10] rounded-2xl overflow-hidden ring-1 ring-brand-primary/25 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
        <MapView geojson={geojson} style={style} initialCamera={initialCamera} />
        <button
          onClick={onExplore}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-6 py-2.5 rounded-full bg-brand-primary text-surface-dark text-sm font-semibold tracking-wide hover:bg-brand-primary/90 transition-colors shadow-xl"
        >
          Explore Plots →
        </button>
      </div>

      <button
        onClick={onExplore}
        className="text-text-muted hover:text-brand-primary text-xs uppercase tracking-[0.3em] transition-colors"
      >
        Or jump straight in →
      </button>
    </section>
  )
}
