/**
 * Text Layer Controls
 */

import {
  Box,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import type { TextLayer } from '../types'

// Available fonts (from Astrofox fonts.json)
export const AVAILABLE_FONTS = [
  'Permanent Marker',
  'Abel',
  'Abril Fatface',
  'Bangers',
  'Cardo',
  'Caveat',
  'Merriweather',
  'Playfair Display',
  'Oswald',
  'Oxygen',
  'Racing Sans One',
  'Raleway',
  'Roboto',
  'Vast Shadow'
]

export interface TextControlsProps {
  layer: TextLayer
  onUpdate: (updates: Partial<TextLayer>) => void
}

export function TextControls({ layer, onUpdate }: TextControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        TEXT
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="Text"
        value={layer.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Font</InputLabel>
        <Select
          value={layer.font}
          label="Font"
          onChange={(e: SelectChangeEvent) => onUpdate({ font: e.target.value })}
        >
          {AVAILABLE_FONTS.map((font) => (
            <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
              {font}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        size="small"
        label="Size"
        type="number"
        value={layer.fontSize}
        onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={layer.bold}
              onChange={(e) => onUpdate({ bold: e.target.checked })}
              size="small"
            />
          }
          label="Bold"
        />
        <FormControlLabel
          control={
            <Switch
              checked={layer.italic}
              onChange={(e) => onUpdate({ italic: e.target.checked })}
              size="small"
            />
          }
          label="Italic"
        />
      </Box>

      <TextField
        fullWidth
        size="small"
        label="Color"
        type="color"
        value={layer.color}
        onChange={(e) => onUpdate({ color: e.target.value })}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={layer.audioReactive}
            onChange={(e) => onUpdate({ audioReactive: e.target.checked })}
            size="small"
          />
        }
        label="Audio Reactive"
      />
    </>
  )
}

export default TextControls
