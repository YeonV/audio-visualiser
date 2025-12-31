/**
 * Astrofox Layer Types
 *
 * Type definitions for all Astrofox layer types and configurations.
 */

// --- Blend Modes ---
export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion'
] as const

export type BlendMode = (typeof BLEND_MODES)[number]

// Map blend mode names to canvas globalCompositeOperation values
export const getCompositeOperation = (blendMode: string): GlobalCompositeOperation => {
  if (blendMode === 'normal') return 'source-over'
  return blendMode as GlobalCompositeOperation
}

// --- 3D Geometry ---
export const GEOMETRY_SHAPES = [
  'Box',
  'Sphere',
  'Dodecahedron',
  'Icosahedron',
  'Octahedron',
  'Tetrahedron',
  'Torus',
  'Torus Knot'
] as const

export type GeometryShape = (typeof GEOMETRY_SHAPES)[number]

export const GEOMETRY_MATERIALS = ['Standard', 'Basic', 'Lambert', 'Phong', 'Normal'] as const
export type GeometryMaterial = (typeof GEOMETRY_MATERIALS)[number]

export const SHADING_TYPES = ['Smooth', 'Flat'] as const
export type ShadingType = (typeof SHADING_TYPES)[number]

// --- Layer Types ---
export type AstrofoxLayerType =
  | 'barSpectrum'
  | 'waveSpectrum'
  | 'soundWave'
  | 'soundWave2'
  | 'text'
  | 'image'
  | 'geometry3d'
  | 'group'

// --- Base Layer ---
export interface AstrofoxLayerBase {
  id: string
  type: AstrofoxLayerType
  name: string
  visible: boolean
  opacity: number
  blendMode: BlendMode
  x: number
  y: number
  rotation: number
  scale: number
}

// --- Specific Layer Types ---
export interface BarSpectrumLayer extends AstrofoxLayerBase {
  type: 'barSpectrum'
  width: number
  height: number
  barWidth: number
  barSpacing: number
  barColor: string
  barColorEnd: string
  shadowHeight: number
  shadowColor: string
  minFrequency: number
  maxFrequency: number
  maxDecibels: number
  smoothing: number
  mirror: boolean
}

export interface WaveSpectrumLayer extends AstrofoxLayerBase {
  type: 'waveSpectrum'
  width: number
  height: number
  lineWidth: number
  lineColor: string
  fill: boolean
  fillColor: string
  minFrequency: number
  maxFrequency: number
  smoothing: number
}

export interface SoundWaveLayer extends AstrofoxLayerBase {
  type: 'soundWave'
  width: number
  height: number
  lineWidth: number
  color: string
  fillColor: string
  useFill: boolean
  wavelength: number
  smooth: number
}

export interface SoundWave2Layer extends AstrofoxLayerBase {
  type: 'soundWave2'
  radius: number
  lineWidth: number
  lineColor: string
  mode: 'circle' | 'line'
  sensitivity: number
}

export interface TextLayer extends AstrofoxLayerBase {
  type: 'text'
  text: string
  font: string
  fontSize: number
  bold: boolean
  italic: boolean
  color: string
  textAlign: 'left' | 'center' | 'right'
  audioReactive: boolean
  reactiveScale: number
}

export interface ImageLayer extends AstrofoxLayerBase {
  type: 'image'
  imageUrl: string
  imageData: string
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
  fixed: boolean
}

export interface Geometry3DLayer extends AstrofoxLayerBase {
  type: 'geometry3d'
  shape: GeometryShape
  material: GeometryMaterial
  shading: ShadingType
  color: string
  wireframe: boolean
  edges: boolean
  edgeColor: string
  rotationX: number
  rotationY: number
  rotationZ: number
  size: number
  audioReactive: boolean
}

export interface GroupLayer extends AstrofoxLayerBase {
  type: 'group'
  mask: boolean
  childIds: string[]
}

// --- Union Type ---
export type AstrofoxLayer =
  | BarSpectrumLayer
  | WaveSpectrumLayer
  | SoundWaveLayer
  | SoundWave2Layer
  | TextLayer
  | ImageLayer
  | Geometry3DLayer
  | GroupLayer

// --- Configuration ---
export interface AstrofoxConfig {
  layers: AstrofoxLayer[]
  backgroundColor: string
  width: number
  height: number
}

// --- Ref Interface ---
export interface AstrofoxVisualiserRef {
  getCanvas: () => HTMLCanvasElement | null
  addLayer: (type: AstrofoxLayerType) => void
  removeLayer: (id: string) => void
  duplicateLayer: (id: string) => void
  moveLayer: (id: string, direction: 'up' | 'down') => void
  renderControls: () => React.ReactNode
}

// --- Props Interface ---
export interface AstrofoxVisualiserProps {
  audioData: number[]
  isPlaying: boolean
  config: AstrofoxConfig
  onConfigChange?: (config: Partial<AstrofoxConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}
