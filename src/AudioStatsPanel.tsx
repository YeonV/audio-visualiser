import React from 'react'
import { Box, Typography, Button, LinearProgress, useTheme, Divider } from '@mui/material'
import SpectrumAnalyzer from './SpectrumAnalyzer'

interface AudioStatsPanelProps {
  audioSource: 'backend' | 'mic'
  micData: any
  tapTempo: () => void
}

const AudioStatsPanel: React.FC<AudioStatsPanelProps> = ({ audioSource, micData, tapTempo }) => {
  const theme = useTheme()

  if (audioSource !== 'mic') return null

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="overline" display="block" gutterBottom sx={{ fontWeight: 'bold', mb: 1, opacity: 0.7 }}>
        Audio Analysis
      </Typography>

      {/* Group 1: Tempo & Beats */}
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'primary.main' }}>
          TEMPO & BEATS
        </Typography>
        
        {/* BPM */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption">BPM</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" fontWeight="bold">
                {micData.bpm} <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>({Math.round(micData.confidence * 100)}%)</Typography>
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: '30px', height: '18px', fontSize: '0.6rem', p: 0 }}
                onClick={tapTempo}
              >
                TAP
              </Button>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={micData.confidence * 100}
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>

        {/* Beat Phase */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption">Beat Phase</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 0.25, 0.5, 0.75].map((threshold, i) => (
              <Box
                key={i}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: micData.beatPhase >= threshold && micData.beatPhase < threshold + 0.25
                    ? 'primary.main'
                    : 'action.disabledBackground',
                  boxShadow: micData.isBeat && micData.beatPhase >= threshold && micData.beatPhase < threshold + 0.25
                    ? '0 0 8px currentColor'
                    : 'none'
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Group 2: Energy & Mood */}
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'secondary.main' }}>
          ENERGY & MOOD
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption">Mood</Typography>
          <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
            {micData.mood}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">Energy</Typography>
            <Typography variant="caption">{Math.round(micData.energy * 100)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={micData.energy * 100}
            color="secondary"
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">Valence</Typography>
            <Typography variant="caption">{Math.round(micData.valence * 100)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={micData.valence * 100}
            color="info"
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>
      </Box>

      {/* Group 3: Frequency Detail */}
      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'text.secondary' }}>
          FREQUENCY SPECTRUM
        </Typography>

        <Box sx={{ mb: 2 }}>
          <SpectrumAnalyzer frequencyData={micData.normalizedFrequency.slice(0, 128)} color={theme.palette.primary.main} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            { label: 'Bass', value: micData.bass, color: 'error' as const },
            { label: 'Mid', value: micData.mid, color: 'warning' as const },
            { label: 'High', value: micData.high, color: 'info' as const }
          ].map((band) => (
            <Box key={band.label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{band.label}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>{band.value.toFixed(2)}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(band.value * 100, 100)}
                color={band.color}
                sx={{ height: 4, borderRadius: 1 }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default AudioStatsPanel
