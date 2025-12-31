/**
 * ButterchurnVisualiser - Milkdrop-style visualizations using Butterchurn
 *
 * This component renders Milkdrop presets with automatic cycling and audio reactivity.
 * Based on https://butterchurnviz.com/ and https://github.com/jberg/butterchurn
 */

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Box, IconButton, Typography, Slider, Tooltip } from '@mui/material'
import { SkipPrevious, SkipNext, Shuffle, Settings } from '@mui/icons-material'
import * as staticPresets from 'butterchurn-presets'

// Butterchurn types
interface ButterchurnVisualizer {
  setRendererSize(width: number, height: number): void
  loadPreset(preset: any, blendTime: number): void
  render(): void
  launchSongTitleAnim(title: string): void
}

interface ButterchurnPresets {
  [key: string]: any
}

// Dynamic imports for Butterchurn
let butterchurn: any = null
let butterchurnPresets: ButterchurnPresets | null = null

const loadButterchurn = async (): Promise<boolean> => {
  if (butterchurn && butterchurnPresets) return true

  try {
    const butterchurnModule = await import('butterchurn')
    butterchurn = butterchurnModule.default

    const getPresetsFromModule = (m: any) => {
      if (!m) return {}
      
      const content = m.default || m
      
      // Case 1: content has getPresets function (main pack)
      if (content && typeof content.getPresets === 'function') {
        return content.getPresets()
      }
      
      // Case 2: module itself has getPresets (unwrapped)
      if (m && typeof m.getPresets === 'function') {
        return m.getPresets()
      }
      
      // Case 3: content is a function that returns presets
      if (typeof content === 'function') {
        try {
          const result = content()
          if (result && typeof result === 'object') return result
        } catch (e) {}
      }
      
      // Case 4: content is the presets object itself
      if (content && typeof content === 'object' && Object.keys(content).length > 5) {
        return content
      }
      
      return {}
    }

    // Load all preset packs and merge them
    const [
      basePresets,
      extraPresets,
      extra2Presets,
      md1Presets,
      nonMinimalPresets
    ] = await Promise.all([
      import('butterchurn-presets').then(m => {
        const p = getPresetsFromModule(m)
        return p
      }).catch(() => ({})),
      import('butterchurn-presets/lib/butterchurnPresetsExtra.min').then(m => getPresetsFromModule(m)).catch(() => ({})),
      import('butterchurn-presets/lib/butterchurnPresetsExtra2.min').then(m => getPresetsFromModule(m)).catch(() => ({})),
      import('butterchurn-presets/lib/butterchurnPresetsMD1.min').then(m => getPresetsFromModule(m)).catch(() => ({})),
      import('butterchurn-presets/lib/butterchurnPresetsNonMinimal.min').then(m => getPresetsFromModule(m)).catch(() => ({}))
    ])

    // Merge all presets
    butterchurnPresets = {
      ...basePresets,
      ...extraPresets,
      ...extra2Presets,
      ...md1Presets,
      ...nonMinimalPresets
    }
    return true
  } catch (error) {
    console.error('Failed to load Butterchurn:', error)
    return false
  }
}

export interface ButterchurnConfig {
  cycleInterval: number // seconds between preset changes (0 = disabled)
  blendTime: number // seconds to blend between presets
  shufflePresets: boolean
  currentPresetIndex: number
}

export interface ButterchurnVisualiserRef {
  getCanvas: () => HTMLCanvasElement | null
  nextPreset: () => void
  prevPreset: () => void
  setPreset: (index: number) => void
  getCurrentPresetName: () => string
}

type AudioDataArray = number[] | Float32Array

interface ButterchurnVisualiserProps {
  audioData: AudioDataArray
  isPlaying: boolean
  config: ButterchurnConfig
  onConfigChange?: (config: Partial<ButterchurnConfig>) => void
  showControls?: boolean
  audioStream?: MediaStream | null
}

const DEFAULT_CONFIG: ButterchurnConfig = {
  cycleInterval: 25,
  blendTime: 2.7,
  shufflePresets: false,
  currentPresetIndex: 0
}

const ButterchurnVisualiser = forwardRef<ButterchurnVisualiserRef, ButterchurnVisualiserProps>(
  ({ audioData, isPlaying, config = DEFAULT_CONFIG, onConfigChange, showControls = true, audioStream }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const visualizerRef = useRef<ButterchurnVisualizer | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const oscillatorRef = useRef<OscillatorNode | null>(null)
    const gainRef = useRef<GainNode | null>(null)
    const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const animationFrameRef = useRef<number>(0)
    const cycleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const resumeAudioRef = useRef<(() => void) | null>(null)
    const isAudioStartedRef = useRef(false)

    const [isLoaded, setIsLoaded] = useState(false)
    const [presetNames, setPresetNames] = useState<string[]>([])
    const [currentPresetIndex, setCurrentPresetIndex] = useState(config.currentPresetIndex || 0)
    const [currentPresetName, setCurrentPresetName] = useState('')
    const [showSettings, setShowSettings] = useState(false)
    const [shuffledIndices, setShuffledIndices] = useState<number[]>([])

    // Initialize Butterchurn
    useEffect(() => {
      const init = async () => {
        const loaded = await loadButterchurn()
        if (!loaded || !canvasRef.current) return

        const canvas = canvasRef.current

        // Create audio context for Butterchurn (may be suspended due to autoplay policy)
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 2048
        analyserRef.current.smoothingTimeConstant = 0.8

        // Create a silent audio source that connects to the analyser
        // Butterchurn needs this for its internal audio processing
        oscillatorRef.current = audioContextRef.current.createOscillator()
        gainRef.current = audioContextRef.current.createGain()
        gainRef.current.gain.value = 0 // Silent

        // Connect: oscillator -> gain (silent) -> analyser
        oscillatorRef.current.connect(gainRef.current)
        gainRef.current.connect(analyserRef.current)

        // Resume AudioContext on user interaction (autoplay policy)
        const resumeAudio = async () => {
          if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume()
          }
          
          if (!isAudioStartedRef.current && oscillatorRef.current) {
            isAudioStartedRef.current = true
            try {
              oscillatorRef.current.start()
            } catch (e) {
              console.warn('Oscillator already started', e)
            }
          }

          // Remove listeners after successful resume
          document.removeEventListener('click', resumeAudio)
          document.removeEventListener('keydown', resumeAudio)
          resumeAudioRef.current = null
        }
        resumeAudioRef.current = resumeAudio

        if (audioContextRef.current.state === 'suspended') {
          document.addEventListener('click', resumeAudio)
          document.addEventListener('keydown', resumeAudio)
        } else {
          if (!isAudioStartedRef.current) {
            try {
              oscillatorRef.current.start()
              isAudioStartedRef.current = true
            } catch (e) {
              console.warn('Oscillator already started', e)
            }
          }
          resumeAudioRef.current = null
        }

        // Create visualizer - Butterchurn expects AudioContext, canvas, and options
        visualizerRef.current = butterchurn.createVisualizer(audioContextRef.current, canvas, {
          width: canvas.width,
          height: canvas.height,
          meshWidth: 32,
          meshHeight: 24,
          pixelRatio: window.devicePixelRatio || 1
        })

        // Load preset names
        if (butterchurnPresets) {
          const names = Object.keys(butterchurnPresets)
          setPresetNames(names)

          // Create shuffled indices
          const indices = names.map((_, i) => i)
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[indices[i], indices[j]] = [indices[j], indices[i]]
          }
          setShuffledIndices(indices)

          // Load initial preset
          if (names.length > 0 && visualizerRef.current) {
            const initialIndex = config.currentPresetIndex || 0
            const preset = butterchurnPresets[names[initialIndex]]
            visualizerRef.current.loadPreset(preset, 0)
            setCurrentPresetName(names[initialIndex])
            setCurrentPresetIndex(initialIndex)
          }
        }

        setIsLoaded(true)
      }

      init()

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (cycleIntervalRef.current) {
          clearInterval(cycleIntervalRef.current)
        }
        // Clean up audio resume event listeners
        if (resumeAudioRef.current) {
          document.removeEventListener('click', resumeAudioRef.current)
          document.removeEventListener('keydown', resumeAudioRef.current)
        }
        if (oscillatorRef.current) {
          try {
            oscillatorRef.current.stop()
          } catch {
            // Oscillator may already be stopped or not started
          }
        }
        if (streamSourceRef.current) {
          try {
            streamSourceRef.current.disconnect()
          } catch {
            // Source may already be disconnected
          }
        }
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close()
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Intentionally empty - only run once on mount

    // Handle resize
    useEffect(() => {
      const handleResize = () => {
        if (!canvasRef.current || !visualizerRef.current) return

        const canvas = canvasRef.current
        const parent = canvas.parentElement
        if (!parent) return

        const width = parent.clientWidth
        const height = parent.clientHeight
        canvas.width = width * (window.devicePixelRatio || 1)
        canvas.height = height * (window.devicePixelRatio || 1)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        visualizerRef.current.setRendererSize(canvas.width, canvas.height)
      }

      window.addEventListener('resize', handleResize)
      handleResize()

      return () => window.removeEventListener('resize', handleResize)
    }, [isLoaded])

    // Load preset by index
    const loadPreset = useCallback(
      (index: number) => {
        const visualizer = visualizerRef.current
        if (!visualizer || !butterchurnPresets || presetNames.length === 0) return

        const actualIndex = config.shufflePresets ? shuffledIndices[index] : index
        const presetName = presetNames[actualIndex]
        const preset = butterchurnPresets[presetName]

        if (preset) {
          visualizer.loadPreset(preset, config.blendTime || 2.7)
          setCurrentPresetName(presetName)
          setCurrentPresetIndex(index)
          onConfigChange?.({ currentPresetIndex: index })
        }
      },
      [presetNames, shuffledIndices, config.shufflePresets, config.blendTime, onConfigChange]
    )

    // Next/Previous preset
    const nextPreset = useCallback(() => {
      const next = (currentPresetIndex + 1) % presetNames.length
      loadPreset(next)
    }, [currentPresetIndex, presetNames.length, loadPreset])

    const prevPreset = useCallback(() => {
      const prev = (currentPresetIndex - 1 + presetNames.length) % presetNames.length
      loadPreset(prev)
    }, [currentPresetIndex, presetNames.length, loadPreset])

    // Random preset
    const randomPreset = useCallback(() => {
      if (presetNames.length === 0) return
      const randomIndex = Math.floor(Math.random() * presetNames.length)
      loadPreset(randomIndex)
    }, [presetNames.length, loadPreset])

    // Auto-cycle presets
    useEffect(() => {
      if (cycleIntervalRef.current) {
        clearInterval(cycleIntervalRef.current)
        cycleIntervalRef.current = null
      }

      if (config.cycleInterval > 0 && isPlaying && presetNames.length > 0) {
        cycleIntervalRef.current = setInterval(() => {
          if (config.shufflePresets) {
            randomPreset()
          } else {
            nextPreset()
          }
        }, config.cycleInterval * 1000)
      }

      return () => {
        if (cycleIntervalRef.current) {
          clearInterval(cycleIntervalRef.current)
        }
      }
    }, [
      config.cycleInterval,
      config.shufflePresets,
      isPlaying,
      presetNames.length,
      nextPreset,
      randomPreset
    ])

    // Modulate oscillator based on audio data to create reactivity
    useEffect(() => {
      if (!oscillatorRef.current || !gainRef.current || audioData.length === 0) return

      // Calculate bass and overall intensity from melbank
      const bassEnd = Math.floor(audioData.length * 0.2)
      const audioArr = Array.from(audioData)
      const bassSum = audioArr.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd
      const overallSum = audioArr.reduce((a, b) => a + b, 0) / audioData.length

      // Modulate oscillator frequency based on bass (20-400 Hz range)
      const baseFreq = 60
      const freqRange = 340
      oscillatorRef.current.frequency.setTargetAtTime(baseFreq + bassSum * freqRange, audioContextRef.current!.currentTime, 0.01)

      // Modulate gain based on overall intensity (keep it subtle, 0-0.3 range)
      gainRef.current.gain.setTargetAtTime(overallSum * 0.3, audioContextRef.current!.currentTime, 0.01)
    }, [audioData])

    // Connect audioStream directly to Butterchurn's analyser for proper audio reactivity
    useEffect(() => {
      if (!audioContextRef.current || !analyserRef.current) return

      // Disconnect previous stream source if exists
      if (streamSourceRef.current) {
        try {
          streamSourceRef.current.disconnect()
        } catch (e) {
          // Ignore disconnect errors
        }
        streamSourceRef.current = null
      }

      // Connect new stream if provided
      if (audioStream) {
        try {
          // Resume audio context if suspended
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
          }

          // Create source from the stream and connect to analyser
          const source = audioContextRef.current.createMediaStreamSource(audioStream)
          source.connect(analyserRef.current)
          streamSourceRef.current = source
        } catch (e) {
          console.warn('Failed to connect audio stream to Butterchurn:', e)
        }
      }
    }, [audioStream])

    // Animation loop
    useEffect(() => {
      if (!isLoaded || !isPlaying) return

      const render = () => {
        if (!visualizerRef.current) return

        // Render frame - Butterchurn reads audio from its internal analyzer
        visualizerRef.current.render()

        animationFrameRef.current = requestAnimationFrame(render)
      }

      animationFrameRef.current = requestAnimationFrame(render)

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [isLoaded, isPlaying])

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        nextPreset,
        prevPreset,
        setPreset: loadPreset,
        getCurrentPresetName: () => currentPresetName
      }),
      [nextPreset, prevPreset, loadPreset, currentPresetName]
    )

    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          bgcolor: 'black'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />

        {/* Preset name overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            color: 'white',
            textShadow: '0 0 4px black, 0 0 8px black',
            pointerEvents: 'none',
            opacity: 0.8
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {currentPresetName}
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.6, fontSize: '0.65rem' }}>
            {currentPresetIndex + 1} / {presetNames.length}
          </Typography>
        </Box>

        {/* Controls overlay */}
        {showControls && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(0,0,0,0.6)',
              borderRadius: 2,
              px: 2,
              py: 0.5
            }}
          >
            <Tooltip title="Previous preset">
              <IconButton onClick={prevPreset} size="small" sx={{ color: 'white' }}>
                <SkipPrevious />
              </IconButton>
            </Tooltip>

            <Tooltip title="Random preset">
              <IconButton
                onClick={randomPreset}
                size="small"
                sx={{ color: config.shufflePresets ? 'primary.main' : 'white' }}
              >
                <Shuffle />
              </IconButton>
            </Tooltip>

            <Tooltip title="Next preset">
              <IconButton onClick={nextPreset} size="small" sx={{ color: 'white' }}>
                <SkipNext />
              </IconButton>
            </Tooltip>

            <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.2)', mx: 1 }} />

            <Tooltip title="Settings">
              <IconButton
                onClick={() => setShowSettings(!showSettings)}
                size="small"
                sx={{ color: showSettings ? 'primary.main' : 'white' }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Settings panel */}
        {showSettings && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 70,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(0,0,0,0.85)',
              borderRadius: 2,
              p: 2,
              minWidth: 280,
              color: 'white'
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Preset Cycle Interval: {config.cycleInterval}s
            </Typography>
            <Slider
              value={config.cycleInterval}
              onChange={(_, value) => onConfigChange?.({ cycleInterval: value as number })}
              min={0}
              max={120}
              step={5}
              marks={[
                { value: 0, label: 'Off' },
                { value: 25, label: '25s' },
                { value: 60, label: '60s' }
              ]}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Blend Time: {config.blendTime}s
            </Typography>
            <Slider
              value={config.blendTime}
              onChange={(_, value) => onConfigChange?.({ blendTime: value as number })}
              min={0}
              max={10}
              step={0.1}
            />
          </Box>
        )}

        {/* Loading state */}
        {!isLoaded && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <Typography>Loading Butterchurn...</Typography>
          </Box>
        )}
      </Box>
    )
  }
)

ButterchurnVisualiser.displayName = 'ButterchurnVisualiser'

export default ButterchurnVisualiser
