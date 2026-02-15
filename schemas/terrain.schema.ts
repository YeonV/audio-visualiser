import { VisualizerSchema, colorProp, numberProp } from './base.schema'

export const terrainSchema: VisualizerSchema = {
  $id: 'terrain',
  displayName: 'Synthwave Terrain',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#ff00ff', {
      description: 'Main color of the terrain and sun',
      ui: { order: 0, section: 'Colors' }
    }),
    secondaryColor: colorProp('Secondary Color', '#00ffff', {
      description: 'Sky and glow color',
      ui: { order: 1, section: 'Colors' }
    }),
    audioSensitivity: numberProp('Sensitivity', 1.2, {
      description: 'How much the terrain height reacts to audio',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 2, section: 'Audio' }
    }),
    audioSmoothing: numberProp('Smoothing', 0.6, {
      description: 'Smoothness of terrain motion',
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
    speed: numberProp('Scroll Speed', 1.0, {
      description: 'Speed of terrain movement',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 5, section: 'Motion' }
    }),
    gradient: colorProp('Gradient', 'linear-gradient(90deg, rgb(255, 0, 255) 0%, rgb(0, 255, 255) 100%)', {
      description: 'Optional terrain line gradient',
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
    tags: ['retro', '3d', 'wireframe'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
