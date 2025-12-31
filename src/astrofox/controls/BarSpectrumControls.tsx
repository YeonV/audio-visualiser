/**
 * Bar Spectrum Layer Controls
 */

import {
  Box,
  TextField,
  Slider,
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material'
import type { BarSpectrumLayer } from '../types'

export interface BarSpectrumControlsProps {
  layer: BarSpectrumLayer
  onUpdate: (updates: Partial<BarSpectrumLayer>) => void
}

export function BarSpectrumControls({ layer, onUpdate }: BarSpectrumControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        BAR SPECTRUM
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Bar Width"
          type="number"
          value={layer.barWidth}
          onChange={(e) => onUpdate({ barWidth: Number(e.target.value) })}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          label="Spacing"
          type="number"
          value={layer.barSpacing}
          onChange={(e) => onUpdate({ barSpacing: Number(e.target.value) })}
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Bar Color"
          type="color"
          value={layer.barColor}
          onChange={(e) => onUpdate({ barColor: e.target.value })}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          label="End Color"
          type="color"
          value={layer.barColorEnd}
          onChange={(e) => onUpdate({ barColorEnd: e.target.value })}
          sx={{ flex: 1 }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        Max dB: {layer.maxDecibels}
      </Typography>
      <Slider
        value={layer.maxDecibels}
        onChange={(_, v) => onUpdate({ maxDecibels: v as number })}
        min={-40}
        max={0}
        size="small"
      />

      <Typography variant="caption" color="text.secondary">
        Smoothing: {layer.smoothing.toFixed(2)}
      </Typography>
      <Slider
        value={layer.smoothing}
        onChange={(_, v) => onUpdate({ smoothing: v as number })}
        min={0}
        max={0.99}
        step={0.01}
        size="small"
      />

      <FormControlLabel
        control={
          <Switch
            checked={layer.mirror}
            onChange={(e) => onUpdate({ mirror: e.target.checked })}
            size="small"
          />
        }
        label="Mirror"
      />
    </>
  )
}

export default BarSpectrumControls
