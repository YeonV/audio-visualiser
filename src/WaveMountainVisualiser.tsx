/**
 * WaveMountainVisualiser - Layered frequency waves with 3D depth perspective
 *
 * Creates stacked horizontal waveform lines that form a mountain-like terrain,
 * with audio-reactive height displacement and smooth color gradients.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Box, Typography } from '@mui/material'

export interface WaveMountainConfig {
  lineCount: number
  pointsPerLine: number
  lineSpacing: number
  waveHeight: number
  perspectiveStrength: number
  smoothing: number
  trailFade: number
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  lineWidth: number
  audioSensitivity: number
  bassMultiplier: number
  midMultiplier: number
  highMultiplier: number
  rotationSpeed: number
  perspective3D: boolean
}

export interface WaveMountainProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  config: WaveMountainConfig
  onConfigChange?: (config: Partial<WaveMountainConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}

export const DEFAULT_WAVEMOUNTAIN_CONFIG: WaveMountainConfig = {
  lineCount: 40,
  pointsPerLine: 128,
  lineSpacing: 12,
  waveHeight: 150,
  perspectiveStrength: 0.7,
  smoothing: 0.85,
  trailFade: 0.02,
  primaryColor: '#00ffff',
  secondaryColor: '#ff00ff',
  backgroundColor: '#1a1a2e',
  lineWidth: 1.5,
  audioSensitivity: 1.0,
  bassMultiplier: 1.5,
  midMultiplier: 1.0,
  highMultiplier: 0.8,
  rotationSpeed: 0,
  perspective3D: true,
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

// Interpolate between two colors
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

const WaveMountainVisualiser: React.FC<WaveMountainProps> = ({
  audioData,
  isPlaying,
  config,
  frequencyBands,
  beatData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const historyRef = useRef<Float32Array[]>([])
  const timeRef = useRef(0)
  const smoothedDataRef = useRef<Float32Array | null>(null)

  const cfg = { ...DEFAULT_WAVEMOUNTAIN_CONFIG, ...config }

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
    const dataArray = Array.isArray(audioData) ? audioData : Array.from(audioData)
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

    // Colors
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

      // Get line color (gradient from primary to secondary based on depth)
      const lineColor = lerpColor(primaryRgb, secondaryRgb, depthFactor)

      ctx.beginPath()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = cfg.lineWidth * perspectiveScale
      ctx.globalAlpha = alpha

      // Draw the wave line
      const lineWidth = width * perspectiveScale * 0.9
      const startX = centerX - lineWidth / 2

      for (let i = 0; i < cfg.pointsPerLine; i++) {
        const x = startX + (i / (cfg.pointsPerLine - 1)) * lineWidth
        const amplitude = lineData[i] * cfg.waveHeight * perspectiveScale

        // Apply beat pulse
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

    ctx.globalAlpha = 1

    // Continue animation
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render)
    }
  }, [audioData, isPlaying, cfg, beatData])

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
          WAVE MOUNTAIN
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
        </Box>
      </Box>
    </Box>
  )
}

export default WaveMountainVisualiser
