import { type VisualisationType } from './engines/webgl/registry'
import { type VisualiserIsoProps } from './types/VisualiserIso'
import { type AstrofoxVisualiserRef } from './components/Visualisers'
import { AudioProvider, useAudio } from './components/Audio'
import { LifecycleEffectsHandler } from './components/Handlers/LifecycleEffectsHandler'
import { useVisualizerNavigation } from './hooks/useVisualizerNavigation'
import { RootGrid, CanvasCard } from './components/Layout'
import { useCallback, useRef } from 'react'
import { useFullScreenHandle } from 'react-full-screen'
import { useVisualizerReset } from './hooks/useVisualizerReset'
import { usePostProcessing } from './hooks/usePostProcessing'
import { QueryParamHandler } from './components/Handlers/QueryParamHandler'
import { AutoChangeHandler } from './components/Handlers/AutoChangeHandler'
import { SaveErrorSnackbar } from './components/SaveErrorSnackbar'
import { VisualiserCanvas } from './components/Visualisers/Base/VisualiserCanvas'
import { WindowApiHandler } from './components/Handlers/WindowApiHandler'
import { DEFAULT_CONFIGS } from './_generated/webgl/defaults'
import { useStore } from './store'
import VisualizerControls from './components/Visualisers/Base/VisualizerControls'
import ConfigurationPanel from './components/Panels/ConfigurationPanel'
import PresetsPanel from './components/Panels/PresetsPanel'
import { ThemeProvider } from '@mui/material/styles'
import { Grid } from '@mui/material'
import AstrofoxLayerPanel from './components/Panels/AstrofoxLayerPanel'

const VisualiserIsoInner = (
  {
    theme,
    effects,
    ConfigFormComponent,
    configData,
    onClose
  }: Omit<VisualiserIsoProps, 'backendAudioData'>
) => {
  const fullscreenHandle = useFullScreenHandle()

  const {
    micData,
    micError,
    isListening,
    hasBackend,
    startListening,
    stopListening,
    handleSourceChange,
    tapTempo,
    audioDevices,
    selectedDeviceId,
    changeDevice,
    startSystemAudio
  } = useAudio()

  const visualType = useStore(state => state.visualType)
  const setVisualType = useStore(state => state.setVisualType)
  const showOverlays = useStore(state => state.showOverlays)
  const fxEnabled = useStore(state => state.fxEnabled)
  const ppConfig = useStore(state => state.ppConfig)
  const glContext = useStore(state => state.glContext)
  const setGlContext = useStore(state => state.setGlContext)
  const canvasSize = useStore(state => state.canvasSize)
  const setCanvasSize = useStore(state => state.setCanvasSize)
  const setShowCode = useStore(state => state.setShowCode)
  const shaderCode = useStore(state => state.shaderCode)
  const setActiveCustomShader = useStore(state => state.setActiveCustomShader)

  const [ppState, ppControls] = usePostProcessing(
    fxEnabled ? glContext : null,
    canvasSize.width,
    canvasSize.height
  )

  const glContextRef = useRef<WebGLRenderingContext | null>(null)
  const astrofoxRef = useRef<AstrofoxVisualiserRef>(null)
  const handleContextCreated = useCallback(
    (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => {
      if (glContextRef.current !== gl) {
        glContextRef.current = gl
        setGlContext(gl)
      }
      // Always update size if it changed, even if context is the same
      if (canvasSize.width !== canvas.width || canvasSize.height !== canvas.height) {
        setCanvasSize({ width: canvas.width, height: canvas.height })
      }
    },
    [setGlContext, setCanvasSize, canvasSize.width, canvasSize.height]
  )

  const handleTypeChange = useCallback(
    (type: VisualisationType) => {
      if (type !== useStore.getState().visualType) {
        setVisualType(type)
        setActiveCustomShader(undefined)
        setShowCode(false)
      }
    },
    [setVisualType, setActiveCustomShader, setShowCode]
  )

  const { handlePrevVisualizer, handleNextVisualizer } = useVisualizerNavigation(
    visualType,
    handleTypeChange
  )

  const { handleReset, handleResetAll } = useVisualizerReset()

  const butterchurnRef = useRef<any>(null)
  const config = useStore(state => state.visualizerConfigs[visualType]) || DEFAULT_CONFIGS[visualType] || {}
  const updateVisualizerConfig = useStore(state => state.updateVisualizerConfig)
  const handleEffectConfig = useCallback((update: any) => {
    updateVisualizerConfig(visualType, update)
  }, [visualType, updateVisualizerConfig])

  return (
    <>
      <QueryParamHandler />
      <AutoChangeHandler onTypeChange={handleTypeChange} />
      <WindowApiHandler butterchurnRef={butterchurnRef} fullscreenHandle={fullscreenHandle} />
      <LifecycleEffectsHandler ppState={ppState} ppControls={ppControls} ppConfig={ppConfig} />

      <RootGrid background={configData?.background}>
        <CanvasCard background={configData?.background}>
          {!configData?.background && showOverlays && (
            <VisualizerControls
              onClose={onClose}
              micError={micError}
              isListening={isListening}
              micData={micData}
              hasBackend={hasBackend}
              handlePrevVisualizer={handlePrevVisualizer}
              handleNextVisualizer={handleNextVisualizer}
              handleTypeChange={handleTypeChange}
              handleSourceChange={handleSourceChange}
              startListening={startListening}
              stopListening={stopListening}
              fullscreenHandle={fullscreenHandle}
              audioDevices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              changeDevice={changeDevice}
              startSystemAudio={startSystemAudio}
            />
          )}
          <VisualiserCanvas
            theme={theme}
            configData={configData}
            butterchurnRef={butterchurnRef}
            astrofoxRef={astrofoxRef}
            fullscreenHandle={fullscreenHandle}
            handleContextCreated={handleContextCreated}
            ppControls={ppControls}
            ppState={ppState}
          />
        </CanvasCard>
        {!configData?.background && showOverlays && (
          <>
            <Grid size={{ xs: 12, md: visualType === 'astrofox' ? 12 : 8 }}>
              <ConfigurationPanel
                handleApplyShader={() => setActiveCustomShader(shaderCode)}
                handleReset={handleReset}
                astrofoxRef={astrofoxRef}
                ppState={ppState}
                config={config}
                setConfig={() => {}}
                handleEffectConfig={handleEffectConfig}
                ConfigFormComponent={ConfigFormComponent}
                effects={effects}
              />
            </Grid>
            {visualType !== 'astrofox' && (
              <Grid size={{ xs: 12, md: 4 }}>
                <PresetsPanel
                  handleTypeChange={handleTypeChange}
                  handleResetAll={handleResetAll}
                  micData={micData}
                  tapTempo={tapTempo}
                />
              </Grid>
            )}
          </>
        )}
      </RootGrid>
      <SaveErrorSnackbar />
    </>
  )
}

VisualiserIsoInner.displayName = 'VisualiserIsoInner'

export const VisualiserIso = (props: VisualiserIsoProps) => {
  return (
    <ThemeProvider theme={props.theme}>
      <AudioProvider backendAudioData={props.backendAudioData}>
        <VisualiserIsoInner {...props} />
      </AudioProvider>
    </ThemeProvider>
  )
}

VisualiserIso.displayName = 'VisualiserIso'

// Export as default for backwards compatibility
export default VisualiserIso
