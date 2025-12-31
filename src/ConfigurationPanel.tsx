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
  Slider
} from '@mui/material'
import { Code, AutoFixHigh } from '@mui/icons-material'
import { WebGLVisualisationType } from './WebGLVisualiser'
import { AstrofoxVisualiserRef, ASTROFOX_PRESETS, getAstrofoxPresetLayers } from './AstrofoxVisualiser'
import { PostProcessingPanel } from './PostProcessingPanel'
import SimpleConfigForm from './SimpleConfigForm'
import {
  DEFAULT_CONFIGS,
  orderEffectProperties,
  VISUAL_TO_BACKEND_EFFECT,
  VISUALISER_SCHEMAS
} from './visualizerConstants'

interface ConfigurationPanelProps {
  visualType: string
  showCode: boolean
  setShowCode: (show: boolean) => void
  shaderCode: string
  setShaderCode: (code: string) => void
  handleApplyShader: () => void
  handleReset: () => void
  astrofoxConfig: any
  setAstrofoxConfig: React.Dispatch<React.SetStateAction<any>>
  astrofoxReady: boolean
  astrofoxRef: RefObject<AstrofoxVisualiserRef | null>
  butterchurnConfig: any
  setButterchurnConfig: React.Dispatch<React.SetStateAction<any>>
  fluidConfig: any
  setFluidConfig: React.Dispatch<React.SetStateAction<any>>
  fxEnabled: boolean
  setFxEnabled: React.Dispatch<React.SetStateAction<boolean>>
  showFxPanel: boolean
  setShowFxPanel: React.Dispatch<React.SetStateAction<boolean>>
  ppConfig: any
  setPpConfig: React.Dispatch<React.SetStateAction<any>>
  ppState: any
  config: any
  setConfig: React.Dispatch<React.SetStateAction<any>>
  handleEffectConfig: (config: any) => void
  ConfigFormComponent?: React.ComponentType<any>
  effects?: any
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  visualType,
  showCode,
  setShowCode,
  shaderCode,
  setShaderCode,
  handleApplyShader,
  handleReset,
  astrofoxConfig,
  setAstrofoxConfig,
  astrofoxReady,
  astrofoxRef,
  butterchurnConfig,
  setButterchurnConfig,
  fluidConfig,
  setFluidConfig,
  fxEnabled,
  setFxEnabled,
  showFxPanel,
  setShowFxPanel,
  ppConfig,
  setPpConfig,
  ppState,
  config,
  handleEffectConfig,
  ConfigFormComponent,
  effects
}) => {
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
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Quick Presets
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {ASTROFOX_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    setAstrofoxConfig((prev: any) => ({
                      ...prev,
                      layers: getAstrofoxPresetLayers(preset)
                    }))
                  }
                  sx={{ textTransform: 'capitalize' }}
                >
                  {preset}
                </Button>
              ))}
            </Box>

            {/* Background Color */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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

            <Divider sx={{ my: 2 }} />

            {/* Full Layer Controls from Astrofox component */}
            {astrofoxReady && astrofoxRef.current?.renderControls()}
            {!astrofoxReady && (
              <Typography variant="caption" color="text.secondary">
                Loading layer controls...
              </Typography>
            )}
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
            // Use custom form component if provided (integrated mode)
            if (ConfigFormComponent && effects) {
              const backendEffectType = VISUAL_TO_BACKEND_EFFECT[visualType]
              const schemaProperties =
                backendEffectType && effects[backendEffectType]
                  ? orderEffectProperties(
                      effects[backendEffectType].schema,
                      effects[backendEffectType].hidden_keys,
                      effects[backendEffectType].advanced_keys,
                      config.advanced
                    )
                  : VISUALISER_SCHEMAS[visualType] || []

              return (
                <ConfigFormComponent
                  handleEffectConfig={handleEffectConfig}
                  virtId="visualiser"
                  schemaProperties={schemaProperties}
                  model={config}
                  selectedType={visualType}
                  descriptions="Show"
                />
              )
            }

            // Fallback to simple form (standalone mode)
            return <SimpleConfigForm config={config} onChange={handleEffectConfig} />
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
                  onChange={(newConfig) =>
                    setPpConfig((prev: any) => ({ ...prev, ...newConfig }))
                  }
                  enabledEffects={ppState.enabledEffects}
                />
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ConfigurationPanel
