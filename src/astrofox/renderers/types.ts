/**
 * Astrofox Renderer Types
 *
 * Common types and utilities for layer renderers.
 */

import type {
  BarSpectrumLayer,
  WaveSpectrumLayer,
  SoundWaveLayer,
  SoundWave2Layer,
  TextLayer,
  ImageLayer,
  Geometry3DLayer,
  BlendMode
} from '../types'

// Re-export layer types for convenience
export type {
  BarSpectrumLayer,
  WaveSpectrumLayer,
  SoundWaveLayer,
  SoundWave2Layer,
  TextLayer,
  ImageLayer,
  Geometry3DLayer
}

/**
 * Audio data array type - supports both number[] and Float32Array
 */
export type AudioDataArray = number[] | Float32Array

/**
 * Common render context for all layer renderers
 */
export interface RenderContext {
  ctx: CanvasRenderingContext2D
  centerX: number
  centerY: number
  audioData: AudioDataArray
}

/**
 * FFT data parser function type
 */
export type AudioDataParser = (
  data: AudioDataArray | Uint8Array,
  layerId: string,
  minFrequency: number,
  maxFrequency: number,
  maxDecibels: number,
  smoothing: number,
  targetBins?: number
) => Float32Array

/**
 * Image cache for image layer rendering
 */
export type ImageCache = Map<string, HTMLImageElement>

/**
 * 3D geometry data for caching
 */
export interface GeometryData {
  vertices: [number, number, number][]
  edges: [number, number][]
  faces: [number, number, number][]
}

export type GeometryCache = Map<string, GeometryData>

/**
 * Convert blend mode name to canvas globalCompositeOperation
 */
export const getCompositeOperation = (blendMode: BlendMode | string): GlobalCompositeOperation => {
  if (blendMode === 'normal') return 'source-over'
  return blendMode as GlobalCompositeOperation
}

/**
 * Apply common layer transformations
 */
export const applyLayerTransform = (
  ctx: CanvasRenderingContext2D,
  layer: { x: number; y: number; rotation: number; scale: number; opacity: number; blendMode: string },
  centerX: number,
  centerY: number
): void => {
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)
}

/**
 * Parse hex color to RGB tuple
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255]
}
