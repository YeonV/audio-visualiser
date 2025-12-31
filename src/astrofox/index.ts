/**
 * Astrofox Module
 *
 * Layer-based audio visualization system inspired by Astrofox.
 * Provides types, presets, renderers, and hooks for building
 * composable audio visualizations.
 */

// Types (primary source)
export * from './types'

// Presets and defaults
export * from './presets/defaults'

// Hooks
export * from './hooks'

// Layer controls (React components)
export * from './controls'

// Layer renderers (excluding types already exported from ./types)
export {
  // Renderer utilities
  applyLayerTransform,
  hexToRgb,
  // Render context types
  type RenderContext,
  type AudioDataParser,
  type ImageCache,
  type GeometryData,
  type GeometryCache,
  // Renderers
  renderBarSpectrum,
  type BarSpectrumRenderOptions,
  renderWaveSpectrum,
  type WaveSpectrumRenderOptions,
  renderSoundWave,
  type SoundWaveRenderOptions,
  renderSoundWave2,
  type SoundWave2RenderOptions,
  renderText,
  type TextRenderOptions,
  renderImage,
  type ImageRenderOptions,
  renderGeometry3D,
  getGeometryData,
  type Geometry3DRenderOptions
} from './renderers'
