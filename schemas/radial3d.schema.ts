import { VisualizerSchema, numberProp, colorProp } from './base.schema'

export const radial3dSchema: VisualizerSchema = {
  $id: 'radial3d',
  displayName: 'Radial Spectrum',
  type: 'object',
  properties: {
    audioSensitivity: numberProp('Sensitivity', 1.0, {
      description: 'Response strength',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 0, section: 'Audio' }
    }),
    audioSmoothing: numberProp('Smoothing', 0.5, {
      description: 'Smoothness of growth',
      minimum: 0,
      maximum: 1.0,
      ui: { order: 1, section: 'Audio' }
    }),
    brightness: numberProp('Brightness', 1.0, {
      description: 'Overall brightness',
      minimum: 0,
      maximum: 2.0,
      ui: { order: 2, section: 'Visual' }
    }),
    primaryColor: colorProp('Primary Color', '#1976d2', {
      description: 'Main color of the radial bars',
      ui: { order: 3, section: 'Colors' }
    }),
    secondaryColor: colorProp('Secondary Color', '#dc004e', {
      description: 'Secondary color for blending',
      ui: { order: 4, section: 'Colors' }
    }),
    gradient: colorProp('Gradient', 'linear-gradient(90deg, #1976d2 0%, #dc004e 100%)', {
      description: 'CSS Gradient to use instead of colors',
      isGradient: true,
      ui: { order: 5, section: 'Colors' }
    }),
    gradient_roll: numberProp('Gradient Animation Speed', 0.0, {
      description: 'Speed of gradient movement',
      minimum: -2.0,
      maximum: 2.0,
      step: 0.1,
      ui: { order: 6, section: 'Colors' }
    })
  },
  required: ['audioSensitivity', 'audioSmoothing', 'brightness'],
  metadata: {
    category: 'Original Effects',
    tags: ['3d', 'spectrum', 'radial'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
