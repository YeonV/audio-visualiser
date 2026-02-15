import { VisualizerSchema, colorProp, numberProp } from './base.schema'

export const waveform3dSchema: VisualizerSchema = {
  $id: 'waveform3d',
  displayName: 'Waveform',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#00ff00', {
      description: 'Waveform color',
      ui: { order: 0, section: 'Colors' }
    }),
    secondaryColor: colorProp('Secondary Color', '#ffffff', {
      description: 'Highlight color',
      ui: { order: 1, section: 'Colors' }
    }),
    audioSensitivity: numberProp('Sensitivity', 1.0, {
      description: 'Wave amplitude response',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 2, section: 'Audio' }
    }),
    audioSmoothing: numberProp('Smoothing', 0.5, {
      description: 'Smoothness of waveform',
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
    tags: ['3d', 'waveform', 'oscilloscope'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
