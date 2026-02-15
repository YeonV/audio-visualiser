/**
 * Gradient Utilities
 *
 * Helpers for parsing CSS gradient strings and converting them to WebGL-compatible formats.
 */

/**
 * Parses a LedFx-style CSS linear-gradient string into a Uint8Array of RGBA values.
 * Uses a canvas for robust parsing of various CSS color formats.
 */
export function parseGradient(gradientStr: string, size: number = 256): Uint8Array {
  // Fallback gradient data (Rainbow-ish)
  const createFallback = () => {
    const data = new Uint8Array(size * 4)
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1)
      data[i * 4] = Math.sin(t * Math.PI) * 255     // R
      data[i * 4 + 1] = Math.sin((t + 0.33) * Math.PI) * 255 // G
      data[i * 4 + 2] = Math.sin((t + 0.66) * Math.PI) * 255 // B
      data[i * 4 + 3] = 255 // A
    }
    return data
  }

  if (typeof document === 'undefined') return createFallback()

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  if (!ctx) return createFallback()

  try {
    // Basic cleanup: remove semicolon, trim
    const cleanStr = gradientStr.trim().replace(/;+$/, '').trim()

    if (cleanStr.includes('linear-gradient')) {
      const stops = parseColorStops(cleanStr)
      if (stops.length > 0) {
        const gradient = ctx.createLinearGradient(0, 0, size, 0)

        stops.forEach(stop => {
          try {
            gradient.addColorStop(stop.pos, stop.color)
          } catch (e) {
            console.warn('Invalid color stop:', stop, e)
          }
        })

        ctx.fillStyle = gradient
      } else {
        ctx.fillStyle = '#f0f' // Magenta for "missing"
      }
    } else if (cleanStr) {
      // Solid color or other CSS color format
      ctx.fillStyle = cleanStr
    } else {
      ctx.fillStyle = '#000'
    }

    ctx.clearRect(0, 0, size, 1)
    ctx.fillRect(0, 0, size, 1)

    const imageData = ctx.getImageData(0, 0, size, 1)
    return new Uint8Array(imageData.data)
  } catch (e) {
    console.error('Failed to parse gradient:', gradientStr, e)
    return createFallback()
  }
}

interface ColorStop {
  color: string
  pos: number
}

/**
 * Robust parser for "linear-gradient(angle, color1 pos1, color2 pos2, ...)"
 */
function parseColorStops(gradientStr: string): ColorStop[] {
  const stops: ColorStop[] = []

  const firstParen = gradientStr.indexOf('(')
  const lastParen = gradientStr.lastIndexOf(')')
  if (firstParen === -1 || lastParen === -1) return stops

  const inner = gradientStr.substring(firstParen + 1, lastParen)
  const parts = splitIgnoringParentheses(inner)

  let startIndex = 0
  if (parts.length > 0) {
    const firstPart = parts[0].trim().toLowerCase()
    // Skip orientation/angle
    // Handles: "90deg", "to right", "0.25turn", "1.5rad", or pure numbers
    if (
      firstPart.includes('deg') ||
      firstPart.includes('turn') ||
      firstPart.includes('rad') ||
      firstPart.startsWith('to ') ||
      /^-?[\d.]+$/.test(firstPart)
    ) {
      startIndex = 1
    }
  }

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part) continue

    // Match color and optional position
    // We look for the last space that isn't inside parentheses
    const spaceIdx = lastIndexOfIgnoringParentheses(part, ' ')

    let color: string
    let pos: number | null = null

    if (spaceIdx !== -1) {
      const maybeColor = part.substring(0, spaceIdx).trim()
      const maybePos = part.substring(spaceIdx + 1).trim()

      if (maybePos.endsWith('%') || /^-?[\d.]+$/.test(maybePos)) {
        color = maybeColor
        pos = maybePos.endsWith('%') ? parseFloat(maybePos) / 100 : parseFloat(maybePos)
      } else {
        color = part
      }
    } else {
      color = part
    }

    if (color) {
      stops.push({
        color,
        pos: pos !== null ? Math.max(0, Math.min(1, pos)) : -1 // -1 means distribute later
      })
    }
  }

  // Distribute stops without explicit positions
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].pos === -1) {
      if (i === 0) stops[i].pos = 0
      else if (i === stops.length - 1) stops[i].pos = 1
      else {
        // Find next stop with position
        let nextWithPos = -1
        for (let j = i + 1; j < stops.length; j++) {
          if (stops[j].pos !== -1) {
            nextWithPos = j
            break
          }
        }

        const prevPos = stops[i - 1].pos
        if (nextWithPos !== -1) {
          const nextPos = stops[nextWithPos].pos
          const count = nextWithPos - (i - 1)
          stops[i].pos = prevPos + (nextPos - prevPos) / count
        } else {
          // No more stops with positions, space out until the end
          const count = stops.length - i
          stops[i].pos = prevPos + (1 - prevPos) / count
        }
      }
    }
  }

  // Final sort just in case
  stops.sort((a, b) => a.pos - b.pos)

  return stops
}

function splitIgnoringParentheses(str: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '(') depth++
    else if (char === ')') depth--

    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function lastIndexOfIgnoringParentheses(str: string, char: string): number {
  let depth = 0
  for (let i = str.length - 1; i >= 0; i--) {
    const c = str[i]
    if (c === ')') depth++
    else if (c === '(') depth--

    if (c === char && depth === 0) return i
  }
  return -1
}
