/**
 * BladeWaveVisualizer - Enhanced Wave Mountain with gradient depth support
 *
 * Creates stacked horizontal waveform lines with multi-color gradient progression,
 * audio-reactive height displacement and advanced color control.
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { BladewaveConfig, DEFAULT_BLADEWAVE_CONFIG } from '../../_generated'

export interface BladeWaveProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  config: BladewaveConfig
  onConfigChange?: (config: Partial<BladewaveConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
  showControls?: boolean
}

// Re-export for backward compatibility
export type BladeWaveConfig = BladewaveConfig
export { DEFAULT_BLADEWAVE_CONFIG }

// Color stop interface for gradient parsing
interface ColorStop {
  color: { r: number; g: number; b: number }
  position: number
}

// Utility to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 255, b: 255 }
}

// Parse gradient string into color stops
// Expected format: "linear-gradient(90deg, rgb(255, 0, 0) 0%, rgb(255, 120, 0) 14%, ...)"
function parseGradient(gradientString: string): ColorStop[] {
  const colorStops: ColorStop[] = []
  
  // Match rgb/hex colors with percentages
  const rgbMatches = gradientString.matchAll(/rgb\((\d+),\s*(\d+),\s*(\d+)\)\s+(\d+(?:\.\d+)?)%/g)
  
  for (const match of rgbMatches) {
    colorStops.push({
      color: {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
      },
      position: parseFloat(match[4]) / 100,
    })
  }

  // Fallback: try hex colors
  if (colorStops.length === 0) {
    const hexMatches = gradientString.matchAll(/#([0-9a-fA-F]{6})\s+(\d+(?:\.\d+)?)%/g)
    for (const match of hexMatches) {
      colorStops.push({
        color: hexToRgb('#' + match[1]),
        position: parseFloat(match[2]) / 100,
      })
    }
  }

  return colorStops.sort((a, b) => a.position - b.position)
}

// Sample color from gradient at position t (0-1)
function sampleGradient(colorStops: ColorStop[], t: number): string {
  if (colorStops.length === 0) {
    return 'rgb(0, 255, 255)'
  }
  if (colorStops.length === 1) {
    const c = colorStops[0].color
    return `rgb(${c.r}, ${c.g}, ${c.b})`
  }

  // Find surrounding color stops
  let startStop = colorStops[0]
  let endStop = colorStops[colorStops.length - 1]

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (t >= colorStops[i].position && t <= colorStops[i + 1].position) {
      startStop = colorStops[i]
      endStop = colorStops[i + 1]
      break
    }
  }

  // Interpolate between stops
  const range = endStop.position - startStop.position
  const localT = range === 0 ? 0 : (t - startStop.position) / range

  const r = Math.round(startStop.color.r + (endStop.color.r - startStop.color.r) * localT)
  const g = Math.round(startStop.color.g + (endStop.color.g - startStop.color.g) * localT)
  const b = Math.round(startStop.color.b + (endStop.color.b - startStop.color.b) * localT)

  return `rgb(${r}, ${g}, ${b})`
}

// Interpolate between two colors (fallback for solid colors)
function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
): string {
  const r = Math.round(color1.r + (color2.r - color1.r) * t)
  const g = Math.round(color1.g + (color2.g - color1.g) * t)
  const b = Math.round(color1.b + (color2.b - color1.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

const BladeWaveVisualizer: React.FC<BladeWaveProps> = ({
  audioData,
  isPlaying,
  config,
  frequencyBands,
  beatData,
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const historyRef = useRef<Float32Array[]>([])
  const timeRef = useRef(0)
  const smoothedDataRef = useRef<Float32Array | null>(null)

  const cfg = useMemo(() => ({ ...DEFAULT_BLADEWAVE_CONFIG, ...config }), [config])

  // Parse depth gradient once when config changes (for depth mode)
  const gradientStops = useMemo(() => {
    if (cfg.useDepthGradient && cfg.depthGradient) {
      return parseGradient(cfg.depthGradient)
    }
    return []
  }, [cfg.useDepthGradient, cfg.depthGradient])

  // Parse primary and secondary gradients (for horizontal gradient mode)
  const primaryGradientStops = useMemo(() => {
    if (!cfg.useDepthGradient && cfg.primaryColor) {
      return parseGradient(cfg.primaryColor)
    }
    return []
  }, [cfg.useDepthGradient, cfg.primaryColor])

  const secondaryGradientStops = useMemo(() => {
    if (!cfg.useDepthGradient && cfg.secondaryColor) {
      return parseGradient(cfg.secondaryColor)
    }
    return []
  }, [cfg.useDepthGradient, cfg.secondaryColor])

  // Initialize history buffer
  useEffect(() => {
    historyRef.current = Array(cfg.lineCount)
      .fill(null)
      .map(() => new Float32Array(cfg.pointsPerLine).fill(0))
  }, [cfg.lineCount, cfg.pointsPerLine])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Apply trail fade effect (semi-transparent background)
    ctx.fillStyle = cfg.backgroundColor
    ctx.globalAlpha = cfg.trailFade > 0 ? cfg.trailFade : 1
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1

    // Process audio data
    const dataArray = audioData
    const dataLength = dataArray.length || 1

    // Resample to pointsPerLine
    const currentLine = new Float32Array(cfg.pointsPerLine)
    for (let i = 0; i < cfg.pointsPerLine; i++) {
      const dataIndex = Math.floor((i / cfg.pointsPerLine) * dataLength)
      let value = dataArray[dataIndex] || 0

      // Apply frequency-based multipliers
      const freqRatio = i / cfg.pointsPerLine
      if (freqRatio < 0.15) {
        value *= cfg.bassMultiplier
      } else if (freqRatio < 0.5) {
        value *= cfg.midMultiplier
      } else {
        value *= cfg.highMultiplier
      }

      value *= cfg.audioSensitivity
      currentLine[i] = value
    }

    // Smooth current line with previous
    if (!smoothedDataRef.current) {
      smoothedDataRef.current = new Float32Array(cfg.pointsPerLine)
    }
    for (let i = 0; i < cfg.pointsPerLine; i++) {
      smoothedDataRef.current[i] =
        smoothedDataRef.current[i] * cfg.smoothing +
        currentLine[i] * (1 - cfg.smoothing)
    }

    // Shift history and add new line
    if (historyRef.current.length > 0) {
      for (let i = historyRef.current.length - 1; i > 0; i--) {
        historyRef.current[i] = historyRef.current[i - 1]
      }
      historyRef.current[0] = smoothedDataRef.current.slice()
    }

    // Colors (for fallback)
    const primaryRgb = hexToRgb(cfg.primaryColor)
    const secondaryRgb = hexToRgb(cfg.secondaryColor)

    // Calculate center and base positions
    const centerX = width / 2
    const baseY = height * 0.85

    // Time for animation
    timeRef.current += 0.016 * cfg.rotationSpeed

    // Draw lines from back to front (for proper depth ordering)
    for (let lineIndex = cfg.lineCount - 1; lineIndex >= 0; lineIndex--) {
      const lineData = historyRef.current[lineIndex]
      if (!lineData) continue

      // Calculate depth factor (0 at front, 1 at back)
      const depthFactor = lineIndex / cfg.lineCount

      // Perspective calculations
      const perspectiveScale = cfg.perspective3D
        ? 1 - depthFactor * cfg.perspectiveStrength
        : 1
      const yOffset = baseY - lineIndex * cfg.lineSpacing * perspectiveScale

      // Skip if off screen
      if (yOffset < 0) continue

      // Calculate line alpha (fade with distance)
      const alpha = Math.max(0.1, 1 - depthFactor * 0.8)

      // Draw the wave line
      const lineWidth = width * perspectiveScale * 0.9
      const startX = centerX - lineWidth / 2

      // Mode 1: Depth gradient mode - single color per line
      if (cfg.useDepthGradient && gradientStops.length > 0) {
        const lineColor = sampleGradient(gradientStops, depthFactor)
        ctx.beginPath()
        ctx.strokeStyle = lineColor
        ctx.lineWidth = cfg.lineWidth * perspectiveScale
        ctx.globalAlpha = alpha

        for (let i = 0; i < cfg.pointsPerLine; i++) {
          const x = startX + (i / (cfg.pointsPerLine - 1)) * lineWidth
          const amplitude = lineData[i] * cfg.waveHeight * perspectiveScale
          const beatPulse = beatData?.isBeat ? 1 + beatData.beatIntensity * 0.3 : 1
          const y = yOffset - amplitude * beatPulse

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }
      // Mode 2: Horizontal gradient mode - each point samples from horizontal gradients
      else {
        ctx.lineWidth = cfg.lineWidth * perspectiveScale
        ctx.globalAlpha = alpha

        for (let i = 0; i < cfg.pointsPerLine; i++) {
          const x = startX + (i / (cfg.pointsPerLine - 1)) * lineWidth
          const amplitude = lineData[i] * cfg.waveHeight * perspectiveScale
          const beatPulse = beatData?.isBeat ? 1 + beatData.beatIntensity * 0.3 : 1
          const y = yOffset - amplitude * beatPulse

          // Calculate horizontal position factor (0 = left, 1 = right)
          const xFactor = i / (cfg.pointsPerLine - 1)

          // Sample both gradients at horizontal position (or use solid colors)
          const primaryColor =
            primaryGradientStops.length > 0
              ? sampleGradient(primaryGradientStops, xFactor)
              : `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`

          const secondaryColor =
            secondaryGradientStops.length > 0
              ? sampleGradient(secondaryGradientStops, xFactor)
              : `rgb(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b})`

          // Parse sampled colors and interpolate by depth
          const parseRgb = (colorStr: string) => {
            const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
            return match
              ? { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
              : primaryRgb
          }

          const primaryRgbSampled = parseRgb(primaryColor)
          const secondaryRgbSampled = parseRgb(secondaryColor)
          const pointColor = lerpColor(primaryRgbSampled, secondaryRgbSampled, depthFactor)

          // Draw tiny segment with this color
          ctx.beginPath()
          ctx.strokeStyle = pointColor
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            const prevX = startX + ((i - 1) / (cfg.pointsPerLine - 1)) * lineWidth
            const prevAmplitude = lineData[i - 1] * cfg.waveHeight * perspectiveScale
            const prevY = yOffset - prevAmplitude * beatPulse
            ctx.moveTo(prevX, prevY)
            ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
      }
    }

    ctx.globalAlpha = 1

    // Continue animation
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render)
    }
  }, [audioData, isPlaying, cfg, beatData, gradientStops, primaryGradientStops, secondaryGradientStops])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render)
    } else {
      cancelAnimationFrame(animationRef.current)
    }
    return () => cancelAnimationFrame(animationRef.current)
  }, [isPlaying, render])

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: cfg.backgroundColor,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Overlay Controls */}
      {showControls && (
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: 'rgba(0,0,0,0.7)',
          p: 2,
          borderRadius: 1,
          minWidth: 200,
        }}
      >
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
          Blade Wave
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
            Lines: {cfg.lineCount}
          </Typography>
          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
            Height: {cfg.waveHeight}
          </Typography>
          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
            Sensitivity: {cfg.audioSensitivity.toFixed(1)}
          </Typography>
          {gradientStops.length > 0 && (
            <Typography variant="caption" sx={{ color: '#0ff', display: 'block' }}>
              Colors: {gradientStops.length}
            </Typography>
          )}
        </Box>
      </Box>
      )}
    </Box>
  )
}

export default BladeWaveVisualizer
