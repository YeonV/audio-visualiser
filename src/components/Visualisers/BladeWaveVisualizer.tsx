/**
 * BladeWaveVisualizer - Audio-reactive layered waves
 *
 * Mimics the look of the SVG WaveLines animation with multiple overlapping
 * wave layers, horizontal gradients, and smooth audio-reactive movement.
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { Box } from '@mui/material'
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

const BladeWaveVisualizer: React.FC<BladeWaveProps> = ({
  audioData,
  isPlaying,
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)

  // Audio smoothing refs
  const smoothEnergy = useRef(0)
  const smoothSpectrum = useRef<Float32Array | null>(null)

  const cfg = useMemo(() => ({ ...DEFAULT_BLADEWAVE_CONFIG, ...config }), [config])

  // Process audio data to get energy levels
  const getAudioEnergy = useCallback(() => {
    if (!audioData || audioData.length === 0) return 0

    let sum = 0
    const len = audioData.length
    for (let i = 0; i < len; i++) {
      sum += Math.abs(audioData[i])
    }
    // Normalized average energy
    return (sum / len)
  }, [audioData])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas

    // Clear background
    ctx.fillStyle = cfg.backgroundColor
    ctx.fillRect(0, 0, width, height)

    // 1. Audio Processing & Smoothing
    const rawEnergy = getAudioEnergy()
    const s = cfg.smoothing
    smoothEnergy.current = smoothEnergy.current * s + rawEnergy * (1 - s)

    if (!smoothSpectrum.current || smoothSpectrum.current.length !== audioData.length) {
      smoothSpectrum.current = new Float32Array(audioData.length)
    }
    for (let i = 0; i < audioData.length; i++) {
      smoothSpectrum.current[i] = smoothSpectrum.current[i] * s + Math.abs(audioData[i]) * (1 - s)
    }

    const energy = smoothEnergy.current * cfg.audioSensitivity

    // 2. Timing Update
    let timeDelta = 0.01 * cfg.speed
    if (cfg.reactivityMode === 'Speed' || cfg.reactivityMode === 'Both') {
      timeDelta += energy * 0.05
    }
    timeRef.current += timeDelta

    // 3. Rendering
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, cfg.startColor)
    gradient.addColorStop(1, cfg.stopColor)

    const segments = 8
    const segmentWidth = width / (segments - 1)
    const baseLine = height * 0.7 // Draw lower on screen like a "mountain"

    // Draw layers from back to front
    for (let layer = 0; layer < cfg.lineCount; layer++) {
      const layerRatio = layer / cfg.lineCount
      const layerOffset = layer * (Math.PI * 2 / cfg.lineCount)
      const layerOpacity = cfg.waveOpacity * (1 - layerRatio * 0.5)

      // Determine audio influence for this layer
      let layerEnergy = energy
      if (cfg.frequencyMapping && smoothSpectrum.current) {
        const bandSize = Math.floor(smoothSpectrum.current.length / cfg.lineCount)
        const startIdx = layer * bandSize
        let bandSum = 0
        for (let i = 0; i < bandSize; i++) {
          bandSum += smoothSpectrum.current[startIdx + i] || 0
        }
        layerEnergy = (bandSum / bandSize) * cfg.audioSensitivity
      }

      const baseAmplitude = height * 0.15 * cfg.waveHeight
      let currentAmplitude = baseAmplitude
      if (cfg.reactivityMode === 'Height' || cfg.reactivityMode === 'Both') {
        currentAmplitude += layerEnergy * height * 0.3
      }

      ctx.save()
      ctx.globalAlpha = layerOpacity
      ctx.fillStyle = gradient

      // Generate points for the wave
      const points: {x: number, y: number}[] = []
      for (let i = 0; i < segments; i++) {
        const x = i * segmentWidth
        // Screensaver motion
        const noise = Math.sin(timeRef.current * 0.5 + i * 0.5 + layerOffset) * 0.6 +
                      Math.cos(timeRef.current * 0.3 + i * 0.8 + layerOffset * 0.3) * 0.4

        // Combine base motion + reactivity
        // We push UP (subtract from Y)
        const y = baseLine - (noise * currentAmplitude) - (layerEnergy * height * 0.1)
        points.push({ x, y })
      }

      ctx.beginPath()
      ctx.moveTo(0, height)
      ctx.lineTo(points[0].x, points[0].y)

      // Use the "midpoint quadratic" technique for perfect C1 smoothness
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i]
        const p1 = points[i + 1]

        const midX = (p0.x + p1.x) / 2
        const midY = (p0.y + p1.y) / 2

        if (i === 0) {
          // First segment
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
        } else if (i === points.length - 2) {
          // Last segment
          ctx.quadraticCurveTo(p0.x, p0.y, p1.x, p1.y)
        } else {
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
        }
      }

      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render)
    }
  }, [audioData, isPlaying, cfg, getAudioEnergy])

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
        overflow: 'hidden'
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

export default BladeWaveVisualizer
