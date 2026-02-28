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
  NeonTunnelLayer,
  ReactiveOrbLayer,
  ParticleFieldLayer,
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
  fillColor: '#22d3ee',
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
  fillColor: '#00ffff',
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
  width: 30, // percentage of canvas width
  height: 30, // percentage of canvas height (will auto-adjust if maintainAspectRatio is true)
  naturalWidth: 0,
  naturalHeight: 0,
  fixed: false,
  maintainAspectRatio: true, // preserve aspect ratio by default
  audioReactive: true,
  reactiveScale: 0.15
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

// --- 3D Audio-Reactive Layers (Three.js) ---

export const DEFAULT_NEON_TUNNEL: Omit<NeonTunnelLayer, 'id' | 'name'> = {
  type: 'neonTunnel',
  visible: true,
  opacity: 1,
  blendMode: 'screen',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  frequencyBands: ['bass'],
  audioSensitivity: 1.5,
  color: '#00ffff',
  wireframeThickness: 2,
  glowIntensity: 1.2,
  speed: 0.5,
  segments: 32,
  cameraShakeEnabled: true,
  cameraShakeIntensity: 0.1,
  enableBloom: true,
  bloomStrength: 1.5,
  enableRGBShift: false,
  rgbShiftAmount: 0.003
}

export const DEFAULT_REACTIVE_ORB: Omit<ReactiveOrbLayer, 'id' | 'name'> = {
  type: 'reactiveOrb',
  visible: true,
  opacity: 1,
  blendMode: 'screen',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  frequencyBands: ['mid'],
  audioSensitivity: 1.0,
  color: '#ff00ff',
  displacementAmount: 0.3,
  noiseScale: 1.5,
  subdivisions: 4,
  fresnelIntensity: 1.5,
  enableBloom: true,
  bloomStrength: 2.0,
  enableRGBShift: false,
  rgbShiftAmount: 0.003
}

export const DEFAULT_PARTICLE_FIELD: Omit<ParticleFieldLayer, 'id' | 'name'> = {
  type: 'particleField',
  visible: true,
  opacity: 0.8,
  blendMode: 'screen',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  frequencyBands: ['high'],
  audioSensitivity: 1.0,
  particleCount: 3000,
  particleSize: 2,
  particleColor: '#ffffff',
  speed: 1.0,
  depth: 50,
  enableBloom: true,
  bloomStrength: 1.0,
  enableRGBShift: false,
  rgbShiftAmount: 0.003
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
        name: `Image ${index}`
        // width and height are already percentages in DEFAULT_IMAGE
      }
    case 'geometry3d':
      return { ...DEFAULT_GEOMETRY_3D, id, name: `Geometry (3D) ${index}` }
    case 'group':
      return { ...DEFAULT_GROUP, id, name: `Group ${index}` }
    case 'neonTunnel':
      return { ...DEFAULT_NEON_TUNNEL, id, name: `Neon Tunnel ${index}` }
    case 'reactiveOrb':
      return { ...DEFAULT_REACTIVE_ORB, id, name: `Reactive Orb ${index}` }
    case 'particleField':
      return { ...DEFAULT_PARTICLE_FIELD, id, name: `Particle Field ${index}` }
  }
}

// --- Built-in Presets ---

const PRESET_LAYERS: Record<string, AstrofoxLayer[]> = {
  default: [
    {
      id: 'default_background',
      name: 'Background',
      ...DEFAULT_IMAGE,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      width: 100,
      height: 100,
      naturalWidth: 4878,
      naturalHeight: 3252,
      fixed: false,
      maintainAspectRatio: false, // Stretch to fill screen
      audioReactive: false,
      reactiveScale: 0.15
    },
    {
      id: 'default_wave',
      name: 'Wave Overlay',
      ...DEFAULT_WAVE_SPECTRUM,
      y: 200,
      width: 1000,
      height: 200,
      blendMode: 'normal',
      opacity: 0.87,
      maxFrequency: 20000
    },
    {
      id: 'default_soundwave2',
      name: 'Sound Wave 2 1',
      ...DEFAULT_SOUND_WAVE_2,
      y: -41,
      radius: 150,
      lineWidth: 3,
      lineColor: '#53f43e',
      mode: 'circle',
      sensitivity: 1.5,
      blendMode: 'color-dodge'
    },
    {
      id: 'default_bars',
      name: 'Spectrum Bars',
      ...DEFAULT_BAR_SPECTRUM,
      y: 300,
      width: 1000,
      height: 250,
      rotation: 360,
      maxFrequency: 20000,
      smoothing: 0.75
    },
    {
      id: 'default_logo',
      name: 'LedFX',
      ...DEFAULT_IMAGE,
      imageUrl: 'https://raw.githubusercontent.com/LedFx/LedFx/refs/heads/main/ledfx_assets/discord.png',
      width: 20,
      height: 43,
      y: -40,
      naturalWidth: 512,
      naturalHeight: 512,
      maintainAspectRatio: true,
      audioReactive: true,
      reactiveScale: 0.93
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
  ],
  retrowave: [
    {
      id: 'retro_grid',
      name: 'Grid Background',
      ...DEFAULT_BAR_SPECTRUM,
      y: 350,
      width: 1200,
      height: 300,
      barWidth: 6,
      barSpacing: 1,
      barColor: '#ff006e',
      barColorEnd: '#8338ec',
      mirror: false,
      blendMode: 'screen'
    },
    {
      id: 'retro_wave',
      name: 'Wave Line',
      ...DEFAULT_WAVE_SPECTRUM,
      y: 0,
      width: 1200,
      height: 250,
      lineWidth: 3,
      lineColor: '#fb5607',
      fill: true,
      fillColor: '#fb5607',
      blendMode: 'screen'
    },
    {
      id: 'retro_text',
      name: 'Title',
      ...DEFAULT_TEXT,
      text: 'RETROWAVE',
      y: -300,
      fontSize: 80,
      font: 'Racing Sans One',
      color: '#ffbe0b',
      audioReactive: true
    }
  ],
  cosmic: [
    {
      id: 'cosmic_sphere',
      name: 'Cosmic Sphere',
      ...DEFAULT_GEOMETRY_3D,
      shape: 'Sphere',
      size: 180,
      color: '#8b5cf6',
      wireframe: true,
      edges: false,
      opacity: 0.7,
      blendMode: 'screen',
      audioReactive: true
    },
    {
      id: 'cosmic_rings',
      name: 'Energy Rings',
      ...DEFAULT_SOUND_WAVE_2,
      radius: 250,
      lineWidth: 2,
      lineColor: '#06b6d4',
      sensitivity: 2,
      blendMode: 'screen'
    },
    {
      id: 'cosmic_spectrum',
      name: 'Spectrum Base',
      ...DEFAULT_BAR_SPECTRUM,
      y: 380,
      width: 1000,
      height: 180,
      barColor: '#3b82f6',
      barColorEnd: '#ec4899',
      mirror: true,
      opacity: 0.8
    }
  ],
  particles: [
    {
      id: 'particles_center',
      name: 'Center Wave',
      ...DEFAULT_SOUND_WAVE_2,
      radius: 100,
      lineWidth: 5,
      lineColor: '#fbbf24',
      sensitivity: 3,
      blendMode: 'screen'
    },
    {
      id: 'particles_outer',
      name: 'Outer Ring',
      ...DEFAULT_SOUND_WAVE_2,
      radius: 250,
      lineWidth: 2,
      lineColor: '#10b981',
      sensitivity: 1.5,
      opacity: 0.6,
      blendMode: 'screen'
    },
    {
      id: 'particles_bars',
      name: 'Beat Bars',
      ...DEFAULT_BAR_SPECTRUM,
      y: 350,
      width: 900,
      height: 200,
      barWidth: 12,
      barColor: '#ef4444',
      barColorEnd: '#f59e0b',
      mirror: false
    }
  ]
}

export const DEFAULT_ASTROFOX_CONFIG: AstrofoxConfig = {
  layers: PRESET_LAYERS.default,
  backgroundColor: '#0f0f23',
  width: 1920,
  height: 1080,
  primaryColor: '#6366f1',
  secondaryColor: '#a855f7'
}

export const ASTROFOX_PRESETS = [
  'default',
  'minimal',
  'neon',
  '3d',
  'retrowave',
  'cosmic',
  'particles'
] as const
export type AstrofoxPresetName = (typeof ASTROFOX_PRESETS)[number]

export function getAstrofoxPresetLayers(preset: AstrofoxPresetName): AstrofoxLayer[] {
  return JSON.parse(JSON.stringify(PRESET_LAYERS[preset] || PRESET_LAYERS.default))
}

// Export PRESET_LAYERS for re-use
export { PRESET_LAYERS }
