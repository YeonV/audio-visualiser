import { Box, Slider, Stack, Typography, Checkbox, FormControlLabel, TextField } from '@mui/material'

interface SimpleConfigFormProps {
  config: any
  onChange: (update: any) => void
  schema?: any
}

// Simple fallback form for standalone mode
// Improved to support dynamic schemas if available
const SimpleConfigForm = ({ config, onChange, schema }: SimpleConfigFormProps) => {
  const handleChange = (key: string, value: any) => {
    onChange({ [key]: value })
  }

  // If we have a schema, render a dynamic form
  if (schema && schema.properties) {
    return (
      <Stack spacing={3}>
        {Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
          // Skip internal or hidden properties if marked (though getUISchema already filters)
          if (prop.type === 'number' || prop.type === 'integer') {
            return (
              <Box key={key}>
                <Typography variant="body2" gutterBottom>{prop.title || key}</Typography>
                <Slider
                  value={config[key] ?? prop.default ?? 0}
                  min={prop.minimum ?? 0}
                  max={prop.maximum ?? (prop.type === 'integer' ? 100 : (key === 'sensitivity' ? 5 : 1.0))}
                  step={prop.step ?? (prop.type === 'integer' ? 1 : 0.01)}
                  onChange={(_, val) => handleChange(key, val)}
                  valueLabelDisplay="auto"
                />
                {prop.description && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {prop.description}
                  </Typography>
                )}
              </Box>
            )
          }

          if (prop.type === 'boolean') {
            return (
              <Box key={key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!(config[key] ?? prop.default)}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{prop.title || key}</Typography>}
                />
              </Box>
            )
          }

          if (prop.type === 'color') {
            return (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>{prop.title || key}:</Typography>
                <input
                  type="color"
                  value={config[key] ?? prop.default ?? '#000000'}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{ width: 40, height: 30, cursor: 'pointer', border: 'none', background: 'none' }}
                />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  {config[key] ?? prop.default}
                </Typography>
              </Box>
            )
          }

          if (prop.type === 'string' || prop.type === 'autocomplete') {
             return (
               <Box key={key}>
                 <TextField
                   fullWidth
                   label={prop.title || key}
                   value={config[key] ?? prop.default ?? ''}
                   onChange={(e) => handleChange(key, e.target.value)}
                   size="small"
                   variant="outlined"
                   helperText={prop.description}
                 />
               </Box>
             )
          }

          return null
        })}
      </Stack>
    )
  }

  // Default hardcoded fallback for visualizers without schema
  return (
    <Stack spacing={3}>
      <Box>
        <Typography gutterBottom>Sensitivity</Typography>
        <Slider
          value={config.sensitivity || 1}
          min={0.1}
          max={5}
          step={0.1}
          onChange={(_, val) => handleChange('sensitivity', val)}
          valueLabelDisplay="auto"
        />
      </Box>
      <Box>
        <Typography gutterBottom>Brightness</Typography>
        <Slider
          value={config.brightness || 1}
          min={0.1}
          max={2}
          step={0.1}
          onChange={(_, val) => handleChange('brightness', val)}
          valueLabelDisplay="auto"
        />
      </Box>
      <Box>
        <Typography gutterBottom>Smoothing</Typography>
        <Slider
          value={config.smoothing || 0.5}
          min={0}
          max={1}
          step={0.05}
          onChange={(_, val) => handleChange('smoothing', val)}
          valueLabelDisplay="auto"
        />
      </Box>
      <Box>
        <Typography gutterBottom>Speed</Typography>
        <Slider
          value={config.speed || 1}
          min={0.1}
          max={5}
          step={0.1}
          onChange={(_, val) => handleChange('speed', val)}
          valueLabelDisplay="auto"
        />
      </Box>
    </Stack>
  )
}

export default SimpleConfigForm
