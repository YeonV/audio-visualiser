/**
 * SpiralGalaxyVisualiser - Particle spiral arms from glowing center
 *
 * Creates particles arranged in spiral arms emanating from a glowing center,
 * like a galaxy rotating with audio-reactive brightness and motion.
 */

import React, { useRef, useEffect, useCallback } from 'react'
import { Box, Typography } from '@mui/material'

export interface SpiralGalaxyConfig {
  particleCount: number
  armCount: number
  armSpread: number
  spiralTightness: number
  rotationSpeed: number
  particleSize: number
  trailLength: number
  glowIntensity: number
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  audioSensitivity: number
  bassMultiplier: number
  midMultiplier: number
  highMultiplier: number
  pulseOnBeat: boolean
  centerGlow: boolean
}

export interface SpiralGalaxyProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  config: SpiralGalaxyConfig
  onConfigChange?: (config: Partial<SpiralGalaxyConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}

export const DEFAULT_SPIRALGALAXY_CONFIG: SpiralGalaxyConfig = {
  particleCount: 3000,
  armCount: 4,
  armSpread: 0.4,
  spiralTightness: 0.3,
  rotationSpeed: 0.15,
  particleSize: 2,
  trailLength: 0.95,
  glowIntensity: 20,
  primaryColor: '#00ffff',
  secondaryColor: '#ff00ff',
  backgroundColor: '#0a0a15',
  audioSensitivity: 1.5,
  bassMultiplier: 2.0,
  midMultiplier: 1.2,
  highMultiplier: 0.8,
  pulseOnBeat: true,
  centerGlow: true,
}

interface Particle {
  armIndex: number
  distance: number
  angle: number
  baseAngle: number
  size: number
  brightness: number
  speed: number
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

const SpiralGalaxyVisualiser: React.FC<SpiralGalaxyProps> = ({
  audioData,
  isPlaying,
  config,
  frequencyBands,
  beatData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const timeRef = useRef(0)
  const smoothedBandsRef = useRef({ bass: 0, mid: 0, high: 0 })

  const cfg = { ...DEFAULT_SPIRALGALAXY_CONFIG, ...config }

  // Initialize particles
  useEffect(() => {
    const particles: Particle[] = []
    for (let i = 0; i < cfg.particleCount; i++) {
      const armIndex = i % cfg.armCount
      const armAngle = (armIndex / cfg.armCount) * Math.PI * 2

      // Random distance with bias toward outer regions for density
      const rawDist = Math.random()
      const distance = Math.pow(rawDist, 0.5) // Square root for more even distribution

      // Spread within the arm
      const spreadOffset = (Math.random() - 0.5) * cfg.armSpread * (1 + distance)

      particles.push({
        armIndex,
        distance,
        angle: armAngle + spreadOffset,
        baseAngle: armAngle,
        size: cfg.particleSize * (0.5 + Math.random() * 1),
        brightness: 0.3 + Math.random() * 0.7,
        speed: 0.8 + Math.random() * 0.4,
      })
    }
    particlesRef.current = particles
  }, [cfg.particleCount, cfg.armCount, cfg.armSpread, cfg.particleSize])

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

    // Trail effect
    ctx.fillStyle = cfg.backgroundColor
    ctx.globalAlpha = 1 - cfg.trailLength
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1

    // Update time
    timeRef.current += 0.016

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
    smoothedBandsRef.current.bass += (bass - smoothedBandsRef.current.bass) * 0.12
    smoothedBandsRef.current.mid += (mid - smoothedBandsRef.current.mid) * 0.12
    smoothedBandsRef.current.high += (high - smoothedBandsRef.current.high) * 0.12

    const smoothBass = smoothedBandsRef.current.bass * cfg.bassMultiplier * cfg.audioSensitivity
    const smoothMid = smoothedBandsRef.current.mid * cfg.midMultiplier * cfg.audioSensitivity
    const smoothHigh = smoothedBandsRef.current.high * cfg.highMultiplier * cfg.audioSensitivity

    // Beat pulse
    const beatPulse = cfg.pulseOnBeat && beatData?.isBeat ? 1 + beatData.beatIntensity * 0.8 : 1

    // Colors
    const primaryRgb = hexToRgb(cfg.primaryColor)
    const secondaryRgb = hexToRgb(cfg.secondaryColor)

    // Global rotation
    const globalRotation = timeRef.current * cfg.rotationSpeed

    // Draw center glow first
    if (cfg.centerGlow) {
      const glowSize = 30 + smoothBass * 50 * beatPulse
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize)
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * (0.5 + smoothBass * 0.5)})`)
      gradient.addColorStop(0.3, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${0.5 * (0.3 + smoothBass * 0.7)})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw particles
    for (const particle of particlesRef.current) {
      // Calculate spiral position
      const spiralAngle = particle.angle +
        particle.distance * cfg.spiralTightness * Math.PI * 4 +
        globalRotation * particle.speed

      const radius = particle.distance * maxRadius

      const x = centerX + Math.cos(spiralAngle) * radius
      const y = centerY + Math.sin(spiralAngle) * radius

      // Audio influence based on distance
      let audioInfluence = 0
      if (particle.distance < 0.33) {
        audioInfluence = smoothBass * (1 - particle.distance * 3)
      } else if (particle.distance < 0.66) {
        audioInfluence = smoothMid
      } else {
        audioInfluence = smoothHigh
      }

      // Calculate particle properties
      const intensity = particle.brightness * (0.3 + audioInfluence * 0.7) * beatPulse
      const size = particle.size * (1 + audioInfluence * 0.5) * beatPulse

      // Color based on distance and arm
      const colorT = particle.distance + (particle.armIndex / cfg.armCount) * 0.3
      const color = lerpColor(primaryRgb, secondaryRgb, colorT % 1)

      // Alpha based on distance from center
      const alpha = Math.max(0.1, intensity * (0.7 + particle.distance * 0.3))

      // Draw particle with glow
      if (intensity > 0.4 && particle.distance < 0.5) {
        ctx.shadowColor = `rgb(${color.r}, ${color.g}, ${color.b})`
        ctx.shadowBlur = cfg.glowIntensity * intensity * 0.5
      } else {
        ctx.shadowBlur = 0
      }

      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.shadowBlur = 0

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
          minWidth: 180,
        }}
      >
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
          SPIRAL GALAXY
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
            Particles: {cfg.particleCount}
          </Typography>
          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
            Arms: {cfg.armCount}
          </Typography>
          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
            Sensitivity: {cfg.audioSensitivity.toFixed(1)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default SpiralGalaxyVisualiser
