/**
 * Blade Wave Visualizer Schema
 * 
 * Audio-reactive layered waves inspired by SVG animation.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp, stringProp } from './base.schema'

export const bladeWaveSchema: VisualizerSchema = {
  $id: 'bladewave',
  displayName: 'Blade Wave',
  type: 'object',
  properties: {
    backgroundColor: colorProp('Background Color', '#000000', {
      description: 'The background color of the visualizer',
      ui: { order: 0 }
    }),
    startColor: colorProp('Start Color', '#1db954', {
      description: 'The start color of the wave gradient',
      ui: { order: 1 }
    }),
    stopColor: colorProp('Stop Color', '#030303', {
      description: 'The stop color of the wave gradient',
      ui: { order: 2 }
    }),
    lineCount: integerProp('Line Count', 5, {
      description: 'The number of wave layers',
      minimum: 1,
      maximum: 20,
      ui: { order: 3 }
    }),
    waveOpacity: numberProp('Wave Opacity', 0.4, {
      description: 'The opacity of each wave layer',
      minimum: 0.1,
      maximum: 1.0,
      ui: { order: 4 }
    }),
    speed: numberProp('Animation Speed', 1.0, {
      description: 'The speed of the base animation',
      minimum: 0,
      maximum: 5.0,
      ui: { order: 5 }
    }),
    audioSensitivity: numberProp('Audio Sensitivity', 1.0, {
      description: 'How much the waves respond to audio',
      minimum: 0,
      maximum: 5.0,
      ui: { order: 6 }
    }),
    waveHeight: numberProp('Wave Height', 1.0, {
      description: 'The maximum height of the waves',
      minimum: 0.1,
      maximum: 3.0,
      ui: { order: 7 }
    }),
    reactivityMode: stringProp('Reactivity Mode', 'Height', {
      enum: ['Height', 'Speed', 'Both'],
      description: 'Which part of the animation responds to audio',
      ui: { order: 8 }
    }),
    smoothing: numberProp('Audio Smoothing', 0.5, {
      minimum: 0,
      maximum: 0.99,
      step: 0.01,
      description: 'Internal smoothing for audio transitions',
      ui: { order: 9 }
    }),
    frequencyMapping: booleanProp('Frequency Mapping', false, {
      description: 'Map each wave layer to a different frequency band',
      ui: { order: 10 }
    })
  },
  required: [
    'backgroundColor',
    'startColor',
    'stopColor',
    'lineCount',
    'waveOpacity',
    'speed',
    'audioSensitivity',
    'waveHeight',
    'reactivityMode',
    'smoothing',
    'frequencyMapping'
  ],
  metadata: {
    category: 'Simulation',
    tags: ['wave', 'svg-like', 'audio-reactive'],
    author: 'Blade',
    version: '2.0.0'
  }
}
