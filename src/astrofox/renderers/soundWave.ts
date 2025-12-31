/**
 * Sound Wave Renderer
 *
 * Renders time-domain waveform as a horizontal oscillating line (like Astrofox SoundWave).
 */

import type { SoundWaveLayer, AudioDataArray } from './types'
import { getCompositeOperation } from './types'

export interface SoundWaveRenderOptions {
  ctx: CanvasRenderingContext2D
  layer: SoundWaveLayer
  audioData: AudioDataArray
  centerX: number
  centerY: number
}

/**
 * Render horizontal sound wave visualization
 */
export function renderSoundWave({
  ctx,
  layer,
  audioData,
  centerX,
  centerY
}: SoundWaveRenderOptions): void {
  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const startX = -layer.width / 2
  const step = Math.max(1, Math.floor(audioData.length * layer.wavelength * 0.25))
  const sampledData: number[] = []
  for (let i = 0; i < audioData.length; i += step) {
    sampledData.push(audioData[i])
  }

  // Apply smoothing
  const smoothedData = sampledData.map((val, i) => {
    if (i === 0 || i === sampledData.length - 1) return val
    const prev = sampledData[i - 1]
    const next = sampledData[i + 1]
    return prev * layer.smooth * 0.25 + val * (1 - layer.smooth * 0.5) + next * layer.smooth * 0.25
  })

  const pointSpacing = layer.width / (smoothedData.length - 1 || 1)

  ctx.beginPath()

  for (let i = 0; i < smoothedData.length; i++) {
    const x = startX + i * pointSpacing
    const amplitude = (smoothedData[i] - 0.5) * 2 // Center around 0
    const y = amplitude * layer.height * 0.5

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  if (layer.useFill) {
    ctx.lineTo(startX + layer.width, 0)
    ctx.lineTo(startX, 0)
    ctx.closePath()
    ctx.fillStyle = layer.fillColor
    ctx.fill()
  }

  ctx.strokeStyle = layer.color
  ctx.lineWidth = layer.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  ctx.restore()
}

export default renderSoundWave
