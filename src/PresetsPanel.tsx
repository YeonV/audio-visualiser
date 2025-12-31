import React from 'react'
import { Card, CardContent, Typography, Stack, Button, Divider } from '@mui/material'
import { WebGLVisualisationType } from './WebGLVisualiser'
import AudioStatsPanel from './AudioStatsPanel'

interface PresetsPanelProps {
  handleTypeChange: (type: WebGLVisualisationType) => void
  visualType: string
  setAllConfigs: React.Dispatch<React.SetStateAction<Record<string, any>>>
  handleResetAll: () => void
  audioSource: 'backend' | 'mic'
  micData: any
  tapTempo: () => void
}

const PresetsPanel: React.FC<PresetsPanelProps> = ({
  handleTypeChange,
  visualType,
  setAllConfigs,
  handleResetAll,
  audioSource,
  micData,
  tapTempo
}) => {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Presets
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Quickly switch between different moods.
        </Typography>

        <Stack spacing={2}>
          <Button onClick={() => handleTypeChange(visualType as WebGLVisualisationType)} variant="outlined" fullWidth>
            DEFAULT
          </Button>
          <Button
            onClick={() =>
              setAllConfigs((prev) => ({
                ...prev,
                [visualType]: {
                  ...prev[visualType],
                  sensitivity: 2.5,
                  brightness: 1.2,
                  smoothing: 0.2
                }
              }))
            }
            variant="outlined"
            fullWidth
            color="secondary"
          >
            HIGH ENERGY
          </Button>
          <Button
            onClick={() =>
              setAllConfigs((prev) => ({
                ...prev,
                [visualType]: {
                  ...prev[visualType],
                  sensitivity: 0.8,
                  smoothing: 0.9,
                  speed: 0.5
                }
              }))
            }
            variant="outlined"
            fullWidth
            color="info"
          >
            CHILL
          </Button>
        </Stack>

        <AudioStatsPanel audioSource={audioSource} micData={micData} tapTempo={tapTempo} />

        <Divider sx={{ my: 2 }} />
        <Button
          onClick={handleResetAll}
          variant="text"
          color="error"
          size="small"
          fullWidth
          sx={{ opacity: 0.7 }}
        >
          Reset All Data
        </Button>
      </CardContent>
    </Card>
  )
}

export default PresetsPanel
