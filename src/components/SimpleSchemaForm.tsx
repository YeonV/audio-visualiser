// src/components/SimpleSchemaForm.tsx
import { TextField, Switch, FormControlLabel, Stack, Typography } from '@mui/material'
import type { EffectSchemaProperty } from './AudioVisualiser.types'

interface SimpleSchemaFormProps {
  schemaProperties: EffectSchemaProperty[]
  values: Record<string, any>
  onChange: (newValues: Record<string, any>) => void
}

export const SimpleSchemaForm = ({ schemaProperties, values, onChange }: SimpleSchemaFormProps) => {
  const handleChange = (id: string, value: any) => {
    onChange({ ...values, [id]: value })
  }

  return (
    <Stack spacing={2}>
      {schemaProperties.map((prop) => {
        const value = values[prop.id] ?? prop.default

        if (prop.type === 'boolean') {
          return (
            <FormControlLabel
              key={prop.id}
              control={
                <Switch
                  checked={!!value}
                  onChange={(e) => handleChange(prop.id, e.target.checked)}
                />
              }
              label={prop.title}
            />
          )
        }

        if (prop.type === 'number' || prop.type === 'integer') {
          return (
            <TextField
              key={prop.id}
              label={prop.title}
              type="number"
              value={value ?? ''}
              onChange={(e) =>
                handleChange(
                  prop.id,
                  prop.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value)
                )
              }
              inputProps={{
                min: prop.min,
                max: prop.max,
                step: prop.step ?? (prop.type === 'integer' ? 1 : 0.1)
              }}
              size="small"
              fullWidth
            />
          )
        }

        if (prop.type === 'string') {
          if (prop.enum) {
            return (
              <TextField
                key={prop.id}
                select
                label={prop.title}
                value={value ?? ''}
                onChange={(e) => handleChange(prop.id, e.target.value)}
                SelectProps={{ native: true }}
                size="small"
                fullWidth
              >
                {prop.enum.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </TextField>
            )
          }
          return (
            <TextField
              key={prop.id}
              label={prop.title}
              value={value ?? ''}
              onChange={(e) => handleChange(prop.id, e.target.value)}
              size="small"
              fullWidth
            />
          )
        }

        if (prop.type === 'color') {
          return (
            <Stack key={prop.id} spacing={0.5}>
              <Typography variant="caption">{prop.title}</Typography>
              <input
                type="color"
                value={value ?? '#000000'}
                onChange={(e) => handleChange(prop.id, e.target.value)}
                style={{ width: '100%', height: 40, cursor: 'pointer' }}
              />
            </Stack>
          )
        }

        return null
      })}
    </Stack>
  )
}
