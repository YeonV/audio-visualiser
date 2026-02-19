import { Box, IconButton } from '@mui/material'
import { FullscreenExit } from '@mui/icons-material'
import { Theme } from '@mui/material'
import { FullScreen, FullScreenHandle } from 'react-full-screen'
import { useMemo } from 'react'
import { useStore } from '../../../store'
import {
  WebGLVisualiser,
  type WebGLVisualisationType,
  ButterchurnVisualiser,
  FluidVisualiser,
  WaveMountainVisualiser,
  BladeWaveVisualizer,
  HexGridVisualiser,
  SpiralGalaxyVisualiser,
  AuroraBorealisVisualiser,
  FrequencyRingsVisualiser,
  NeonTerrainVisualiser,
  AstrofoxVisualiser,
  type AstrofoxVisualiserRef
} from '..'
import { AudioDebugOverlay, useAudio } from '../../Audio'
import { CanvasContainer, VisualizerViewport } from '../../Layout'
import { DEFAULT_CONFIGS } from '../../../_generated/webgl/defaults'

// Component registry for dynamic rendering
const VISUALIZER_COMPONENTS: Record<string, React.ComponentType<any>> = {
  fluid: FluidVisualiser,
  wavemountain: WaveMountainVisualiser,
  bladewave: BladeWaveVisualizer,
  hexgrid: HexGridVisualiser,
  spiralgalaxy: SpiralGalaxyVisualiser,
  auroraborealis: AuroraBorealisVisualiser,
  frequencyrings: FrequencyRingsVisualiser,
  neonterrain: NeonTerrainVisualiser
}

interface VisualiserCanvasProps {
  theme: Theme
  configData?: any
  butterchurnRef: React.RefObject<any>
  astrofoxRef: React.RefObject<AstrofoxVisualiserRef | null>
  fullscreenHandle: FullScreenHandle
  handleContextCreated: (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => void
  ppControls: any
  ppState: { isInitialized: boolean }
}

export const VisualiserCanvas = ({
  theme,
  configData,
  butterchurnRef,
  astrofoxRef,
  fullscreenHandle,
  handleContextCreated,
  ppControls,
  ppState
}: VisualiserCanvasProps) => {
  // Audio context
  const {
    activeAudioData,
    beatData,
    frequencyBands,
    micData,
    getStream
  } = useAudio()

  // Store state
  const visualType = useStore(state => state.visualType)
  const isPlaying = useStore(state => state.isPlaying)
  const audioSource = useStore(state => state.audioSource)
  const showOverlays = useStore(state => state.showOverlays)
  const fullScreen = useStore(state => state.fullScreen)
  const setFullScreen = useStore(state => state.setFullScreen)
  const fxEnabled = useStore(state => state.fxEnabled)
  
  const butterchurnConfig = useStore(state => state.butterchurnConfig)
  const updateButterchurnConfig = useStore(state => state.updateButterchurnConfig)
  const astrofoxConfig = useStore(state => state.astrofoxConfig)
  const updateAstrofoxConfig = useStore(state => state.updateAstrofoxConfig)
  const visualizerConfigs = useStore(state => state.visualizerConfigs)
  const updateVisualizerConfig = useStore(state => state.updateVisualizerConfig)
  
  const activeCustomShader = useStore(state => state.activeCustomShader)

  const config = useMemo(() => visualizerConfigs[visualType] || DEFAULT_CONFIGS[visualType] || {}, [visualType, visualizerConfigs])

  return (
    <CanvasContainer background={configData?.background}>
      <FullScreen
        handle={fullscreenHandle}
        onChange={setFullScreen}
        className="fullscreen-wrapper"
      >
        <VisualizerViewport
          background={configData?.background}
          fullScreen={fullScreen}
          onDoubleClick={fullScreen ? fullscreenHandle.exit : fullscreenHandle.enter}
        >
          {(() => {
            // Special case: Butterchurn (has ref and unique props)
            if (visualType === 'butterchurn') {
              return (
                <ButterchurnVisualiser
                  key="butterchurn-visualiser"
                  ref={butterchurnRef}
                  audioData={activeAudioData}
                  isPlaying={isPlaying}
                  config={butterchurnConfig}
                  onConfigChange={updateButterchurnConfig}
                  showControls={showOverlays}
                  audioStream={audioSource === 'mic' ? getStream() : undefined}
                />
              )
            }
            
            // Special case: Astrofox (has ref and dynamic layers)
            if (visualType === 'astrofox') {
              return (
                <AstrofoxVisualiser
                  key="astrofox-visualiser"
                  ref={astrofoxRef}
                  audioData={activeAudioData}
                  isPlaying={isPlaying}
                  config={astrofoxConfig}
                  onConfigChange={updateAstrofoxConfig}
                  frequencyBands={frequencyBands}
                  beatData={beatData}
                />
              )
            }
            
            // Registry-driven: Schema-based visualizers (8 visualizers)
            const VisualizerComponent = VISUALIZER_COMPONENTS[visualType as string]
            if (VisualizerComponent) {
              return (
                <VisualizerComponent
                  key={`${visualType}-visualiser`}
                  audioData={activeAudioData}
                  isPlaying={isPlaying}
                  config={visualizerConfigs[visualType as string]}
                  onConfigChange={(update: any) =>
                    updateVisualizerConfig(visualType as string, update)
                  }
                  frequencyBands={frequencyBands}
                  beatData={beatData}
                  showControls={showOverlays}
                  onContextCreated={visualType === 'fluid' ? handleContextCreated : undefined}
                />
              )
            }
            
            // Fallback: WebGL visualizers (38 effects)
            return (
              <WebGLVisualiser
                key={`${visualType}-webgl-visualiser`}
                theme={theme}
                audioData={activeAudioData}
                isPlaying={isPlaying}
                visualType={visualType as WebGLVisualisationType}
                config={config}
                customShader={activeCustomShader}
                beatData={beatData}
                frequencyBands={frequencyBands}
                onContextCreated={handleContextCreated}
                postProcessing={ppControls}
                postProcessingEnabled={fxEnabled && ppState.isInitialized}
              />
            )
          })()}

          {/* Debug Overlay */}
          {!configData?.background && showOverlays && config.developer_mode && audioSource === 'mic' && (
            <AudioDebugOverlay key="audio-debug-overlay" micData={micData} />
          )}

          {/* Fullscreen Exit Button */}
          {!configData?.background && showOverlays && fullScreen && (
            <Box key="fullscreen-exit-button" sx={{ position: 'absolute', bottom: 20, left: 20 }}>
              <IconButton
                onClick={fullscreenHandle.exit}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <FullscreenExit />
              </IconButton>
            </Box>
          )}
        </VisualizerViewport>
      </FullScreen>
    </CanvasContainer>
  )
}
