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

  // CSS linear-gradient strings might not be directly valid for fillStyle
  // We need to either parse it manually or use a trick.
  // The trick: create a temporary div, apply the background, and use its style.
  // BUT: a better way is to parse the string for color stops and use ctx.createLinearGradient.

  try {
    const stops = parseColorStops(gradientStr)
    const gradient = ctx.createLinearGradient(0, 0, size, 0)

    stops.forEach(stop => {
      gradient.addColorStop(stop.pos, stop.color)
    })

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, 1)

    return new Uint8Array(ctx.getImageData(0, 0, size, 1).data.buffer)
  } catch (e) {
    console.error('Failed to parse gradient:', gradientStr, e)
    // Fallback: simple primary to secondary gradient if parsing fails
    return new Uint8Array(size * 4).fill(255)
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
  const inner = gradientStr.match(/\((.*)\)$/)?.[1]
  if (!inner) return stops

  // Split by comma, but ignore commas inside parentheses (like rgb(0,0,0))
  const parts = splitIgnoringParentheses(inner)

  // Skip the first part if it's an angle like 90deg
  let startIndex = 0
  if (parts[0].includes('deg') || parts[0].includes('to ')) {
    startIndex = 1
  }

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i].trim()
    // A part looks like "rgb(255, 0, 0) 0%" or "#ff0000 50%"
    // Match the color part and the optional percentage
    const match = part.match(/(.*)\s+(\d+)%/)
    if (match) {
      stops.push({
        color: match[1].trim(),
        pos: parseInt(match[2]) / 100
      })
    } else {
      // If no percentage, space them out evenly (simplified)
      stops.push({
        color: part,
        pos: (i - startIndex) / (parts.length - startIndex - 1)
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
