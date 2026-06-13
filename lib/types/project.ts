export interface CameraStage {
  id: string
  name: string
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
  scrollProgress: number
}

export interface AmenityDef {
  id: string
  name: string
  displayMode: 'card' | 'modal'
  scrollStageRange: [number, number]
  anchor: [number, number]
  videoPath: string
  description: string
}

export interface MasterPlanConfig {
  desktop: string
  mobile: string
  georef: {
    topLeft: [number, number]
    topRight: [number, number]
    bottomRight: [number, number]
    bottomLeft: [number, number]
  } | null
}

export interface InitialCamera {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

export interface ProjectConfig {
  slug: string
  name: string
  tagline: string
  mapboxStyle: string
  masterPlan: MasterPlanConfig
  cameraStages: CameraStage[]
  initialCamera?: InitialCamera
  landingLoop?: string
  showcaseVideo?: string
  cta: {
    label: string
    whatsappNumber: string
  }
}
