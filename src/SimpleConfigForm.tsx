import { Box, Slider, Stack, Typography } from '@mui/material'

// Simple fallback form for standalone mode
const SimpleConfigForm = ({ config, onChange }: any) => {
  const handleChange = (key: string, value: any) => {
    onChange({ [key]: value })
  }

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
