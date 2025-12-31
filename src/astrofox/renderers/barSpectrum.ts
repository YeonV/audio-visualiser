/**
 * Bar Spectrum Renderer
 *
 * Renders frequency spectrum as vertical bars with gradient colors and optional shadows.
 */

import type { BarSpectrumLayer, AudioDataParser, AudioDataArray } from './types'
import { getCompositeOperation } from './types'

export interface BarSpectrumRenderOptions {
  ctx: CanvasRenderingContext2D
  layer: BarSpectrumLayer
  audioData: AudioDataArray
  centerX: number
  centerY: number
  parseAudioData: AudioDataParser
}

/**
 * Render bar spectrum visualization
 */
export function renderBarSpectrum({
  ctx,
  layer,
  audioData,
  centerX,
  centerY,
  parseAudioData
}: BarSpectrumRenderOptions): void {
  // Calculate number of bars to display
  const numBars = Math.max(1, Math.floor(layer.width / (layer.barWidth + layer.barSpacing)))

  // Use FFTParser for per-layer frequency filtering and dB normalization
  const parsedData = parseAudioData(
    audioData,
    layer.id,
    layer.minFrequency,
    layer.maxFrequency,
    layer.maxDecibels,
    layer.smoothing,
    numBars
  )

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const startX = -layer.width / 2

  // Create single gradient for all bars (optimization)
  const gradient = ctx.createLinearGradient(0, 0, 0, -layer.height)
  gradient.addColorStop(0, layer.barColor)
  gradient.addColorStop(1, layer.barColorEnd)
  ctx.fillStyle = gradient

  for (let i = 0; i < numBars; i++) {
    const amplitude = parsedData[i] || 0
    const barHeight = amplitude * layer.height

    const x = startX + i * (layer.barWidth + layer.barSpacing)
    ctx.fillRect(x, 0, layer.barWidth, -barHeight)

    if (layer.mirror) {
      ctx.fillRect(x, 0, layer.barWidth, barHeight)
    }
  }

  // Draw shadow separately if needed
  if (layer.shadowHeight > 0) {
    ctx.fillStyle = layer.shadowColor
    ctx.globalAlpha = layer.opacity * 0.3
    for (let i = 0; i < numBars; i++) {
      const amplitude = parsedData[i] || 0
      const barHeight = amplitude * layer.height
      const x = startX + i * (layer.barWidth + layer.barSpacing)
      ctx.fillRect(x, 0, layer.barWidth, Math.min(barHeight * 0.5, layer.shadowHeight))
    }
  }

  ctx.restore()
}

export default renderBarSpectrum
