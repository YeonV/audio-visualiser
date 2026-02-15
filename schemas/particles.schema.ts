import { VisualizerSchema, colorProp, numberProp, integerProp } from './base.schema'

export const particlesSchema: VisualizerSchema = {
  $id: 'particles',
  displayName: 'Particles',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#ffffff', {
      description: 'Main particle color',
      ui: { order: 0, section: 'Colors' }
    }),
    secondaryColor: colorProp('Secondary Color', '#1976d2', {
      description: 'Secondary particle color',
      ui: { order: 1, section: 'Colors' }
    }),
    audioSensitivity: numberProp('Sensitivity', 1.0, {
      description: 'How much audio intensity spawns particles',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 2, section: 'Audio' }
    }),
    audioSmoothing: numberProp('Smoothing', 0.5, {
      description: 'Smoothness of particle movement',
      minimum: 0,
      maximum: 1.0,
      ui: { order: 3, section: 'Audio' }
    }),
    brightness: numberProp('Brightness', 1.0, {
      description: 'Overall brightness',
      minimum: 0,
      maximum: 2.0,
      ui: { order: 4, section: 'Visual' }
    })
  },
  required: ['primaryColor', 'secondaryColor', 'audioSensitivity', 'audioSmoothing', 'brightness'],
  metadata: {
    category: 'Original Effects',
    tags: ['3d', 'particles', 'physics'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
