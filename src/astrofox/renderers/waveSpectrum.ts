/**
 * Wave Spectrum Renderer
 *
 * Renders frequency spectrum as a smooth curved line with optional fill.
 */

import type { WaveSpectrumLayer, AudioDataParser, AudioDataArray } from './types'
import { getCompositeOperation } from './types'

export interface WaveSpectrumRenderOptions {
  ctx: CanvasRenderingContext2D
  layer: WaveSpectrumLayer
  audioData: AudioDataArray
  centerX: number
  centerY: number
  parseAudioData: AudioDataParser
}

/**
 * Render wave spectrum visualization
 */
export function renderWaveSpectrum({
  ctx,
  layer,
  audioData,
  centerX,
  centerY,
  parseAudioData
}: WaveSpectrumRenderOptions): void {
  // Use FFTParser for per-layer frequency filtering
  const numPoints = Math.max(2, Math.floor(layer.width / 4)) // ~4px per point for smooth curve
  const parsedData = parseAudioData(
    audioData,
    layer.id,
    layer.minFrequency,
    layer.maxFrequency,
    -12, // Default maxDecibels for wave spectrum
    layer.smoothing,
    numPoints
  )

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const startX = -layer.width / 2
  const pointSpacing = layer.width / (parsedData.length - 1)

  ctx.beginPath()
  ctx.moveTo(startX, 0)

  for (let i = 0; i < parsedData.length; i++) {
    const x = startX + i * pointSpacing
    const y = -parsedData[i] * layer.height
    if (i === 0) {
      ctx.lineTo(x, y)
    } else {
      const prevX = startX + (i - 1) * pointSpacing
      const prevY = -(parsedData[i - 1] || 0) * layer.height
      const cpX = (prevX + x) / 2
      ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2)
    }
  }

  if (layer.fill) {
    ctx.lineTo(startX + layer.width, 0)
    ctx.closePath()
    ctx.fillStyle = layer.fillColor
    ctx.fill()
  }

  ctx.strokeStyle = layer.lineColor
  ctx.lineWidth = layer.lineWidth
  ctx.stroke()

  ctx.restore()
}

export default renderWaveSpectrum
