/**
 * Sound Wave 2 Renderer
 *
 * Renders waveform in circular or linear mode with audio reactivity.
 */

import type { SoundWave2Layer, AudioDataArray } from './types'
import { getCompositeOperation } from './types'

export interface SoundWave2RenderOptions {
  ctx: CanvasRenderingContext2D
  layer: SoundWave2Layer
  audioData: AudioDataArray
  centerX: number
  centerY: number
}

/**
 * Render circular or linear sound wave visualization
 */
export function renderSoundWave2({
  ctx,
  layer,
  audioData,
  centerX,
  centerY
}: SoundWave2RenderOptions): void {
  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  if (layer.mode === 'circle') {
    ctx.beginPath()
    for (let i = 0; i < audioData.length; i++) {
      const angle = (i / audioData.length) * Math.PI * 2
      const r = layer.radius + audioData[i] * layer.radius * layer.sensitivity
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
  } else {
    ctx.beginPath()
    const lineWidth = layer.radius * 2
    const startX = -lineWidth / 2
    const pointSpacing = lineWidth / (audioData.length - 1)

    for (let i = 0; i < audioData.length; i++) {
      const x = startX + i * pointSpacing
      const y = -audioData[i] * layer.radius * layer.sensitivity
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
  }

  ctx.strokeStyle = layer.lineColor
  ctx.lineWidth = layer.lineWidth
  ctx.stroke()

  ctx.restore()
}

export default renderSoundWave2
