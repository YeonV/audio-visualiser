/**
 * AuroraBorealisVisualiser - Northern lights with frequency-mapped colors
 *
 * Bass = Green lower curtains
 * Mids = Purple/Pink middle ribbons
 * Highs = Blue/Cyan upper shimmer
 */

import React, { useRef, useEffect, useCallback } from 'react'
import { Box, Typography } from '@mui/material'

export interface AuroraBorealisConfig {
  ribbonCount: number
  ribbonSegments: number
  waveSpeed: number
  waveAmplitude: number
  verticalStretch: number
  glowIntensity: number
  trailFade: number
  audioSensitivity: number
  bassMultiplier: number
  midMultiplier: number
  highMultiplier: number
  bassColor: string
  midColor: string
  highColor: string
  backgroundColor: string
  starCount: number
  showStars: boolean
}

export interface AuroraBorealisProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  config: AuroraBorealisConfig
  onConfigChange?: (config: Partial<AuroraBorealisConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}

export const DEFAULT_AURORABOREALIS_CONFIG: AuroraBorealisConfig = {
  ribbonCount: 5,
  ribbonSegments: 100,
  waveSpeed: 0.8,
  waveAmplitude: 80,
  verticalStretch: 0.6,
  glowIntensity: 25,
  trailFade: 0.03,
  audioSensitivity: 1.5,
  bassMultiplier: 2.0,
  midMultiplier: 1.5,
  highMultiplier: 1.2,
  bassColor: '#00ff88',      // Green for bass
  midColor: '#ff00ff',       // Magenta/Purple for mids
  highColor: '#00ccff',      // Cyan/Blue for highs
  backgroundColor: '#0a0a1a',
  starCount: 150,
  showStars: true,
}

interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
  twinklePhase: number
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      }
    : { r: 0, g: 255, b: 136 }
}

// Simple noise function for organic movement
function noise(x: number, y: number, t: number): number {
  const sin1 = Math.sin(x * 0.01 + t)
  const sin2 = Math.sin(y * 0.02 - t * 0.7)
  const sin3 = Math.sin((x + y) * 0.01 + t * 0.5)
  return (sin1 + sin2 + sin3) / 3
}

const AuroraBorealisVisualiser: React.FC<AuroraBorealisProps> = ({
  audioData,
  isPlaying,
  config,
  frequencyBands,
  beatData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)
  const starsRef = useRef<Star[]>([])
  const smoothedBandsRef = useRef({ bass: 0, mid: 0, high: 0 })

  const cfg = { ...DEFAULT_AURORABOREALIS_CONFIG, ...config }

  // Initialize stars
  useEffect(() => {
    const stars: Star[] = []
    for (let i = 0; i < cfg.starCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.6, // Stars only in upper portion
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1 + Math.random() * 3,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }
    starsRef.current = stars
  }, [cfg.starCount])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Trail fade effect
    ctx.fillStyle = cfg.backgroundColor
    ctx.globalAlpha = cfg.trailFade
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1

    // Update time
    timeRef.current += 0.016 * cfg.waveSpeed

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
    smoothedBandsRef.current.bass += (bass - smoothedBandsRef.current.bass) * 0.1
    smoothedBandsRef.current.mid += (mid - smoothedBandsRef.current.mid) * 0.1
    smoothedBandsRef.current.high += (high - smoothedBandsRef.current.high) * 0.1

    const smoothBass = smoothedBandsRef.current.bass * cfg.bassMultiplier * cfg.audioSensitivity
    const smoothMid = smoothedBandsRef.current.mid * cfg.midMultiplier * cfg.audioSensitivity
    const smoothHigh = smoothedBandsRef.current.high * cfg.highMultiplier * cfg.audioSensitivity

    // Beat pulse
    const beatPulse = beatData?.isBeat ? 1 + beatData.beatIntensity * 0.5 : 1

    // Colors
    const bassRgb = hexToRgb(cfg.bassColor)
    const midRgb = hexToRgb(cfg.midColor)
    const highRgb = hexToRgb(cfg.highColor)

    // Draw stars first (background)
    if (cfg.showStars) {
      for (const star of starsRef.current) {
        const twinkle = Math.sin(timeRef.current * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5
        const alpha = star.brightness * (0.5 + twinkle * 0.5) * (0.3 + smoothHigh * 0.7)

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw aurora ribbons - three layers for each frequency band
    const layers = [
      { band: smoothBass, color: bassRgb, yOffset: 0.7, intensity: 1.0 },   // Bass - lower
      { band: smoothMid, color: midRgb, yOffset: 0.5, intensity: 0.8 },     // Mids - middle
      { band: smoothHigh, color: highRgb, yOffset: 0.3, intensity: 0.6 },   // Highs - upper
    ]

    for (let ribbonIndex = 0; ribbonIndex < cfg.ribbonCount; ribbonIndex++) {
      const ribbonOffset = (ribbonIndex / cfg.ribbonCount) * Math.PI * 2

      for (const layer of layers) {
        const intensity = layer.band * layer.intensity * beatPulse
        if (intensity < 0.05) continue

        const baseY = height * layer.yOffset
        const verticalRange = height * cfg.verticalStretch * (0.5 + intensity * 0.5)

        // Create gradient for this ribbon
        const gradient = ctx.createLinearGradient(0, baseY - verticalRange, 0, baseY + verticalRange * 0.5)
        gradient.addColorStop(0, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, 0)`)
        gradient.addColorStop(0.3, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, ${intensity * 0.3})`)
        gradient.addColorStop(0.5, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, ${intensity * 0.6})`)
        gradient.addColorStop(0.7, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, ${intensity * 0.3})`)
        gradient.addColorStop(1, `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, 0)`)

        ctx.fillStyle = gradient
        ctx.shadowColor = `rgb(${layer.color.r}, ${layer.color.g}, ${layer.color.b})`
        ctx.shadowBlur = cfg.glowIntensity * intensity

        ctx.beginPath()

        // Draw flowing ribbon shape
        const points: { x: number; y: number }[] = []

        for (let i = 0; i <= cfg.ribbonSegments; i++) {
          const t = i / cfg.ribbonSegments
          const x = t * width

          // Multiple noise layers for organic movement
          const n1 = noise(x, ribbonIndex * 100, timeRef.current + ribbonOffset)
          const n2 = noise(x * 2, ribbonIndex * 50, timeRef.current * 1.3 + ribbonOffset)
          const n3 = noise(x * 0.5, ribbonIndex * 200, timeRef.current * 0.7 + ribbonOffset)

          const waveOffset = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * cfg.waveAmplitude * (1 + intensity)
          const y = baseY + waveOffset - verticalRange * 0.3

          points.push({ x, y })
        }

        // Draw upper edge
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y)
        }

        // Draw lower edge (mirrored with offset)
        for (let i = points.length - 1; i >= 0; i--) {
          const curtainDrop = verticalRange * (0.3 + Math.sin(i / cfg.ribbonSegments * Math.PI) * 0.4)
          ctx.lineTo(points[i].x, points[i].y + curtainDrop)
        }

        ctx.closePath()
        ctx.fill()
      }
    }

    ctx.shadowBlur = 0

    // Add shimmer particles for high frequencies
    if (smoothHigh > 0.2) {
      const particleCount = Math.floor(smoothHigh * 50 * beatPulse)
      for (let i = 0; i < particleCount; i++) {
        const px = Math.random() * width
        const py = height * (0.2 + Math.random() * 0.4)
        const psize = 1 + Math.random() * 2
        const palpha = smoothHigh * (0.3 + Math.random() * 0.5)

        ctx.fillStyle = `rgba(${highRgb.r}, ${highRgb.g}, ${highRgb.b}, ${palpha})`
        ctx.beginPath()
        ctx.arc(px, py, psize, 0, Math.PI * 2)
        ctx.fill()
      }
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
          AURORA BOREALIS
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: cfg.bassColor, display: 'block' }}>
            Bass: Green (Low)
          </Typography>
          <Typography variant="caption" sx={{ color: cfg.midColor, display: 'block' }}>
            Mids: Purple (Mid)
          </Typography>
          <Typography variant="caption" sx={{ color: cfg.highColor, display: 'block' }}>
            Highs: Cyan (Top)
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default AuroraBorealisVisualiser
