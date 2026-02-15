import { VisualizerSchema, colorProp, numberProp } from './base.schema'

export const bars3dSchema: VisualizerSchema = {
  $id: 'bars3d',
  displayName: 'Spectrum Bars',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#1976d2', {
      description: 'Color of the bars',
      ui: { order: 0, section: 'Colors' }
    }),
    secondaryColor: colorProp('Secondary Color', '#dc004e', {
      description: 'Top/peak color',
      ui: { order: 1, section: 'Colors' }
    }),
    audioSensitivity: numberProp('Sensitivity', 1.0, {
      description: 'Overall response height',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 2, section: 'Audio' }
    }),
    audioSmoothing: numberProp('Smoothing', 0.5, {
      description: 'Smoothness of bar motion',
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
    tags: ['3d', 'spectrum', 'classic'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
