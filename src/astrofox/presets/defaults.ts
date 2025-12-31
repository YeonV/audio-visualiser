/**
 * Astrofox Layer Defaults
 *
 * Default configurations for each layer type.
 */

import type {
  AstrofoxLayerType,
  AstrofoxLayer,
  BarSpectrumLayer,
  WaveSpectrumLayer,
  SoundWaveLayer,
  SoundWave2Layer,
  TextLayer,
  ImageLayer,
  Geometry3DLayer,
  GroupLayer,
  AstrofoxConfig
} from '../types'

// --- Default Layer Configurations ---

export const DEFAULT_BAR_SPECTRUM: Omit<BarSpectrumLayer, 'id' | 'name'> = {
  type: 'barSpectrum',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  width: 800,
  height: 200,
  barWidth: 8,
  barSpacing: 2,
  barColor: '#6366f1',
  barColorEnd: '#a855f7',
  shadowHeight: 50,
  shadowColor: '#1e1b4b',
  minFrequency: 20,
  maxFrequency: 6000,
  maxDecibels: -12,
  smoothing: 0.5,
  mirror: false
}

export const DEFAULT_WAVE_SPECTRUM: Omit<WaveSpectrumLayer, 'id' | 'name'> = {
  type: 'waveSpectrum',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  width: 800,
  height: 150,
  lineWidth: 2,
  lineColor: '#22d3ee',
  fill: true,
  fillColor: 'rgba(34, 211, 238, 0.3)',
  minFrequency: 20,
  maxFrequency: 6000,
  smoothing: 0.6
}

export const DEFAULT_SOUND_WAVE: Omit<SoundWaveLayer, 'id' | 'name'> = {
  type: 'soundWave',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  width: 854,
  height: 240,
  lineWidth: 2,
  color: '#00ffff',
  fillColor: 'rgba(0, 255, 255, 0.1)',
  useFill: false,
  wavelength: 0.1,
  smooth: 0.5
}

export const DEFAULT_SOUND_WAVE_2: Omit<SoundWave2Layer, 'id' | 'name'> = {
  type: 'soundWave2',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  radius: 150,
  lineWidth: 3,
  lineColor: '#f43f5e',
  mode: 'circle',
  sensitivity: 1.5
}

export const DEFAULT_TEXT: Omit<TextLayer, 'id' | 'name'> = {
  type: 'text',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  text: 'LedFX',
  font: 'Permanent Marker',
  fontSize: 60,
  bold: false,
  italic: false,
  color: '#ffffff',
  textAlign: 'center',
  audioReactive: true,
  reactiveScale: 0.2
}

export const DEFAULT_IMAGE: Omit<ImageLayer, 'id' | 'name'> = {
  type: 'image',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  imageUrl: '',
  imageData: '',
  width: 0,
  height: 0,
  naturalWidth: 0,
  naturalHeight: 0,
  fixed: false
}

export const DEFAULT_GEOMETRY_3D: Omit<Geometry3DLayer, 'id' | 'name'> = {
  type: 'geometry3d',
  visible: true,
  opacity: 0.5,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  shape: 'Box',
  material: 'Standard',
  shading: 'Smooth',
  color: '#6366f1',
  wireframe: false,
  edges: true,
  edgeColor: '#ffffff',
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  size: 150,
  audioReactive: true
}

export const DEFAULT_GROUP: Omit<GroupLayer, 'id' | 'name'> = {
  type: 'group',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  mask: false,
  childIds: []
}

// --- Helper Functions ---

export const generateId = (): string => Math.random().toString(36).substring(2, 11)

export const createDefaultLayer = (
  type: AstrofoxLayerType,
  index: number,
  canvasWidth?: number,
  canvasHeight?: number
): AstrofoxLayer => {
  const id = generateId()

  switch (type) {
    case 'barSpectrum':
      return { ...DEFAULT_BAR_SPECTRUM, id, name: `Bar Spectrum ${index}` }
    case 'waveSpectrum':
      return { ...DEFAULT_WAVE_SPECTRUM, id, name: `Wave Spectrum ${index}` }
    case 'soundWave':
      return {
        ...DEFAULT_SOUND_WAVE,
        id,
        name: `Soundwave ${index}`,
        width: canvasWidth || 854,
        height: canvasHeight ? Math.floor(canvasHeight * 0.3) : 240
      }
    case 'soundWave2':
      return { ...DEFAULT_SOUND_WAVE_2, id, name: `Sound Wave 2 ${index}` }
    case 'text':
      return { ...DEFAULT_TEXT, id, name: `Text ${index}` }
    case 'image':
      return {
        ...DEFAULT_IMAGE,
        id,
        name: `Image ${index}`,
        width: canvasWidth || 0,
        height: canvasHeight || 0
      }
    case 'geometry3d':
      return { ...DEFAULT_GEOMETRY_3D, id, name: `Geometry (3D) ${index}` }
    case 'group':
      return { ...DEFAULT_GROUP, id, name: `Group ${index}` }
  }
}

// --- Built-in Presets ---

export const PRESET_LAYERS: Record<string, AstrofoxLayer[]> = {
  default: [
    {
      id: 'default_bars',
      name: 'Spectrum Bars',
      ...DEFAULT_BAR_SPECTRUM,
      y: 300,
      width: 1000,
      height: 250
    },
    {
      id: 'default_wave',
      name: 'Wave Overlay',
      ...DEFAULT_WAVE_SPECTRUM,
      y: 200,
      width: 1000,
      height: 200,
      blendMode: 'screen',
      opacity: 0.7
    },
    {
      id: 'default_text',
      name: 'Title',
      ...DEFAULT_TEXT,
      y: -250,
      fontSize: 72,
      text: 'LedFX'
    }
  ],
  minimal: [
    {
      id: 'minimal_wave',
      name: 'Sound Wave',
      ...DEFAULT_SOUND_WAVE,
      width: 1200,
      height: 300
    }
  ],
  neon: [
    {
      id: 'neon_bars',
      name: 'Neon Bars',
      ...DEFAULT_BAR_SPECTRUM,
      y: 200,
      width: 1000,
      height: 300,
      barColor: '#00ff88',
      barColorEnd: '#00ffff',
      shadowColor: '#003322',
      blendMode: 'screen'
    },
    {
      id: 'neon_circle',
      name: 'Neon Circle',
      ...DEFAULT_SOUND_WAVE_2,
      y: -100,
      radius: 180,
      lineColor: '#ff00ff',
      blendMode: 'screen'
    }
  ],
  '3d': [
    {
      id: '3d_cube',
      name: '3D Cube',
      ...DEFAULT_GEOMETRY_3D,
      shape: 'Box',
      size: 200,
      color: '#6366f1'
    },
    {
      id: '3d_bars',
      name: 'Bars Below',
      ...DEFAULT_BAR_SPECTRUM,
      y: 350,
      width: 800,
      height: 150
    }
  ]
}

export const DEFAULT_ASTROFOX_CONFIG: AstrofoxConfig = {
  layers: PRESET_LAYERS.default,
  backgroundColor: '#0f0f23',
  width: 1920,
  height: 1080
}

export const ASTROFOX_PRESETS = ['default', 'minimal', 'neon', '3d'] as const
export type AstrofoxPresetName = (typeof ASTROFOX_PRESETS)[number]

export function getAstrofoxPresetLayers(preset: AstrofoxPresetName): AstrofoxLayer[] {
  return JSON.parse(JSON.stringify(PRESET_LAYERS[preset] || PRESET_LAYERS.default))
}
