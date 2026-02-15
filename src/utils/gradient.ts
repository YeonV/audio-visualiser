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
  // Create a small offscreen canvas to render the gradient
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = 1
  const ctx = canvas.getContext('2d')

  if (!ctx) return new Uint8Array(size * 4)

  try {
    if (gradientStr.includes('linear-gradient')) {
      const stops = parseColorStops(gradientStr)
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
        ctx.fillStyle = '#000'
      }
    } else {
      // Basic fallback for solid colors
      ctx.fillStyle = gradientStr
    }

    ctx.clearRect(0, 0, size, 1)
    ctx.fillRect(0, 0, size, 1)

    const imageData = ctx.getImageData(0, 0, size, 1)
    return new Uint8Array(imageData.data)
  } catch (e) {
    console.error('Failed to parse gradient:', gradientStr, e)
    // Fallback: simple primary to secondary gradient if parsing fails
    const fallback = new Uint8Array(size * 4)
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1)
      fallback[i * 4] = 255 * (1 - t) // R
      fallback[i * 4 + 1] = 0 // G
      fallback[i * 4 + 2] = 255 * t // B
      fallback[i * 4 + 3] = 255 // A
    }
    return fallback
  }
}

interface ColorStop {
  color: string
  pos: number
}

/**
 * Basic manual parser for "linear-gradient(90deg, color1 pos1, color2 pos2, ...)"
 * Handles rgb(), rgba(), hex, and named colors.
 */
function parseColorStops(gradientStr: string): ColorStop[] {
  const stops: ColorStop[] = []

  // Extract the part between the first ( and the last )
  const firstParen = gradientStr.indexOf('(')
  const lastParen = gradientStr.lastIndexOf(')')
  if (firstParen === -1 || lastParen === -1) return stops

  const inner = gradientStr.substring(firstParen + 1, lastParen)

  // Split by comma, but ignore commas inside parentheses (like rgb(0,0,0))
  const parts = splitIgnoringParentheses(inner)

  // Skip the first part if it's an angle like 90deg
  let startIndex = 0
  if (parts.length > 0) {
    const firstPart = parts[0].trim()
    if (firstPart.includes('deg') || firstPart.startsWith('to ')) {
      startIndex = 1
    }
  }

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part) continue

    // A part looks like "rgb(255, 0, 0) 0%" or "#ff0000 50%"
    // Match the color part and the optional percentage
    // Using a more robust match that handles various color formats
    const match = part.match(/(.*)\s+(\d+)%/)
    if (match) {
      stops.push({
        color: match[1].trim(),
        pos: Math.max(0, Math.min(1, parseInt(match[2], 10) / 100))
      })
    } else {
      // If no percentage, space them out evenly
      const count = parts.length - startIndex
      const idx = i - startIndex
      stops.push({
        color: part,
        pos: count > 1 ? idx / (count - 1) : 0
      })
    }
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
    if (char === ')') depth--

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
