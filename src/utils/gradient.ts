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
    const cleanStr = gradientStr.trim().replace(/;$/, '')

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
    } else {
      // Solid color
      ctx.fillStyle = cleanStr || '#000'
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
    const firstPart = parts[0].trim()
    // Skip orientation/angle
    if (firstPart.includes('deg') || firstPart.startsWith('to ') || /^\d+$/.test(firstPart)) {
      startIndex = 1
    }
  }

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part) continue

    // Match color and optional position (percentage or decimal)
    // Matches: "rgb(0,0,0) 10%", "#fff 0.5", "red", "rgba(0,0,0,0) 100%"
    const match = part.match(/^(.*?)(\s+[\d.]+%?)?$/)
    if (match) {
      const color = match[1].trim()
      let posStr = match[2] ? match[2].trim() : null

      let pos: number
      if (posStr) {
        if (posStr.endsWith('%')) {
          pos = parseFloat(posStr) / 100
        } else {
          pos = parseFloat(posStr)
        }
      } else {
        const count = parts.length - startIndex
        const idx = i - startIndex
        pos = count > 1 ? idx / (count - 1) : 0
      }

      stops.push({
        color,
        pos: Math.max(0, Math.min(1, isNaN(pos) ? 0 : pos))
      })
    }
  }

  // Ensure stops are sorted by position
  stops.sort((a, b) => a.pos - b.pos)

  // Fix cases where multiple stops have same position or are out of order
  if (stops.length > 0) {
    if (stops[0].pos > 0) stops.unshift({ color: stops[0].color, pos: 0 })
    if (stops[stops.length - 1].pos < 1) stops.push({ color: stops[stops.length - 1].color, pos: 1 })
  }

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
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts
}
