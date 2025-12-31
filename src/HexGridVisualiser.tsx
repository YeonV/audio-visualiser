/**
 * HexGridVisualiser - Audio-reactive hexagonal honeycomb grid
 *
 * Creates a grid of hexagons that pulse and glow with audio,
 * with ripple effects emanating from the center.
 */

import React, { useRef, useEffect, useCallback } from 'react'
import { Box, Typography } from '@mui/material'

export interface HexGridConfig {
  hexSize: number
  gridRadius: number
  strokeWidth: number
  glowIntensity: number
  rippleSpeed: number
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  audioSensitivity: number
  bassMultiplier: number
  midMultiplier: number
  highMultiplier: number
  rotationSpeed: number
  pulseOnBeat: boolean
  fillHexagons: boolean
  perspectiveDepth: number
}

export interface HexGridProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  config: HexGridConfig
  onConfigChange?: (config: Partial<HexGridConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}

export const DEFAULT_HEXGRID_CONFIG: HexGridConfig = {
  hexSize: 30,
  gridRadius: 12,
  strokeWidth: 1.5,
  glowIntensity: 15,
  rippleSpeed: 2,
  primaryColor: '#00ffff',
  secondaryColor: '#ff00ff',
  backgroundColor: '#1a1a2e',
  audioSensitivity: 1.2,
  bassMultiplier: 2.0,
  midMultiplier: 1.0,
  highMultiplier: 0.6,
  rotationSpeed: 0.1,
  pulseOnBeat: true,
  fillHexagons: false,
  perspectiveDepth: 0.3,
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      }
    : { r: 0, g: 255, b: 255 }
}

function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * t),
    g: Math.round(color1.g + (color2.g - color1.g) * t),
    b: Math.round(color1.b + (color2.b - color1.b) * t),
  }
}

// Hexagon grid utilities
function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r)
  const y = size * ((3 / 2) * r)
  return { x, y }
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number = 0
) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + rotation
    const hx = x + size * Math.cos(angle)
    const hy = y + size * Math.sin(angle)
    if (i === 0) {
      ctx.moveTo(hx, hy)
    } else {
      ctx.lineTo(hx, hy)
    }
  }
  ctx.closePath()
}

const HexGridVisualiser: React.FC<HexGridProps> = ({
  audioData,
  isPlaying,
  config,
  frequencyBands,
  beatData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)
  const rippleTimeRef = useRef(0)
  const smoothedBandsRef = useRef({ bass: 0, mid: 0, high: 0 })

  const cfg = { ...DEFAULT_HEXGRID_CONFIG, ...config }

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    // Clear canvas
    ctx.fillStyle = cfg.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Update time
    timeRef.current += 0.016
    rippleTimeRef.current += 0.016 * cfg.rippleSpeed

    // Process audio data
    const dataArray = Array.isArray(audioData) ? audioData : Array.from(audioData)
    const dataLen = dataArray.length || 1

    // Calculate frequency bands if not provided
    let bass = frequencyBands?.bass ?? 0
    let mid = frequencyBands?.mid ?? 0
    let high = frequencyBands?.high ?? 0

    if (!frequencyBands && dataLen > 0) {
      const bassEnd = Math.floor(dataLen * 0.1)
      const midEnd = Math.floor(dataLen * 0.5)
      let bassSum = 0, midSum = 0, highSum = 0
      for (let i = 0; i < dataLen; i++) {
        if (i < bassEnd) bassSum += dataArray[i]
        else if (i < midEnd) midSum += dataArray[i]
        else highSum += dataArray[i]
      }
      bass = bassEnd > 0 ? bassSum / bassEnd : 0
      mid = midEnd - bassEnd > 0 ? midSum / (midEnd - bassEnd) : 0
      high = dataLen - midEnd > 0 ? highSum / (dataLen - midEnd) : 0
    }

    // Smooth the bands
    smoothedBandsRef.current.bass += (bass - smoothedBandsRef.current.bass) * 0.15
    smoothedBandsRef.current.mid += (mid - smoothedBandsRef.current.mid) * 0.15
    smoothedBandsRef.current.high += (high - smoothedBandsRef.current.high) * 0.15

    const smoothBass = smoothedBandsRef.current.bass * cfg.bassMultiplier * cfg.audioSensitivity
    const smoothMid = smoothedBandsRef.current.mid * cfg.midMultiplier * cfg.audioSensitivity
    const smoothHigh = smoothedBandsRef.current.high * cfg.highMultiplier * cfg.audioSensitivity

    // Beat pulse
    const beatPulse = cfg.pulseOnBeat && beatData?.isBeat ? 1 + beatData.beatIntensity * 0.5 : 1

    // Colors
    const primaryRgb = hexToRgb(cfg.primaryColor)
    const secondaryRgb = hexToRgb(cfg.secondaryColor)

    // Rotation
    const rotation = timeRef.current * cfg.rotationSpeed

    // Generate hexagon grid using axial coordinates
    const hexagons: Array<{ q: number; r: number; dist: number }> = []
    const maxDist = cfg.gridRadius

    for (let q = -cfg.gridRadius; q <= cfg.gridRadius; q++) {
      for (let r = -cfg.gridRadius; r <= cfg.gridRadius; r++) {
        const s = -q - r
        if (Math.abs(s) <= cfg.gridRadius) {
          const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s))
          hexagons.push({ q, r, dist })
        }
      }
    }

    // Sort by distance for proper drawing order (back to front)
    hexagons.sort((a, b) => b.dist - a.dist)

    // Draw hexagons
    for (const hex of hexagons) {
      const { q, r, dist } = hex
      const pixel = hexToPixel(q, r, cfg.hexSize)
      const x = centerX + pixel.x
      const y = centerY + pixel.y

      // Calculate audio influence based on distance
      const distRatio = dist / maxDist
      const ripplePhase = (rippleTimeRef.current - dist * 0.15) % 1

      // Mix audio bands based on distance from center
      let audioValue = 0
      if (distRatio < 0.33) {
        audioValue = smoothBass * (1 - distRatio * 3) + smoothMid * (distRatio * 3)
      } else if (distRatio < 0.66) {
        const t = (distRatio - 0.33) * 3
        audioValue = smoothMid * (1 - t) + smoothHigh * t
      } else {
        audioValue = smoothHigh * (1 - (distRatio - 0.66) * 3)
      }

      // Ripple effect
      const ripple = Math.sin(ripplePhase * Math.PI * 2) * 0.5 + 0.5

      // Calculate intensity
      const intensity = Math.min(1, audioValue * (0.3 + ripple * 0.7)) * beatPulse

      // Color based on distance and audio
      const colorT = distRatio + audioValue * 0.3
      const hexColor = lerpColor(primaryRgb, secondaryRgb, Math.min(1, colorT))

      // Calculate size with audio reaction
      const sizeMultiplier = 1 + intensity * 0.3

      // Alpha based on distance
      const alpha = Math.max(0.2, 1 - distRatio * 0.6) * (0.5 + intensity * 0.5)

      // Draw the hexagon
      const hexSizeScaled = cfg.hexSize * 0.9 * sizeMultiplier

      // Glow effect for center hexagons
      if (dist < maxDist * 0.5 && intensity > 0.3) {
        ctx.shadowColor = `rgb(${hexColor.r}, ${hexColor.g}, ${hexColor.b})`
        ctx.shadowBlur = cfg.glowIntensity * intensity
      } else {
        ctx.shadowBlur = 0
      }

      drawHexagon(ctx, x, y, hexSizeScaled, rotation)

      if (cfg.fillHexagons && intensity > 0.4) {
        ctx.fillStyle = `rgba(${hexColor.r}, ${hexColor.g}, ${hexColor.b}, ${alpha * 0.3})`
        ctx.fill()
      }

      ctx.strokeStyle = `rgba(${hexColor.r}, ${hexColor.g}, ${hexColor.b}, ${alpha})`
      ctx.lineWidth = cfg.strokeWidth * (1 + intensity * 0.5)
      ctx.stroke()
    }

    ctx.shadowBlur = 0

    // Draw center glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cfg.hexSize * 2)
    gradient.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${0.5 * smoothBass})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, cfg.hexSize * 3, 0, Math.PI * 2)
    ctx.fill()

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render)
    }
  }, [audioData, isPlaying, cfg, frequencyBands, beatData])

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
    </Box>
  )
}

export default HexGridVisualiser
