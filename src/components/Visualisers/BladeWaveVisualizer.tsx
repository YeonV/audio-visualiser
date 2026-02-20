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

  const cfg = useMemo(() => ({ ...DEFAULT_BLADEWAVE_CONFIG, ...config }), [config])

  // Process audio data to get energy levels
  const getAudioEnergy = useCallback(() => {
    if (!audioData || audioData.length === 0) return 0

    let sum = 0
    const len = audioData.length
    for (let i = 0; i < len; i++) {
      sum += Math.abs(audioData[i])
    }
    return (sum / len) * cfg.audioSensitivity
  }, [audioData, cfg.audioSensitivity])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas

    // Clear background
    ctx.fillStyle = cfg.backgroundColor
    ctx.fillRect(0, 0, width, height)

    const energy = getAudioEnergy()
    timeRef.current += 0.01 * cfg.speed

    // Create the horizontal gradient shared by all waves
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, cfg.startColor)
    gradient.addColorStop(1, cfg.stopColor)

    const segments = 8
    const segmentWidth = width / segments
    const baseHeight = height * 0.5
    const waveAmplitude = height * 0.2 * cfg.waveHeight

    // Draw layers from back to front
    for (let layer = 0; layer < cfg.lineCount; layer++) {
      const layerOffset = layer * (Math.PI * 2 / cfg.lineCount)
      const layerOpacity = cfg.waveOpacity * (1 - (layer / cfg.lineCount) * 0.5)

      ctx.save()
      ctx.globalAlpha = layerOpacity
      ctx.fillStyle = gradient

      ctx.beginPath()
      ctx.moveTo(0, height)

      // Calculate start Y
      const startNoise = Math.sin(timeRef.current + layerOffset)
      const startY = baseHeight + startNoise * waveAmplitude * 0.5 + (audioData[0] || 0) * waveAmplitude * cfg.audioSensitivity
      ctx.lineTo(0, startY)

      let prevX = 0
      let prevY = startY

      for (let i = 1; i <= segments; i++) {
        const x = i * segmentWidth

        // Base animation
        const noise = Math.sin(timeRef.current * 1.5 + i * 0.8 + layerOffset) * 0.5 +
                      Math.cos(timeRef.current * 0.7 + i * 1.2 + layerOffset * 0.5) * 0.5

        // Audio reactive component
        const audioIdx = Math.floor((i / segments) * (audioData.length - 1))
        const audioValue = (audioData[audioIdx] || 0) * cfg.audioSensitivity

        const targetY = baseHeight + (noise * waveAmplitude) + (audioValue * waveAmplitude)

        const cpX = prevX + segmentWidth * 0.5
        // Control point Y also wiggles with audio
        const cpY = (prevY + targetY) / 2 + (Math.sin(timeRef.current * 2 + i) * energy * 100)

        ctx.quadraticCurveTo(cpX, cpY, x, targetY)

        prevX = x
        prevY = targetY
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
