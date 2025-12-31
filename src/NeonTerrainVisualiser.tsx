/**
 * NeonTerrainVisualiser - Synthwave wireframe terrain with frequency-mapped visuals
 *
 * Bass = Terrain height/displacement (mountains)
 * Mids = Warm colors (orange/yellow glow)
 * Highs = Cool colors (cyan/blue) + sparkle effects
 */

import React, { useRef, useEffect, useCallback } from 'react'
import { Box, Typography } from '@mui/material'

export interface NeonTerrainConfig {
  gridWidth: number
  gridDepth: number
  cellSize: number
  terrainHeight: number
  scrollSpeed: number
  perspectiveStrength: number
  horizonY: number
  lineWidth: number
  glowIntensity: number
  bassColor: string      // Warm - affected by bass
  midColor: string       // Mid warmth
  highColor: string      // Cool - affected by highs
  sunColor: string
  backgroundColor: string
  audioSensitivity: number
  bassMultiplier: number
  midMultiplier: number
  highMultiplier: number
  showSun: boolean
  showStars: boolean
  trailFade: number
}

export interface NeonTerrainProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  config: NeonTerrainConfig
  onConfigChange?: (config: Partial<NeonTerrainConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}

export const DEFAULT_NEONTERRAIN_CONFIG: NeonTerrainConfig = {
  gridWidth: 30,
  gridDepth: 40,
  cellSize: 40,
  terrainHeight: 150,
  scrollSpeed: 1.5,
  perspectiveStrength: 0.8,
  horizonY: 0.35,
  lineWidth: 1.5,
  glowIntensity: 15,
  bassColor: '#ff0066',      // Hot pink/red for bass
  midColor: '#ff6600',       // Orange for mids
  highColor: '#00ffff',      // Cyan for highs
  sunColor: '#ff00ff',       // Magenta sun
  backgroundColor: '#0a0010',
  audioSensitivity: 1.5,
  bassMultiplier: 2.5,
  midMultiplier: 1.5,
  highMultiplier: 1.0,
  showSun: true,
  showStars: true,
  trailFade: 0.15,
}

interface Star {
  x: number
  y: number
  size: number
  brightness: number
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      }
    : { r: 255, g: 0, b: 102 }
}

function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  }
}

// Simple noise for terrain
function terrainNoise(x: number, z: number, t: number): number {
  const n1 = Math.sin(x * 0.1 + t * 0.5) * Math.cos(z * 0.15 + t * 0.3)
  const n2 = Math.sin(x * 0.2 - t * 0.2) * Math.sin(z * 0.1 + t * 0.4)
  const n3 = Math.cos((x + z) * 0.08 + t * 0.6) * 0.5
  return (n1 + n2 * 0.5 + n3) / 2
}

const NeonTerrainVisualiser: React.FC<NeonTerrainProps> = ({
  audioData,
  isPlaying,
  config,
  frequencyBands,
  beatData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)
  const scrollOffsetRef = useRef(0)
  const starsRef = useRef<Star[]>([])
  const smoothedBandsRef = useRef({ bass: 0, mid: 0, high: 0 })

  const cfg = { ...DEFAULT_NEONTERRAIN_CONFIG, ...config }

  // Initialize stars
  useEffect(() => {
    const stars: Star[] = []
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * cfg.horizonY,
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7,
      })
    }
    starsRef.current = stars
  }, [cfg.horizonY])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const horizonY = height * cfg.horizonY

    // Trail fade
    ctx.fillStyle = cfg.backgroundColor
    ctx.globalAlpha = cfg.trailFade
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1

    // Update time
    timeRef.current += 0.016
    scrollOffsetRef.current += 0.016 * cfg.scrollSpeed

    // Process audio data
    const dataArray = Array.isArray(audioData) ? audioData : Array.from(audioData)
    const dataLen = dataArray.length || 1

    // Calculate frequency bands
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
    smoothedBandsRef.current.bass += (bass - smoothedBandsRef.current.bass) * 0.12
    smoothedBandsRef.current.mid += (mid - smoothedBandsRef.current.mid) * 0.12
    smoothedBandsRef.current.high += (high - smoothedBandsRef.current.high) * 0.12

    const smoothBass = smoothedBandsRef.current.bass * cfg.bassMultiplier * cfg.audioSensitivity
    const smoothMid = smoothedBandsRef.current.mid * cfg.midMultiplier * cfg.audioSensitivity
    const smoothHigh = smoothedBandsRef.current.high * cfg.highMultiplier * cfg.audioSensitivity

    // Beat pulse
    const beatPulse = beatData?.isBeat ? 1 + beatData.beatIntensity * 0.5 : 1

    // Colors
    const bassRgb = hexToRgb(cfg.bassColor)
    const midRgb = hexToRgb(cfg.midColor)
    const highRgb = hexToRgb(cfg.highColor)
    const sunRgb = hexToRgb(cfg.sunColor)

    // Draw stars
    if (cfg.showStars) {
      for (const star of starsRef.current) {
        const twinkle = Math.sin(timeRef.current * 2 + star.x * 100) * 0.3 + 0.7
        const alpha = star.brightness * twinkle * (0.5 + smoothHigh * 0.5)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw sun
    if (cfg.showSun) {
      const sunX = width / 2
      const sunY = horizonY
      const sunRadius = 60 + smoothBass * 30 * beatPulse

      // Sun glow
      const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3)
      sunGradient.addColorStop(0, `rgba(${sunRgb.r}, ${sunRgb.g}, ${sunRgb.b}, ${0.8 + smoothMid * 0.2})`)
      sunGradient.addColorStop(0.3, `rgba(${sunRgb.r}, ${sunRgb.g}, ${sunRgb.b}, 0.3)`)
      sunGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = sunGradient
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunRadius * 3, 0, Math.PI * 2)
      ctx.fill()

      // Sun body with horizontal lines
      ctx.fillStyle = `rgba(${sunRgb.r}, ${sunRgb.g}, ${sunRgb.b}, 1)`
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
      ctx.fill()

      // Horizontal bands on sun
      ctx.fillStyle = cfg.backgroundColor
      for (let i = 0; i < 5; i++) {
        const bandY = sunY - sunRadius + (i + 1) * (sunRadius * 2) / 6
        const bandHeight = 3 + i * 2
        const bandWidth = Math.sqrt(sunRadius * sunRadius - Math.pow(bandY - sunY, 2)) * 2
        if (bandWidth > 0) {
          ctx.fillRect(sunX - bandWidth / 2, bandY, bandWidth, bandHeight)
        }
      }
    }

    // Draw horizontal line at horizon
    const horizonColor = lerpColor(bassRgb, highRgb, smoothHigh)
    ctx.strokeStyle = `rgba(${horizonColor.r}, ${horizonColor.g}, ${horizonColor.b}, 0.8)`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, horizonY)
    ctx.lineTo(width, horizonY)
    ctx.stroke()

    // Generate terrain grid
    const centerX = width / 2

    // Project 3D point to 2D
    const project = (x: number, z: number, y: number): { x: number; y: number; scale: number } | null => {
      if (z <= 0) return null
      const scale = cfg.perspectiveStrength * 500 / z
      const screenX = centerX + x * scale
      const screenY = horizonY + (y + z * 0.3) * scale * 0.5
      return { x: screenX, y: screenY, scale }
    }

    // Draw grid lines (from back to front for proper depth)
    ctx.lineWidth = cfg.lineWidth

    // Calculate color based on frequencies
    const terrainColor = lerpColor(
      lerpColor(bassRgb, midRgb, 0.5 + smoothMid * 0.5),
      highRgb,
      smoothHigh * 0.5
    )

    for (let zi = cfg.gridDepth; zi >= 1; zi--) {
      const z = zi * cfg.cellSize - (scrollOffsetRef.current * cfg.cellSize * 10) % cfg.cellSize
      const zNext = (zi - 1) * cfg.cellSize - (scrollOffsetRef.current * cfg.cellSize * 10) % cfg.cellSize

      if (z <= 0) continue

      const depthFactor = 1 - zi / cfg.gridDepth
      const alpha = 0.3 + depthFactor * 0.7

      // Determine color based on depth (closer = warmer from bass, further = cooler from highs)
      const lineColor = lerpColor(highRgb, bassRgb, depthFactor)
      ctx.strokeStyle = `rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${alpha})`

      // Add glow for closer lines
      if (depthFactor > 0.5) {
        ctx.shadowColor = `rgb(${lineColor.r}, ${lineColor.g}, ${lineColor.b})`
        ctx.shadowBlur = cfg.glowIntensity * depthFactor * (0.5 + smoothBass * 0.5)
      } else {
        ctx.shadowBlur = 0
      }

      // Draw horizontal lines
      ctx.beginPath()
      let started = false

      for (let xi = -cfg.gridWidth / 2; xi <= cfg.gridWidth / 2; xi++) {
        const x = xi * cfg.cellSize

        // Calculate terrain height from noise + audio
        const noiseVal = terrainNoise(x * 0.02, z * 0.02, timeRef.current)
        const audioHeight = noiseVal * cfg.terrainHeight * (0.3 + smoothBass * 0.7) * beatPulse

        const point = project(x, z, -audioHeight)
        if (!point) continue

        if (!started) {
          ctx.moveTo(point.x, point.y)
          started = true
        } else {
          ctx.lineTo(point.x, point.y)
        }
      }
      ctx.stroke()

      // Draw vertical lines connecting to next row
      if (zNext > 0) {
        for (let xi = -cfg.gridWidth / 2; xi <= cfg.gridWidth / 2; xi += 2) {
          const x = xi * cfg.cellSize

          const noiseVal1 = terrainNoise(x * 0.02, z * 0.02, timeRef.current)
          const noiseVal2 = terrainNoise(x * 0.02, zNext * 0.02, timeRef.current)

          const audioHeight1 = noiseVal1 * cfg.terrainHeight * (0.3 + smoothBass * 0.7) * beatPulse
          const audioHeight2 = noiseVal2 * cfg.terrainHeight * (0.3 + smoothBass * 0.7) * beatPulse

          const point1 = project(x, z, -audioHeight1)
          const point2 = project(x, zNext, -audioHeight2)

          if (point1 && point2) {
            ctx.beginPath()
            ctx.moveTo(point1.x, point1.y)
            ctx.lineTo(point2.x, point2.y)
            ctx.stroke()
          }
        }
      }
    }

    ctx.shadowBlur = 0

    // Draw frequency indicators at bottom
    const indicatorY = height - 30
    const bands = [
      { level: smoothBass, color: bassRgb, label: 'BASS', x: width * 0.2 },
      { level: smoothMid, color: midRgb, label: 'MID', x: width * 0.5 },
      { level: smoothHigh, color: highRgb, label: 'HIGH', x: width * 0.8 },
    ]

    for (const band of bands) {
      const barWidth = 60
      const barHeight = 8 + band.level * 20

      ctx.fillStyle = `rgba(${band.color.r}, ${band.color.g}, ${band.color.b}, 0.8)`
      ctx.fillRect(band.x - barWidth / 2, indicatorY - barHeight, barWidth, barHeight)

      ctx.fillStyle = `rgba(${band.color.r}, ${band.color.g}, ${band.color.b}, 0.5)`
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(band.label, band.x, indicatorY + 12)
    }

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
          NEON TERRAIN
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: cfg.bassColor, display: 'block' }}>
            Bass: Pink (Height)
          </Typography>
          <Typography variant="caption" sx={{ color: cfg.midColor, display: 'block' }}>
            Mids: Orange (Warmth)
          </Typography>
          <Typography variant="caption" sx={{ color: cfg.highColor, display: 'block' }}>
            Highs: Cyan (Cool)
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default NeonTerrainVisualiser
