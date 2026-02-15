/**
 * Astrofox Visualizer Schema
 * 
 * Layer-based audio visualization system inspired by Astrofox.
 * Complex layer system with composition - simplified schema for basic config.
 */

import { VisualizerSchema, colorProp, integerProp } from './base.schema'

export const astrofoxSchema: VisualizerSchema = {
  $id: 'astrofox',
  displayName: 'Astrofox Layers',
  type: 'object',
  properties: {
    backgroundColor: colorProp('Background Color', '#0f0f23', {
      description: 'Canvas background color',
      ui: { order: 0, section: 'Canvas' }
    }),
    
    width: integerProp('Canvas Width', 1920, {
      description: 'Canvas width in pixels',
      minimum: 640,
      maximum: 3840,
      ui: { order: 1, section: 'Canvas' }
    }),
    
    height: integerProp('Canvas Height', 1080, {
      description: 'Canvas height in pixels',
      minimum: 360,
      maximum: 2160,
      ui: { order: 2, section: 'Canvas' }
    }),

    primaryColor: colorProp('Primary Color', '#1976d2', {
      description: 'Primary accent color for layers',
      ui: { order: 3, section: 'Colors' }
    }),

    secondaryColor: colorProp('Secondary Color', '#dc004e', {
      description: 'Secondary accent color for layers',
      ui: { order: 4, section: 'Colors' }
    })
    
    // Note: Layer system is complex and handled separately through the
    // layers array in the config. This schema covers basic canvas settings.
    // Full layer system with spectrum bars, waveforms, text, images, and
    // 3D geometry is managed through the AstrofoxConfig.layers array.
  },
  
  required: ['backgroundColor', 'width', 'height', 'primaryColor', 'secondaryColor'],
  
  metadata: {
    category: 'Compositional',
    tags: ['layers', 'composition', 'advanced', 'spectrum', 'text', '3d'],
    author: 'YeonV',
    version: '1.0.0',
    description: 'Layer-based visualization system. Configure individual layers through the layer editor.'
  }
}
