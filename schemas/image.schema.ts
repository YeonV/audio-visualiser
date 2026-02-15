import { VisualizerSchema, colorProp, numberProp, booleanProp, stringProp } from './base.schema'

export const imageSchema: VisualizerSchema = {
  $id: 'image',
  displayName: 'Image',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#ffffff', {
      description: 'Image highlight color',
      ui: { order: 0, section: 'Colors' }
    }),
    secondaryColor: colorProp('Secondary Color', '#1976d2', {
      description: 'Image base color',
      ui: { order: 1, section: 'Colors' }
    }),
    bg_color: colorProp('Background Color', '#000000', {
      description: 'Background color',
      ui: { order: 2, section: 'Colors' }
    }),
    background_brightness: numberProp('Background Brightness', 1.0, {
      description: 'Brightness of the background',
      minimum: 0,
      maximum: 1.0,
      ui: { order: 3, section: 'Colors' }
    }),
    multiplier: numberProp('Sensitivity Multiplier', 0.5, {
      description: 'Audio reactivity strength',
      minimum: 0,
      maximum: 2.0,
      ui: { order: 4, section: 'Audio' }
    }),
    min_size: numberProp('Minimum Size', 0.3, {
      description: 'Base size of the shape',
      minimum: 0,
      maximum: 1.0,
      ui: { order: 5, section: 'Visual' }
    }),
    frequency_range: numberProp('Frequency Range', 0, {
      description: 'Audio range (0=Lows, 1=Mids, 2=Highs)',
      minimum: 0,
      maximum: 2,
      step: 1,
      ui: { order: 6, section: 'Audio' }
    }),
    clip: booleanProp('Clip Shape', false, {
      description: 'Enable hard edges',
      ui: { order: 7, section: 'Visual' }
    }),
    spin: booleanProp('Auto Spin', false, {
      description: 'Continuously rotate shape',
      ui: { order: 8, section: 'Motion' }
    }),
    rotate: numberProp('Rotation', 0, {
      description: 'Fixed rotation in degrees',
      minimum: 0,
      maximum: 360,
      ui: { order: 9, section: 'Motion' }
    }),
    brightness: numberProp('Overall Brightness', 1.0, {
      description: 'Overall brightness of the effect',
      minimum: 0,
      maximum: 2.0,
      ui: { order: 10, section: 'Visual' }
    })
  },
  required: [
    'primaryColor', 'secondaryColor', 'bg_color', 'background_brightness',
    'multiplier', 'min_size', 'frequency_range', 'clip', 'spin', 'rotate', 'brightness'
  ],
  metadata: {
    category: 'Matrix Effects',
    tags: ['2d', 'matrix', 'image', 'custom'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
