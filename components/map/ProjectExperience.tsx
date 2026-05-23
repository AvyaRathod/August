'use client'

import { useEffect, useState } from 'react'
import InteractiveScene from './InteractiveScene'
import PlotDetailPanel from './PlotDetailPanel'
import ProjectShowcase from './ProjectShowcase'
import type { AmenityDef } from '@/lib/types/project'

type Camera = { center: [number, number]; zoom: number; pitch: number; bearing: number }
type GeoJSONCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>

interface ProjectExperienceProps {
  geojson: GeoJSONCollection
  style: string
  amenities: AmenityDef[]
  initialCamera: Camera
  projectSlug: string
  projectName: string
  tagline?: string
  whatsappNumber: string
}

export default function ProjectExperience({
  geojson,
  style,
  amenities,
  initialCamera,
  projectSlug,
  projectName,
  tagline,
  whatsappNumber,
}: ProjectExperienceProps) {
  const [mode, setMode] = useState<'showcase' | 'explore'>('showcase')
  const [selectedProperties, setSelectedProperties] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (mode !== 'explore') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mode])

  function handleExplore() {
    setMode('explore')
  }

  function handleBack() {
    setSelectedProperties(null)
    setMode('showcase')
  }

  function handlePlotClick(plotId: string | number, properties: Record<string, unknown>) {
    if (plotId === '' || plotId === null) {
      setSelectedProperties(null)
    } else {
      setSelectedProperties(properties)
    }
  }

  if (mode === 'explore') {
    return (
      <div className="fixed inset-0 z-40 w-full h-screen">
        <InteractiveScene
          geojson={geojson}
          style={style}
          entryCamera={initialCamera}
          onBack={handleBack}
          onPlotClick={handlePlotClick}
        />
        {selectedProperties && (
          <PlotDetailPanel
            properties={selectedProperties}
            projectSlug={projectSlug}
            whatsappNumber={whatsappNumber}
            onClose={() => setSelectedProperties(null)}
          />
        )}
      </div>
    )
  }

  return (
    <ProjectShowcase
      projectName={projectName}
      tagline={tagline}
      amenities={amenities}
      geojson={geojson}
      style={style}
      initialCamera={initialCamera}
      projectSlug={projectSlug}
      onExplore={handleExplore}
    />
  )
}
