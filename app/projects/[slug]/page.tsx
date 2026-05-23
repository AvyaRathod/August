import fs from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'
import type { Plot } from '@/lib/types/database'
import type { AmenityDef, ProjectConfig } from '@/lib/types/project'
import ProjectExperience from '@/components/map/ProjectExperience'

export const revalidate = 60

type GeoFeature = {
  id?: string | number | null
  properties: Record<string, unknown>
  [key: string]: unknown
}

type GeoJSON = {
  type: string
  features: GeoFeature[]
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const geoJsonPath = path.join(
    process.cwd(),
    'data',
    'projects',
    slug,
    'plots-geometry.geojson'
  )
  const geoJson = JSON.parse(fs.readFileSync(geoJsonPath, 'utf-8')) as GeoJSON

  const configPath = path.join(process.cwd(), 'data', 'projects', slug, 'config.json')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as ProjectConfig

  const amenitiesPath = path.join(process.cwd(), 'data', 'projects', slug, 'amenities.json')
  const amenities = (() => {
    try {
      return JSON.parse(fs.readFileSync(amenitiesPath, 'utf-8')) as AmenityDef[]
    } catch {
      return []
    }
  })()

  const supabase = await createClient()
  const { data } = await supabase
    .from('plots')
    .select('*')
    .eq('project_slug', slug)

  const plots = data as Plot[] | null
  const plotMap = new Map((plots ?? []).map((p) => [p.geometry_ref, p]))

  const features = geoJson.features.map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      ...(plotMap.get(f.id as string) ?? {}),
    },
  }))

  const initialCamera = config.initialCamera ?? {
    center: [78.9629, 20.5937] as [number, number],
    zoom: 5,
    pitch: 0,
    bearing: 0,
  }

  return (
    <main className="w-full">
      <ProjectExperience
        geojson={{ type: 'FeatureCollection', features } as GeoJSON.FeatureCollection<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>}
        style={config.mapboxStyle}
        amenities={amenities}
        initialCamera={initialCamera}
        projectSlug={slug}
        projectName={config.name}
        tagline={config.tagline}
        whatsappNumber={config.cta.whatsappNumber}
      />
    </main>
  )
}
