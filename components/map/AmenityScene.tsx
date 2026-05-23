'use client'

import { useEffect, useRef } from 'react'
import type { AmenityDef } from '@/lib/types/project'

interface AmenitySceneProps {
  amenity: AmenityDef
  projectSlug: string
  index: number
}

export default function AmenityScene({ amenity, projectSlug, index }: AmenitySceneProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  const videoSrc = amenity.videoPath
    ? `/data/projects/${projectSlug}/${amenity.videoPath}`
    : null

  const alignRight = index % 2 === 1

  return (
    <section
      ref={sectionRef}
      data-snap-section
      className="relative h-screen w-full overflow-hidden bg-surface-dark"
    >
      <div className="absolute inset-0">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-surface-overlay via-surface-card to-surface-dark" />
        )}
        <div
          className={`absolute inset-0 ${
            alignRight
              ? 'bg-gradient-to-l from-surface-dark/95 via-surface-dark/60 to-transparent'
              : 'bg-gradient-to-r from-surface-dark/95 via-surface-dark/60 to-transparent'
          }`}
        />
      </div>

      <div
        className={`relative z-10 h-full w-full max-w-7xl mx-auto px-6 sm:px-12 flex items-center ${
          alignRight ? 'justify-end text-right' : 'justify-start text-left'
        }`}
      >
        <div className="max-w-lg">
          <p className="text-brand-primary text-xs uppercase tracking-[0.4em] mb-4">
            Amenity {String(index + 1).padStart(2, '0')}
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold text-text-primary leading-tight mb-5">
            {amenity.name}
          </h2>
          <p className="text-text-muted text-base sm:text-lg leading-relaxed">
            {amenity.description}
          </p>
          {!amenity.videoPath && (
            <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-brand-primary/60">
              Video coming soon
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
