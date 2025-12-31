/**
 * FrequencyRingsVisualiser - Expanding rings with distinct frequency colors
 *
 * Bass = Red/Orange (pulsing center rings)
 * Mids = Green/Yellow (expanding mid-range rings)
 * Highs = Blue/Cyan (fast outer shimmer rings)
 */

import React, { useRef, useEffect, useCallback } from 'react'
import { Box, Typography } from '@mui/material'

export interface FrequencyRingsConfig {
  maxRings: number
  ringSpawnRate: number
  ringExpansionSpeed: number
  ringThickness: number
  glowIntensity: number
  bassColor: string
  midColor: string
  highColor: string
  backgroundColor: string
  audioSensitivity: number
  bassMultiplier: number
  midMultiplier: number
  highMultiplier: number
  pulseOnBeat: boolean
  showCenterCore: boolean
  trailFade: number
}

export interface FrequencyRingsProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  config: FrequencyRingsConfig
  onConfigChange?: (config: Partial<FrequencyRingsConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}

export const DEFAULT_FREQUENCYRINGS_CONFIG: FrequencyRingsConfig = {
  maxRings: 30,
  ringSpawnRate: 0.1,
  ringExpansionSpeed: 2,
  ringThickness: 3,
  glowIntensity: 20,
  bassColor: '#ff4400',      // Red/Orange for bass
  midColor: '#44ff00',       // Green for mids
  highColor: '#0088ff',      // Blue for highs
  backgroundColor: '#0a0a0f',
  audioSensitivity: 1.5,
  bassMultiplier: 2.5,
  midMultiplier: 1.8,
  highMultiplier: 1.2,
  pulseOnBeat: true,
  showCenterCore: true,
  trailFade: 0.08,
}

interface Ring {
  radius: number
  maxRadius: number
  thickness: number
  color: { r: number; g: number; b: number }
  intensity: number
  speed: number
  type: 'bass' | 'mid' | 'high'
  age: number
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      }
    : { r: 255, g: 68, b: 0 }
}

const FrequencyRingsVisualiser: React.FC<FrequencyRingsProps> = ({
  audioData,
  isPlaying,
  config,
  frequencyBands,
  beatData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const ringsRef = useRef<Ring[]>([])
  const timeRef = useRef(0)
  const lastSpawnRef = useRef({ bass: 0, mid: 0, high: 0 })
  const smoothedBandsRef = useRef({ bass: 0, mid: 0, high: 0 })

  const cfg = { ...DEFAULT_FREQUENCYRINGS_CONFIG, ...config }

  const spawnRing = useCallback((type: 'bass' | 'mid' | 'high', intensity: number, maxRadius: number) => {
    const colors = {
      bass: hexToRgb(cfg.bassColor),
      mid: hexToRgb(cfg.midColor),
      high: hexToRgb(cfg.highColor),
    }

    const speeds = {
      bass: cfg.ringExpansionSpeed * 0.7,
      mid: cfg.ringExpansionSpeed * 1.0,
      high: cfg.ringExpansionSpeed * 1.5,
    }

    const ring: Ring = {
      radius: type === 'bass' ? 20 : type === 'mid' ? 40 : 60,
      maxRadius,
      thickness: cfg.ringThickness * (type === 'bass' ? 2 : type === 'mid' ? 1.5 : 1),
      color: colors[type],
      intensity: Math.min(1, intensity),
      speed: speeds[type],
      type,
      age: 0,
    }

    ringsRef.current.push(ring)

    // Limit total rings
    if (ringsRef.current.length > cfg.maxRings) {
      ringsRef.current.shift()
    }
  }, [cfg])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.45

    // Trail fade
    ctx.fillStyle = cfg.backgroundColor
    ctx.globalAlpha = cfg.trailFade
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1

    // Update time
    timeRef.current += 0.016

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
    smoothedBandsRef.current.bass += (bass - smoothedBandsRef.current.bass) * 0.15
    smoothedBandsRef.current.mid += (mid - smoothedBandsRef.current.mid) * 0.15
    smoothedBandsRef.current.high += (high - smoothedBandsRef.current.high) * 0.15

    const smoothBass = smoothedBandsRef.current.bass * cfg.bassMultiplier * cfg.audioSensitivity
    const smoothMid = smoothedBandsRef.current.mid * cfg.midMultiplier * cfg.audioSensitivity
    const smoothHigh = smoothedBandsRef.current.high * cfg.highMultiplier * cfg.audioSensitivity

    // Beat pulse
    const beatPulse = cfg.pulseOnBeat && beatData?.isBeat ? 1 + beatData.beatIntensity * 0.8 : 1

    // Spawn new rings based on audio intensity
    const spawnThreshold = cfg.ringSpawnRate

    if (smoothBass > 0.3 && timeRef.current - lastSpawnRef.current.bass > spawnThreshold) {
      spawnRing('bass', smoothBass, maxRadius * 0.6)
      lastSpawnRef.current.bass = timeRef.current
    }

    if (smoothMid > 0.25 && timeRef.current - lastSpawnRef.current.mid > spawnThreshold * 0.8) {
      spawnRing('mid', smoothMid, maxRadius * 0.8)
      lastSpawnRef.current.mid = timeRef.current
    }

    if (smoothHigh > 0.2 && timeRef.current - lastSpawnRef.current.high > spawnThreshold * 0.5) {
      spawnRing('high', smoothHigh, maxRadius)
      lastSpawnRef.current.high = timeRef.current
    }

    // Draw center core
    if (cfg.showCenterCore) {
      const coreSize = 30 + smoothBass * 50 * beatPulse
      const bassRgb = hexToRgb(cfg.bassColor)

      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize * 2)
      gradient.addColorStop(0, `rgba(${bassRgb.r}, ${bassRgb.g}, ${bassRgb.b}, ${0.8 * smoothBass})`)
      gradient.addColorStop(0.5, `rgba(${bassRgb.r}, ${bassRgb.g}, ${bassRgb.b}, ${0.3 * smoothBass})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreSize * 2, 0, Math.PI * 2)
      ctx.fill()

      // Inner core
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + smoothBass * 0.5})`
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreSize * 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Update and draw rings
    const remainingRings: Ring[] = []

    for (const ring of ringsRef.current) {
      ring.age += 0.016
      ring.radius += ring.speed * (1 + (ring.type === 'bass' ? smoothBass : ring.type === 'mid' ? smoothMid : smoothHigh) * 0.5)

      // Calculate alpha based on age and radius
      const radiusProgress = ring.radius / ring.maxRadius
      const alpha = ring.intensity * (1 - radiusProgress) * (1 - ring.age * 0.3)

      if (alpha > 0.01 && ring.radius < ring.maxRadius) {
        // Apply glow
        ctx.shadowColor = `rgb(${ring.color.r}, ${ring.color.g}, ${ring.color.b})`
        ctx.shadowBlur = cfg.glowIntensity * alpha

        // Draw ring
        ctx.strokeStyle = `rgba(${ring.color.r}, ${ring.color.g}, ${ring.color.b}, ${alpha})`
        ctx.lineWidth = ring.thickness * (1 - radiusProgress * 0.5) * beatPulse

        ctx.beginPath()
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2)
        ctx.stroke()

        remainingRings.push(ring)
      }
    }

    ringsRef.current = remainingRings
    ctx.shadowBlur = 0

    // Draw frequency indicators (static rings showing current levels)
    const bands = [
      { level: smoothBass, color: hexToRgb(cfg.bassColor), baseRadius: maxRadius * 0.25 },
      { level: smoothMid, color: hexToRgb(cfg.midColor), baseRadius: maxRadius * 0.5 },
      { level: smoothHigh, color: hexToRgb(cfg.highColor), baseRadius: maxRadius * 0.75 },
    ]

    for (const band of bands) {
      const pulseRadius = band.baseRadius * (1 + band.level * 0.2 * beatPulse)
      const alpha = 0.1 + band.level * 0.3

      ctx.strokeStyle = `rgba(${band.color.r}, ${band.color.g}, ${band.color.b}, ${alpha})`
      ctx.lineWidth = 1
      ctx.setLineDash([5, 10])
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render)
    }
  }, [audioData, isPlaying, cfg, frequencyBands, beatData, spawnRing])

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
          FREQUENCY RINGS
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: cfg.bassColor, display: 'block' }}>
            Bass: Red/Orange (Inner)
          </Typography>
          <Typography variant="caption" sx={{ color: cfg.midColor, display: 'block' }}>
            Mids: Green (Middle)
          </Typography>
          <Typography variant="caption" sx={{ color: cfg.highColor, display: 'block' }}>
            Highs: Blue (Outer)
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default FrequencyRingsVisualiser
