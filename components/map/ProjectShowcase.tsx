'use client'

import { useEffect, useRef } from 'react'
import type { AmenityDef } from '@/lib/types/project'
import ProjectHero from './ProjectHero'
import AmenityScene from './AmenityScene'
import MapPreviewCard from './MapPreviewCard'

type GeoJSONCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { status?: string; [key: string]: unknown }>

type Camera = { center: [number, number]; zoom: number; pitch: number; bearing: number }

interface ProjectShowcaseProps {
  projectName: string
  tagline?: string
  amenities: AmenityDef[]
  geojson: GeoJSONCollection
  style: string
  initialCamera: Camera
  projectSlug: string
  onExplore: () => void
}

const SNAP_DEBOUNCE_MS = 110
const SNAP_DURATION_MS = 1400
const POST_ANIM_LOCK_MS = 80

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function ProjectShowcase({
  projectName,
  tagline,
  amenities,
  geojson,
  style,
  initialCamera,
  projectSlug,
  onExplore,
}: ProjectShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let snapTimer: ReturnType<typeof setTimeout> | null = null
    let animFrame: number | null = null
    let isProgrammatic = false

    function nearestSectionTop(): number | null {
      if (!container) return null
      const sections = container.querySelectorAll<HTMLElement>('[data-snap-section]')
      if (sections.length === 0) return null
      const scroll = container.scrollTop
      let nearest = sections[0].offsetTop
      let nearestDist = Math.abs(sections[0].offsetTop - scroll)
      sections.forEach((s) => {
        const d = Math.abs(s.offsetTop - scroll)
        if (d < nearestDist) {
          nearest = s.offsetTop
          nearestDist = d
        }
      })
      return nearest
    }

    function snap() {
      if (!container) return
      const target = nearestSectionTop()
      if (target === null) return
      const start = container.scrollTop
      const distance = target - start
      if (Math.abs(distance) < 2) return

      const startTime = performance.now()
      isProgrammatic = true

      function step(now: number) {
        if (!container) return
        const t = Math.min(1, (now - startTime) / SNAP_DURATION_MS)
        container.scrollTop = start + distance * easeInOutCubic(t)
        if (t < 1) {
          animFrame = requestAnimationFrame(step)
        } else {
          animFrame = null
          window.setTimeout(() => {
            isProgrammatic = false
          }, POST_ANIM_LOCK_MS)
        }
      }
      animFrame = requestAnimationFrame(step)
    }

    function onScroll() {
      if (isProgrammatic) return
      if (snapTimer) clearTimeout(snapTimer)
      snapTimer = setTimeout(snap, SNAP_DEBOUNCE_MS)
    }

    function onUserInput() {
      // Cancel any in-flight snap so user can override it instantly
      if (animFrame !== null) {
        cancelAnimationFrame(animFrame)
        animFrame = null
        isProgrammatic = false
      }
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    container.addEventListener('wheel', onUserInput, { passive: true })
    container.addEventListener('touchstart', onUserInput, { passive: true })
    window.addEventListener('keydown', onUserInput)

    return () => {
      if (snapTimer) clearTimeout(snapTimer)
      if (animFrame) cancelAnimationFrame(animFrame)
      container.removeEventListener('scroll', onScroll)
      container.removeEventListener('wheel', onUserInput)
      container.removeEventListener('touchstart', onUserInput)
      window.removeEventListener('keydown', onUserInput)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-y-scroll bg-surface-dark"
    >
      <ProjectHero name={projectName} tagline={tagline} />
      {amenities.map((amenity, index) => (
        <AmenityScene
          key={amenity.id}
          amenity={amenity}
          projectSlug={projectSlug}
          index={index}
        />
      ))}
      <MapPreviewCard
        geojson={geojson}
        style={style}
        initialCamera={initialCamera}
        onExplore={onExplore}
      />
    </div>
  )
}
