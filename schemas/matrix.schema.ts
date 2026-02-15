import { VisualizerSchema, colorProp, numberProp, integerProp } from './base.schema'

export const matrixSchema: VisualizerSchema = {
  $id: 'matrix',
  displayName: 'Matrix Rain',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#00ff41', {
      description: 'Main color of the falling characters',
      ui: { order: 0, section: 'Colors' }
    }),
    secondaryColor: colorProp('Secondary Color', '#003b00', {
      description: 'Background/trail color',
      ui: { order: 1, section: 'Colors' }
    }),
    audioSensitivity: numberProp('Sensitivity', 1.5, {
      description: 'How much the rain reacts to audio',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 2, section: 'Audio' }
    }),
    audioSmoothing: numberProp('Smoothing', 0.5, {
      description: 'Smoothness of audio reactivity',
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
    speed: numberProp('Fall Speed', 1.0, {
      description: 'Speed of the falling rain',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 5, section: 'Visual' }
    }),
    gradient: colorProp('Gradient', 'linear-gradient(90deg, rgb(0, 255, 65) 0%, rgb(0, 59, 0) 100%)', {
      description: 'Optional gradient override',
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
    tags: ['retro', 'classic', 'digital'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
