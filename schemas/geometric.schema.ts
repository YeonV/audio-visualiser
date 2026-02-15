import { VisualizerSchema, colorProp, numberProp } from './base.schema'

export const geometricSchema: VisualizerSchema = {
  $id: 'geometric',
  displayName: 'Geometric Pulse',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#ff0000', {
      description: 'Main color of shapes',
      ui: { order: 0, section: 'Colors' }
    }),
    secondaryColor: colorProp('Secondary Color', '#0000ff', {
      description: 'Edge/glow color',
      ui: { order: 1, section: 'Colors' }
    }),
    audioSensitivity: numberProp('Sensitivity', 1.5, {
      description: 'Audio reactivity strength',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 2, section: 'Audio' }
    }),
    audioSmoothing: numberProp('Smoothing', 0.4, {
      description: 'Smoothness of pulses',
      minimum: 0,
      maximum: 1.0,
      ui: { order: 3, section: 'Audio' }
    }),
    brightness: numberProp('Brightness', 1.0, {
      description: 'Overall brightness',
      minimum: 0,
      maximum: 2.0,
      ui: { order: 4, section: 'Visual' }
    }),
    speed: numberProp('Rotation Speed', 1.0, {
      description: 'Speed of shape rotation',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 5, section: 'Motion' }
    }),
    gradient: colorProp('Gradient', 'linear-gradient(90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)', {
      description: 'Optional shapes gradient',
      isGradient: true,
      ui: { order: 6, section: 'Colors' }
    }),
    gradient_roll: numberProp('Gradient Roll', 0, {
      description: 'Speed of gradient animation',
      minimum: 0,
      maximum: 10,
      ui: { order: 7, section: 'Colors' }
    })
  },
  required: ['primaryColor', 'secondaryColor', 'audioSensitivity', 'audioSmoothing', 'brightness', 'speed'],
  metadata: {
    category: 'Original Effects',
    tags: ['geometric', 'shapes', 'pulse'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
