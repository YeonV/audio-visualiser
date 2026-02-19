/**
 * VisualizerControls - Header control bar for audio visualizer
 * 
 * Contains visualizer selection, audio source toggle, playback controls,
 * and post-processing toggles.
 */

import React from 'react'
import {
  Box,
  Typography,
  IconButton,
  Button,
  Autocomplete,
  TextField,
  Tooltip,
  ToggleButton
} from '@mui/material'
import {
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  AutoAwesome,
  MusicNote,
  AutoFixHigh,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material'
import { type FullScreenHandle } from 'react-full-screen'
import { type WebGLVisualisationType } from '..'
import { type VisualisationType } from '../../../engines/webgl/registry'
import { useStore } from '../../../store'
import { type VisualizerOption } from '../../../store/visualizer/storeVisualizer'
import { AudioStatus, AudioSelector, AudioInputSelector } from '../../Audio'
import { version } from '../../../../package.json'

interface VisualizerControlsProps {
  onClose?: () => void
  micError: string | null
  isListening: boolean
  micData: { bpm: number }
  backendAudioData?: number[]
  hasBackend: boolean
  handlePrevVisualizer: () => void
  handleNextVisualizer: () => void
  handleTypeChange: (type: VisualisationType) => void
  handleSourceChange: (event: React.MouseEvent<HTMLElement>, newSource: 'backend' | 'mic' | 'system' | null) => void
  startListening: () => void
  stopListening: () => void
  fullscreenHandle: FullScreenHandle
  audioDevices: MediaDeviceInfo[]
  selectedDeviceId: string
  changeDevice: (deviceId: string) => Promise<void>
  startSystemAudio?: () => Promise<void>
}

const VisualizerControls: React.FC<VisualizerControlsProps> = React.memo(({
  onClose,
  micError,
  isListening,
  micData,
  backendAudioData,
  hasBackend,
  handlePrevVisualizer,
  handleNextVisualizer,
  handleTypeChange,
  handleSourceChange,
  startListening,
  stopListening,
  fullscreenHandle,
  audioDevices,
  selectedDeviceId,
  changeDevice,
  startSystemAudio
}) => {
  const visualType = useStore(state => state.visualType)
  const allVisualizers = useStore(state => state.visualizers)
  const audioSource = useStore(state => state.audioSource)
  const autoChange = useStore(state => state.autoChange)
  const setAutoChange = useStore(state => state.setAutoChange)
  const fxEnabled = useStore(state => state.fxEnabled)
  const setFxEnabled = useStore(state => state.setFxEnabled)
  const showFxPanel = useStore(state => state.showFxPanel)
  const setShowFxPanel = useStore(state => state.setShowFxPanel)
  const isPlaying = useStore(state => state.isPlaying)
  const setIsPlaying = useStore(state => state.setIsPlaying)

  // Define custom category order (Preset Player first, then Compositional, etc.)
  const CATEGORY_ORDER: Record<string, number> = {
    'Preset Player': 1,
    'Compositional': 2,
    'Simulation': 3,
    'Natural': 4,
    'Original Effects': 5,
    '2D Effects': 6,
    'Matrix Effects': 7
  }

  // Sort visualizers by category order, then by displayName
  // This prevents MUI Autocomplete duplicate headers warning
  const visualizers = React.useMemo(() => {
    return [...allVisualizers].sort((a, b) => {
      const orderA = CATEGORY_ORDER[a.category] ?? 999
      const orderB = CATEGORY_ORDER[b.category] ?? 999
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return a.displayName.localeCompare(b.displayName)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVisualizers])

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        gap: 2
      }}
    >
      <Box>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MusicNote /> Audio Visualiser <span style={{
            fontSize: '0.8rem',
            color: '#999',
            alignSelf: 'flex-end',
            paddingBottom: '3px',
            paddingLeft: '5px'
          }}>{version}</span>
          {onClose && (
            <IconButton onClick={onClose} size="small" sx={{ ml: 'auto' }}>
              <FullscreenExit />
            </IconButton>
          )}
        </Typography>
        <AudioStatus
          audioSource={audioSource}
          micError={micError}
          isListening={isListening}
          micData={micData}
          backendAudioData={backendAudioData}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {/* Visualizer Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Previous visualizer">
            <IconButton
              onClick={handlePrevVisualizer}
              size="small"
              sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
            >
              <ChevronLeft />
            </IconButton>
          </Tooltip>

          <Autocomplete
            size="small"
            sx={{ minWidth: 200 }}
            options={visualizers}
            groupBy={(option) => option.category}
            getOptionLabel={(option) => option.displayName}
            value={visualizers.find((v: VisualizerOption) => v.id === visualType) || null}
            onChange={(_, newValue) => {
              if (newValue) handleTypeChange(newValue.id as WebGLVisualisationType)
            }}
            renderInput={(params) => (
              <TextField {...params} label="Visualization" />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />

          <Tooltip title="Next visualizer">
            <IconButton
              onClick={handleNextVisualizer}
              size="small"
              sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
            >
              <ChevronRight />
            </IconButton>
          </Tooltip>
        </Box>

        <AudioSelector
          hasBackend={hasBackend}
          audioSource={audioSource}
          handleSourceChange={handleSourceChange}
        />

        {audioSource === 'mic' && (
          <AudioInputSelector
            audioDevices={audioDevices}
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={changeDevice}
          />
        )}

        <Tooltip title="Auto-change visuals on beat">
          <ToggleButton
            value="auto"
            selected={autoChange}
            onChange={() => setAutoChange(!autoChange)}
            size="small"
            color="primary"
          >
            <AutoAwesome sx={{ mr: 1 }} /> Auto
          </ToggleButton>
        </Tooltip>

        <Tooltip title="Post-processing effects">
          <ToggleButton
            value="fx"
            selected={fxEnabled}
            onChange={() => {
              const newValue = !fxEnabled
              setFxEnabled(newValue)
              // Auto-show panel when enabling FX
              if (newValue && !showFxPanel) {
                setShowFxPanel(true)
              }
            }}
            size="small"
            color="secondary"
          >
            <AutoFixHigh sx={{ mr: 1 }} /> FX
          </ToggleButton>
        </Tooltip>

        <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
          <Button
            onClick={() => {
              const newPlayingState = !isPlaying
              setIsPlaying(newPlayingState)
              
              // In standalone mic or system mode, control listening based on playing state
              if (!hasBackend && (audioSource === 'mic' || audioSource === 'system')) {
                if (newPlayingState) {
                  if (audioSource === 'system' && startSystemAudio) {
                    startSystemAudio()
                  } else {
                    startListening()
                  }
                } else {
                  stopListening()
                }
              }
            }}
            variant="outlined"
            color="inherit"
            sx={{ minWidth: '40px' }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </Button>
        </Tooltip>
        <Tooltip title="Fullscreen">
          <Button
            onClick={fullscreenHandle.enter}
            variant="outlined"
            color="inherit"
            sx={{ minWidth: '40px' }}
          >
            <Fullscreen />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  )
})

export default VisualizerControls
