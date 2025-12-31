/**
 * Image Renderer
 *
 * Renders image layers with caching support.
 */

import type { ImageLayer, ImageCache } from './types'
import { getCompositeOperation } from './types'

export interface ImageRenderOptions {
  ctx: CanvasRenderingContext2D
  layer: ImageLayer
  centerX: number
  centerY: number
  imageCache: ImageCache
}

/**
 * Render image layer
 */
export function renderImage({
  ctx,
  layer,
  centerX,
  centerY,
  imageCache
}: ImageRenderOptions): void {
  const source = layer.imageData || layer.imageUrl
  if (!source) return

  let img = imageCache.get(source)
  if (!img) {
    img = new Image()
    img.src = source
    // Handle cross-origin images for canvas
    if (source.startsWith('http')) {
      img.crossOrigin = 'Anonymous'
    }
    imageCache.set(source, img)
    return // Wait for load
  }

  if (!img.complete) return

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const drawWidth = layer.width || img.naturalWidth
  const drawHeight = layer.height || img.naturalHeight

  ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

  ctx.restore()
}

export default renderImage
