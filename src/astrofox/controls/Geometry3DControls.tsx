/**
 * 3D Geometry Layer Controls
 */

import {
  TextField,
  Slider,
  Typography,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import type { Geometry3DLayer, GeometryShape, GeometryMaterial, ShadingType } from '../types'
import { GEOMETRY_SHAPES, GEOMETRY_MATERIALS, SHADING_TYPES } from '../types'

export interface Geometry3DControlsProps {
  layer: Geometry3DLayer
  onUpdate: (updates: Partial<Geometry3DLayer>) => void
}

export function Geometry3DControls({ layer, onUpdate }: Geometry3DControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        3D GEOMETRY
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Shape</InputLabel>
        <Select
          value={layer.shape}
          label="Shape"
          onChange={(e: SelectChangeEvent) =>
            onUpdate({ shape: e.target.value as GeometryShape })
          }
        >
          {GEOMETRY_SHAPES.map((shape) => (
            <MenuItem key={shape} value={shape}>
              {shape}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Material</InputLabel>
        <Select
          value={layer.material}
          label="Material"
          onChange={(e: SelectChangeEvent) =>
            onUpdate({ material: e.target.value as GeometryMaterial })
          }
        >
          {GEOMETRY_MATERIALS.map((mat) => (
            <MenuItem key={mat} value={mat}>
              {mat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Shading</InputLabel>
        <Select
          value={layer.shading}
          label="Shading"
          onChange={(e: SelectChangeEvent) =>
            onUpdate({ shading: e.target.value as ShadingType })
          }
        >
          {SHADING_TYPES.map((shade) => (
            <MenuItem key={shade} value={shade}>
              {shade}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
            checked={layer.wireframe}
            onChange={(e) => onUpdate({ wireframe: e.target.checked })}
            size="small"
          />
        }
        label="Wireframe"
      />

      <FormControlLabel
        control={
          <Switch
            checked={layer.edges}
            onChange={(e) => onUpdate({ edges: e.target.checked })}
            size="small"
          />
        }
        label="Edges"
      />

      {layer.edges && (
        <TextField
          fullWidth
          size="small"
          label="Edge Color"
          type="color"
          value={layer.edgeColor}
          onChange={(e) => onUpdate({ edgeColor: e.target.value })}
          sx={{ mb: 2 }}
        />
      )}

      <Typography variant="caption" color="text.secondary">
        Rotation X: {layer.rotationX}°
      </Typography>
      <Slider
        value={layer.rotationX}
        onChange={(_, v) => onUpdate({ rotationX: v as number })}
        min={0}
        max={360}
        size="small"
      />

      <Typography variant="caption" color="text.secondary">
        Rotation Y: {layer.rotationY}°
      </Typography>
      <Slider
        value={layer.rotationY}
        onChange={(_, v) => onUpdate({ rotationY: v as number })}
        min={0}
        max={360}
        size="small"
      />

      <Typography variant="caption" color="text.secondary">
        Rotation Z: {layer.rotationZ}°
      </Typography>
      <Slider
        value={layer.rotationZ}
        onChange={(_, v) => onUpdate({ rotationZ: v as number })}
        min={0}
        max={360}
        size="small"
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

export default Geometry3DControls
