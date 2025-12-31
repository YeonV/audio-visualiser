import React, { useRef, useEffect } from 'react'
import { Box, Typography } from '@mui/material'

interface SpectrumAnalyzerProps {
  frequencyData: Float32Array | number[]
  color?: string
}

const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ frequencyData, color = '#2196f3' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const barWidth = width / frequencyData.length
    
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = color

    // Draw bars
    for (let i = 0; i < frequencyData.length; i++) {
      const value = frequencyData[i]
      const barHeight = value * height
      ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight)
    }
  }, [frequencyData, color])

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ width: '100%', height: 40, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={200}
          height={40}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6, color: 'white' }}>
          Bass
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6, color: 'white' }}>
          Mid
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.6, color: 'white' }}>
          High
        </Typography>
      </Box>
    </Box>
  )
}

export default SpectrumAnalyzer
