import React, { RefObject } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tooltip,
  Button,
  IconButton,
  TextField,
  Divider,
  Slider,
  Grid
} from '@mui/material'
import { Code, AutoFixHigh, Save, Delete } from '@mui/icons-material'
import { type WebGLVisualisationType, type AstrofoxVisualiserRef, ASTROFOX_PRESETS, getAstrofoxPresetLayers } from '../Visualisers'
import type { CustomAstrofoxPreset } from '../../store/visualizer/storeConfigs'
import { PostProcessingPanel } from './PostProcessingPanel'
import SimpleConfigForm from '../SimpleConfigForm'
import { DEFAULT_CONFIGS } from '../../_generated/webgl/defaults'
import { VISUAL_TO_BACKEND_EFFECT } from '../../_generated/webgl/backend-mapping'
import { VISUALISER_SCHEMAS } from '../../_generated/webgl/schemas'
import { VISUALIZER_REGISTRY } from '../../_generated/registry'
import { orderEffectProperties } from '../../utils/webgl'
import { useStore } from '../../store'
import AstrofoxLayerPanel from './AstrofoxLayerPanel'

interface ConfigurationPanelProps {
  handleApplyShader: () => void
  handleReset: () => void
  astrofoxRef: RefObject<AstrofoxVisualiserRef | null>
  ppState: any
  config: any
  setConfig: React.Dispatch<React.SetStateAction<any>>
  handleEffectConfig: (config: any) => void
  ConfigFormComponent?: React.ComponentType<any>
  effects?: any
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  handleApplyShader,
  handleReset,
  astrofoxRef,
  ppState,
  config,
  handleEffectConfig,
  ConfigFormComponent,
  effects
}) => {
  const visualType = useStore(state => state.visualType)
  const showCode = useStore(state => state.showCode)
  const setShowCode = useStore(state => state.setShowCode)
  const shaderCode = useStore(state => state.shaderCode)
  const setShaderCode = useStore(state => state.setShaderCode)
  const astrofoxConfig = useStore(state => state.astrofoxConfig)
  const setAstrofoxConfig = useStore(state => state.setAstrofoxConfig)
  const astrofoxReady = useStore(state => state.astrofoxReady)
  const customAstrofoxPresets = useStore(state => state.customAstrofoxPresets)
  const saveCustomAstrofoxPreset = useStore(state => state.saveCustomAstrofoxPreset)
  const deleteCustomAstrofoxPreset = useStore(state => state.deleteCustomAstrofoxPreset)
  const butterchurnConfig = useStore(state => state.butterchurnConfig)
  const setButterchurnConfig = useStore(state => state.setButterchurnConfig)
  const fluidConfig = useStore(state => state.visualizerConfigs.fluid)
  const updateVisualizerConfig = useStore(state => state.updateVisualizerConfig)
  const fxEnabled = useStore(state => state.fxEnabled)
  const setFxEnabled = useStore(state => state.setFxEnabled)
  const showFxPanel = useStore(state => state.showFxPanel)
  const setShowFxPanel = useStore(state => state.setShowFxPanel)
  const ppConfig = useStore(state => state.ppConfig)
  const updatePpConfig = useStore(state => state.updatePpConfig)
  const globalSmoothing = useStore(state => state.globalSmoothing)
  const setGlobalSmoothing = useStore(state => state.setGlobalSmoothing)
  const whiteCircleFix = useStore(state => state.whiteCircleFix)
  const setWhiteCircleFix = useStore(state => state.setWhiteCircleFix)
  const outerGlowMode = useStore(state => state.outerGlowMode)
  const setOuterGlowMode = useStore(state => state.setOuterGlowMode)
  const textAutoFit = useStore(state => state.textAutoFit)
  const setTextAutoFit = useStore(state => state.setTextAutoFit)

  const setFluidConfig = (update: any) => {
    updateVisualizerConfig('fluid', typeof update === 'function' ? update(fluidConfig) : update)
  }

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="h6">Configuration</Typography>
            <Box>
              <Tooltip title="Reset to Defaults">
                <Button size="small" onClick={handleReset} sx={{ mr: 1 }}>
                  Reset
                </Button>
              </Tooltip>
              <Tooltip title="Edit Shader">
              <IconButton
                onClick={() => setShowCode(!showCode)}
                color={showCode ? 'primary' : 'default'}
              >
                <Code />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {showCode ? (
          <Box sx={{ p: 0 }}>
            <TextField
              fullWidth
              multiline
              minRows={10}
              maxRows={15}
              value={shaderCode}
              onChange={(e) => setShaderCode(e.target.value)}
              variant="outlined"
              sx={{ fontFamily: 'monospace', mb: 2 }}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '12px' } }}
            />
            <Button variant="contained" onClick={handleApplyShader} fullWidth>
              Apply Shader
            </Button>
          </Box>
        ) : visualType === 'butterchurn' ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Preset Cycling
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Cycle Interval</Typography>
                <Typography variant="caption" color="text.secondary">
                  {butterchurnConfig.cycleInterval === 0 ? 'Off' : `${butterchurnConfig.cycleInterval}s`}
                </Typography>
              </Box>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={butterchurnConfig.cycleInterval}
                onChange={(e) =>
                  setButterchurnConfig((prev: any) => ({
                    ...prev,
                    cycleInterval: Number(e.target.value)
                  }))
                }
                style={{ width: '100%' }}
              />
              <Typography variant="caption" color="text.secondary">
                Time between automatic preset changes (0 = disabled)
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Blend Time</Typography>
                <Typography variant="caption" color="text.secondary">
                  {butterchurnConfig.blendTime}s
                </Typography>
              </Box>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={butterchurnConfig.blendTime}
                onChange={(e) =>
                  setButterchurnConfig((prev: any) => ({
                    ...prev,
                    blendTime: Number(e.target.value)
                  }))
                }
                style={{ width: '100%' }}
              />
              <Typography variant="caption" color="text.secondary">
                Transition duration when switching presets
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={butterchurnConfig.shufflePresets}
                  onChange={(e) =>
                    setButterchurnConfig((prev: any) => ({
                      ...prev,
                      shufflePresets: e.target.checked
                    }))
                  }
                />
                <Typography variant="body2">Shuffle Presets</Typography>
              </label>
              <Typography variant="caption" color="text.secondary" sx={{ pl: 3.5 }}>
                Randomize preset order when cycling
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary">
              Use the controls on the visualizer to manually switch presets, or adjust the cycle interval above for automatic changes.
            </Typography>
          </Box>
        ) : visualType === 'astrofox' ? (
          <Box>
            {/* Quick Presets */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Quick Presets
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Save />}
                onClick={() => {
                  const name = window.prompt('Enter preset name:')
                  if (name && name.trim()) {
                    const currentLayers = astrofoxRef.current?.layers || []
                    const presetData = {
                      name: name.trim(),
                      layers: currentLayers,
                      backgroundColor: astrofoxConfig.backgroundColor
                    }

                    saveCustomAstrofoxPreset(
                      presetData.name,
                      presetData.layers,
                      presetData.backgroundColor
                    )
                  }
                }}
                sx={{ textTransform: 'none' }}
              >
                Save
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {/* Built-in presets */}
              {ASTROFOX_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const presetLayers = getAstrofoxPresetLayers(preset)
                    setAstrofoxConfig((prev: any) => ({
                      ...prev,
                      layers: presetLayers
                    }))
                  }}
                  sx={{ textTransform: 'capitalize' }}
                >
                  {preset}
                </Button>
              ))}

              {/* Custom presets */}
              {customAstrofoxPresets.map((preset: CustomAstrofoxPreset) => (
                <Box key={preset.name} sx={{ position: 'relative', display: 'inline-block' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      setAstrofoxConfig((prev: any) => ({
                        ...prev,
                        layers: JSON.parse(JSON.stringify(preset.layers)),
                        backgroundColor: preset.backgroundColor
                      }))
                    }
                    sx={{ textTransform: 'none', pr: 4 }}
                  >
                    {preset.name}
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (window.confirm(`Delete preset "${preset.name}"?`)) {
                        deleteCustomAstrofoxPreset(preset.name)
                      }
                    }}
                    sx={{
                      position: 'absolute',
                      right: 2,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '2px',
                      '&:hover': { color: 'error.main' }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>

            {/* Background & Main Colors */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 2 }}>
              {/* Background Color */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Background:</Typography>
                <input
                  type="color"
                  value={astrofoxConfig.backgroundColor}
                  onChange={(e) =>
                    setAstrofoxConfig((prev: any) => ({
                      ...prev,
                      backgroundColor: e.target.value
                    }))
                  }
                  style={{ width: 40, height: 30, cursor: 'pointer', border: 'none' }}
                />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  {astrofoxConfig.backgroundColor}
                </Typography>
              </Box>
              {/* Primary Color */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Primary:</Typography>
                <input
                  type="color"
                  value={astrofoxConfig.primaryColor || '#ffffff'}
                  onChange={(e) =>
                    setAstrofoxConfig((prev: any) => ({
                      ...prev,
                      primaryColor: e.target.value
                    }))
                  }
                  style={{ width: 40, height: 30, cursor: 'pointer', border: 'none' }}
                />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  {astrofoxConfig.primaryColor}
                </Typography>
              </Box>
              {/* Secondary Color */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Secondary:</Typography>
                <input
                  type="color"
                  value={astrofoxConfig.secondaryColor || '#ffffff'}
                  onChange={(e) =>
                    setAstrofoxConfig((prev: any) => ({
                      ...prev,
                      secondaryColor: e.target.value
                    }))
                  }
                  style={{ width: 40, height: 30, cursor: 'pointer', border: 'none' }}
                />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  {astrofoxConfig.secondaryColor}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Astrofox Layer Panel */}
            <AstrofoxLayerPanel astrofoxRef={astrofoxRef} />
          </Box>
        ) : visualType === 'fluid' ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Fluid Simulation Settings
            </Typography>

            {/* Colors */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Primary:</Typography>
                <input
                  type="color"
                  value={fluidConfig.primaryColor}
                  onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, primaryColor: e.target.value }))}
                  style={{ width: 40, height: 30, cursor: 'pointer', border: 'none' }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Secondary:</Typography>
                <input
                  type="color"
                  value={fluidConfig.secondaryColor}
                  onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, secondaryColor: e.target.value }))}
                  style={{ width: 40, height: 30, cursor: 'pointer', border: 'none' }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Tertiary:</Typography>
                <input
                  type="color"
                  value={fluidConfig.tertiaryColor}
                  onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, tertiaryColor: e.target.value }))}
                  style={{ width: 40, height: 30, cursor: 'pointer', border: 'none' }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Audio Reactivity */}
            <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.7 }}>Audio Reactivity</Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2">Audio Sensitivity</Typography>
                <Typography variant="caption">{fluidConfig.audioSensitivity.toFixed(1)}</Typography>
              </Box>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={fluidConfig.audioSensitivity}
                onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, audioSensitivity: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2">Bass Multiplier</Typography>
                <Typography variant="caption">{fluidConfig.bassMultiplier.toFixed(1)}</Typography>
              </Box>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={fluidConfig.bassMultiplier}
                onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, bassMultiplier: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Simulation Parameters */}
            <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.7 }}>Simulation</Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2">Curl (Swirl)</Typography>
                <Typography variant="caption">{fluidConfig.curl}</Typography>
              </Box>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={fluidConfig.curl}
                onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, curl: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2">Dissipation</Typography>
                <Typography variant="caption">{fluidConfig.densityDissipation.toFixed(2)}</Typography>
              </Box>
              <input
                type="range"
                min="0.9"
                max="1"
                step="0.005"
                value={fluidConfig.densityDissipation}
                onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, densityDissipation: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2">Splat Force</Typography>
                <Typography variant="caption">{fluidConfig.splatForce}</Typography>
              </Box>
              <input
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={fluidConfig.splatForce}
                onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, splatForce: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Toggles */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fluidConfig.autoInject}
                  onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, autoInject: e.target.checked }))}
                />
                <Typography variant="body2">Auto Inject</Typography>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fluidConfig.bloom}
                  onChange={(e) => setFluidConfig((prev: any) => ({ ...prev, bloom: e.target.checked }))}
                />
                <Typography variant="body2">Bloom</Typography>
              </label>
            </Box>
          </Box>
        ) : (
          (() => {
            const uiSchema = VISUALIZER_REGISTRY[visualType]?.getUISchema?.(config)

            // Use custom form component if provided (integrated mode)
            if (ConfigFormComponent && effects) {
              return (
                <ConfigFormComponent
                  schema={uiSchema}
                  model={config}
                  onModelChange={(update: any) => handleEffectConfig(update)}
                  hideToggle={true}
                />
              )
            }

            // Fallback to simple form (standalone mode)
            return <SimpleConfigForm config={config} onChange={handleEffectConfig} schema={uiSchema} />
          })()
        )}

        {/* FX Panel - Collapsible */}
        {fxEnabled && (
          <Box sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                cursor: 'pointer'
              }}
              onClick={() => setShowFxPanel(!showFxPanel)}
            >
              <Typography
                variant="subtitle2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <AutoFixHigh fontSize="small" color="secondary" />
                Post-Processing Effects
                {ppState.enabledEffects.length > 0 && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    ({ppState.enabledEffects.length} active)
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {showFxPanel ? '▲' : '▼'}
              </Typography>
            </Box>

            {showFxPanel && (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <PostProcessingPanel
                  config={ppConfig}
                  onChange={(newConfig) => updatePpConfig(newConfig)}
                  enabledEffects={ppState.enabledEffects}
                />
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Global Fixes & Performance
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">Audio Smoothing</Typography>
              <Typography variant="caption" color="text.secondary">
                {(globalSmoothing * 100).toFixed(0)}%
              </Typography>
            </Box>
            <Slider
              size="small"
              min={0}
              max={0.99}
              step={0.01}
              value={globalSmoothing}
              onChange={(_, val) => setGlobalSmoothing(val as number)}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>White Circle Fix Mode</Typography>
            <Grid container spacing={1}>
              {['original', 'energy', 'clamp'].map((mode) => (
                <Grid size={{ xs: 4 }} key={mode}>
                  <Button
                    fullWidth
                    variant={whiteCircleFix === mode ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setWhiteCircleFix(mode as any)}
                    sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                  >
                    {mode}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Outer Glow Mode</Typography>
            <Grid container spacing={1}>
              {['original', 'strengthened'].map((mode) => (
                <Grid size={{ xs: 6 }} key={mode}>
                  <Button
                    fullWidth
                    variant={outerGlowMode === mode ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setOuterGlowMode(mode as any)}
                    sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                  >
                    {mode}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mb: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={textAutoFit}
                onChange={(e) => setTextAutoFit(e.target.checked)}
              />
              <Typography variant="body2">Text Auto-Fit (Enlarge texture to fit text)</Typography>
            </label>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ConfigurationPanel
