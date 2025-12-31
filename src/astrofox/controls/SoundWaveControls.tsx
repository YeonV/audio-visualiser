/**
 * Sound Wave Layer Controls
 */

import {
  Box,
  TextField,
  Slider,
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material'
import type { SoundWaveLayer } from '../types'

export interface SoundWaveControlsProps {
  layer: SoundWaveLayer
  onUpdate: (updates: Partial<SoundWaveLayer>) => void
}

export function SoundWaveControls({ layer, onUpdate }: SoundWaveControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        SOUNDWAVE
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="Color"
        type="color"
        value={layer.color}
        onChange={(e) => onUpdate({ color: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Line Width: {layer.lineWidth}
      </Typography>
      <Slider
        value={layer.lineWidth}
        onChange={(_, v) => onUpdate({ lineWidth: v as number })}
        min={1}
        max={10}
        size="small"
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Width"
          type="number"
          value={layer.width}
          onChange={(e) => onUpdate({ width: Number(e.target.value) })}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          label="Height"
          type="number"
          value={layer.height}
          onChange={(e) => onUpdate({ height: Number(e.target.value) })}
          sx={{ flex: 1 }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        Wavelength: {layer.wavelength.toFixed(2)}
      </Typography>
      <Slider
        value={layer.wavelength}
        onChange={(_, v) => onUpdate({ wavelength: v as number })}
        min={0}
        max={1}
        step={0.01}
        size="small"
      />

      <Typography variant="caption" color="text.secondary">
        Smooth: {layer.smooth.toFixed(2)}
      </Typography>
      <Slider
        value={layer.smooth}
        onChange={(_, v) => onUpdate({ smooth: v as number })}
        min={0}
        max={0.99}
        step={0.01}
        size="small"
      />

      <FormControlLabel
        control={
          <Switch
            checked={layer.useFill}
            onChange={(e) => onUpdate({ useFill: e.target.checked })}
            size="small"
          />
        }
        label="Fill"
      />
    </>
  )
}

export default SoundWaveControls
