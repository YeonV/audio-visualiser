import { VisualizerSchema, numberProp } from './base.schema'

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
