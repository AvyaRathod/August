'use client'

import { useState } from 'react'
import ScrollScene from './ScrollScene'
import InteractiveScene from './InteractiveScene'
import PlotDetailPanel from './PlotDetailPanel'
import type { CameraStage } from '@/lib/types/project'

type Camera = { center: [number, number]; zoom: number; pitch: number; bearing: number }
type GeoJSONCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>

interface ProjectExperienceProps {
  geojson: GeoJSONCollection
  style: string
  cameraStages: CameraStage[]
  initialCamera: Camera
  projectSlug: string
  whatsappNumber: string
}

export default function ProjectExperience({
  geojson,
  style,
  cameraStages,
  initialCamera,
  projectSlug,
  whatsappNumber,
}: ProjectExperienceProps) {
  const [mode, setMode] = useState<'scroll' | 'explore'>('scroll')
  const [exploreCamera, setExploreCamera] = useState<Camera>(initialCamera)
  const [selectedProperties, setSelectedProperties] = useState<Record<string, unknown> | null>(null)

  function handleExplore(camera: Camera) {
    setExploreCamera(camera)
    setMode('explore')
  }

  function handleBack() {
    setSelectedProperties(null)
    setMode('scroll')
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
      <div className="relative w-full h-screen">
        <InteractiveScene
          geojson={geojson}
          style={style}
          entryCamera={exploreCamera}
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
    <ScrollScene
      geojson={geojson}
      style={style}
      cameraStages={cameraStages}
      initialCamera={initialCamera}
      onExplore={handleExplore}
    />
  )
}
