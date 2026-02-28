/**
 * Astrofox Visualizer Schema
 * 
 * Layer-based audio visualization system inspired by Astrofox.
 * Complex layer system with composition - simplified schema for basic config.
 */

import { VisualizerSchema, colorProp, integerProp, stringProp } from './base.schema'

export const astrofoxSchema: VisualizerSchema = {
  $id: 'astrofox',
  displayName: 'Astrofox Layers',
  type: 'object',
  properties: {
    backgroundColor: colorProp('Background Color', '#0f0f23', {
      description: 'Canvas background color',
      ui: { order: 0, section: 'Canvas' }
    }),
    
    // width: integerProp('Canvas Width', 1920, {
    //   description: 'Canvas width in pixels',
    //   minimum: 640,
    //   maximum: 3840,
    //   ui: { order: 1, section: 'Canvas' }
    // }),
    
    // height: integerProp('Canvas Height', 1080, {
    //   description: 'Canvas height in pixels',
    //   minimum: 360,
    //   maximum: 2160,
    //   ui: { order: 2, section: 'Canvas' }
    // }),

    primaryColor: colorProp('Primary Color', '#1976d2', {
      description: 'Primary accent color for layers',
      ui: { order: 3, section: 'Colors' }
    }),

    secondaryColor: colorProp('Secondary Color', '#dc004e', {
      description: 'Secondary accent color for layers',
      ui: { order: 4, section: 'Colors' }
    }),

    gradient: stringProp('Gradient', '', {
      description: 'Main gradient (CSS or stops)',
      ui: { order: 5, section: 'Colors' }
    }),
    gradient2: stringProp('Gradient 2', '', {
      description: 'Secondary gradient',
      ui: { order: 6, section: 'Colors' }
    }),
    image_source: stringProp('Image Source', '', {
      description: 'Image URL or path',
      ui: { order: 7, section: 'Image' }
    }),
    background_source: stringProp('Background Image Source', '', {
      description: 'Image URL or path for background image layer',
      ui: { order: 8, section: 'Image' }
    }),
    tertiaryColor: colorProp('Tertiary Color', '#ffffff', {
      description: 'Tertiary accent color',
      ui: { order: 9, section: 'Colors' }
    }),
    low_band: integerProp('Low Band', 0, {
      description: 'Low frequency band',
      ui: { order: 10, section: 'Audio' }
    }),
    bassColor: colorProp('Bass Color', '#ff0000', {
      description: 'Bass color',
      ui: { order: 11, section: 'Colors' }
    }),
    mid_band: integerProp('Mid Band', 0, {
      description: 'Mid frequency band',
      ui: { order: 12, section: 'Audio' }
    }),
    midColor: colorProp('Mid Color', '#00ff00', {
      description: 'Mid color',
      ui: { order: 13, section: 'Colors' }
    }),
    high_band: integerProp('High Band', 0, {
      description: 'High frequency band',
      ui: { order: 14, section: 'Audio' }
    }),
    highColor: colorProp('High Color', '#0000ff', {
      description: 'High color',
      ui: { order: 15, section: 'Colors' }
    }),
    sunColor: colorProp('Sun Color', '#ffff00', {
      description: 'Sun color',
      ui: { order: 16, section: 'Colors' }
    }),
    peakColor: colorProp('Peak Color', '#ff00ff', {
      description: 'Peak color',
      ui: { order: 17, section: 'Colors' }
    }),
    text: stringProp('Text', '', {
      description: 'Main text',
      ui: { order: 18, section: 'Text' }
    }),
    text2: stringProp('Text 2', '', {
      description: 'Secondary text',
      ui: { order: 19, section: 'Text' }
    }),
    font: stringProp('Font', '', {
      description: 'Font family',
      ui: { order: 20, section: 'Text' }
    }),
    font2: stringProp('Font 2', '', {
      description: 'Secondary font family',
      ui: { order: 21, section: 'Text' }
    }),
    speed: integerProp('Speed', 1, {
      description: 'Animation speed',
      ui: { order: 22, section: 'Animation' }
    }),
    speed_option_1: integerProp('Speed Option 1', 1, {
      description: 'Alternative speed option',
      ui: { order: 23, section: 'Animation' }
    }),
    height_percent: integerProp('Height Percent', 100, {
      description: 'Height as percent',
      ui: { order: 24, section: 'Layout' }
    }),
    width_percent: integerProp('Width Percent', 100, {
      description: 'Width as percent',
      ui: { order: 25, section: 'Layout' }
    }),
    offset_y: integerProp('Offset Y', 0, {
      description: 'Vertical offset',
      ui: { order: 26, section: 'Layout' }
    }),
    offset_y2: integerProp('Offset Y 2', 0, {
      description: 'Secondary vertical offset',
      ui: { order: 27, section: 'Layout' }
    })
    
    // Note: Layer system is complex and handled separately through the
    // layers array in the config. This schema covers basic canvas settings.
    // Full layer system with spectrum bars, waveforms, text, images, and
    // 3D geometry is managed through the AstrofoxConfig.layers array.
  },
  
  required: ['backgroundColor', 'primaryColor', 'secondaryColor'],
  
  metadata: {
    category: 'Compositional',
    tags: ['layers', 'composition', 'advanced', 'spectrum', 'text', '3d'],
    author: 'YeonV',
    version: '1.0.0',
    description: 'Layer-based visualization system. Configure individual layers through the layer editor.'
  }
}
