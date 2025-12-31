/**
 * Text Renderer
 *
 * Renders text with optional audio-reactive scaling.
 */

import type { TextLayer, AudioDataArray } from './types'
import { getCompositeOperation } from './types'

export interface TextRenderOptions {
  ctx: CanvasRenderingContext2D
  layer: TextLayer
  audioData: AudioDataArray
  centerX: number
  centerY: number
}

/**
 * Render text layer with audio reactivity
 */
export function renderText({
  ctx,
  layer,
  audioData,
  centerX,
  centerY
}: TextRenderOptions): void {
  let sum = 0
  for (let i = 0; i < audioData.length; i++) sum += audioData[i]
  const avgAmplitude = audioData.length > 0 ? sum / audioData.length : 0
  const reactiveScale = layer.audioReactive ? 1 + avgAmplitude * layer.reactiveScale : 1

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale * reactiveScale, layer.scale * reactiveScale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const fontStyle = layer.italic ? 'italic ' : ''
  const fontWeight = layer.bold ? 'bold ' : ''
  ctx.font = `${fontStyle}${fontWeight}${layer.fontSize}px "${layer.font}"`
  ctx.fillStyle = layer.color
  ctx.textAlign = layer.textAlign
  ctx.textBaseline = 'middle'

  ctx.fillText(layer.text, 0, 0)

  ctx.restore()
}

export default renderText
