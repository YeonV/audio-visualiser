/**
 * Common Layer Controls
 *
 * Controls shared by all layer types (name, opacity, position, rotation, blend mode)
 */

import {
  Box,
  TextField,
  Slider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  SelectChangeEvent
} from '@mui/material'
import type { AstrofoxLayer, BlendMode } from '../types'
import { BLEND_MODES } from '../types'

export interface CommonControlsProps {
  layer: AstrofoxLayer
  onUpdate: (updates: Partial<AstrofoxLayer>) => void
}

export function CommonControls({ layer, onUpdate }: CommonControlsProps) {
  return (
    <>
      <TextField
        fullWidth
        size="small"
        label="Name"
        value={layer.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Opacity: {layer.opacity.toFixed(2)}
      </Typography>
      <Slider
        value={layer.opacity}
        onChange={(_, v) => onUpdate({ opacity: v as number })}
        min={0}
        max={1}
        step={0.01}
        size="small"
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            X: {layer.x}
          </Typography>
          <Slider
            value={layer.x}
            onChange={(_, v) => onUpdate({ x: v as number })}
            min={-500}
            max={500}
            size="small"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Y: {layer.y}
          </Typography>
          <Slider
            value={layer.y}
            onChange={(_, v) => onUpdate({ y: v as number })}
            min={-500}
            max={500}
            size="small"
          />
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Rotation: {layer.rotation}°
      </Typography>
      <Slider
        value={layer.rotation}
        onChange={(_, v) => onUpdate({ rotation: v as number })}
        min={0}
        max={360}
        size="small"
      />

      <FormControl fullWidth size="small" sx={{ mt: 2 }}>
        <InputLabel>Blending</InputLabel>
        <Select
          value={layer.blendMode}
          label="Blending"
          onChange={(e: SelectChangeEvent) =>
            onUpdate({ blendMode: e.target.value as BlendMode })
          }
        >
          {BLEND_MODES.map((mode) => (
            <MenuItem key={mode} value={mode}>
              {mode.charAt(0).toUpperCase() + mode.slice(1).replace(/-/g, ' ')}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }} />
    </>
  )
}

export default CommonControls
