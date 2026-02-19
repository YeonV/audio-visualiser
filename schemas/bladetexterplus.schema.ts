import { VisualizerSchema } from './base.schema'

export const bladeTexterPlusSchema: VisualizerSchema = {
  $id: 'bladeTexterPlus',
  displayName: 'Blade Texter Plus',
  type: 'object',
  properties: {
    // Text 1
    text: { type: 'string', title: 'Text 1', default: 'BLADE' },
    font: {
      type: 'string',
      title: 'Font 1',
      default: 'technique',
      enum: ["Press Start 2P", "Blade-5x8", "8bitOperatorPlus8-Regular", "Roboto-Black", "Roboto-Bold", "Roboto-Regular", "Stop", "technique"]
    },
    text_effect: {
      type: 'string',
      title: 'Effect 1',
      default: 'Fade',
      enum: ["Side Scroll", "Spokes", "Carousel", "Wave", "Pulse", "Fade"]
    },
    gradient: {
      type: 'string',
      title: 'Gradient 1',
      format: 'color',
      isGradient: true,
      default: 'linear-gradient(90deg, #00ffff 0%, #0000ff 100%)'
    },

    // Text 2
    text2: { type: 'string', title: 'Text 2', default: 'ULTRA FAST' },
    font2: {
      type: 'string',
      title: 'Font 2',
      default: 'Press Start 2P',
      enum: ["Press Start 2P", "Blade-5x8", "8bitOperatorPlus8-Regular", "Roboto-Black", "Roboto-Bold", "Roboto-Regular", "Stop", "technique"]
    },
    text_effect2: {
      type: 'string',
      title: 'Effect 2',
      default: 'Side Scroll',
      enum: ["Side Scroll", "Spokes", "Carousel", "Wave", "Pulse", "Fade"]
    },
    gradient2: {
      type: 'string',
      title: 'Gradient 2',
      format: 'color',
      isGradient: true,
      default: 'linear-gradient(90deg, #ff0000 0%, #ff00ff 100%)'
    },

    // 3D & Transform
    rotation_x: { type: 'number', title: 'Pitch (X)', default: 0, minimum: -1, maximum: 1, step: 0.01 },
    rotation_y: { type: 'number', title: 'Yaw (Y)', default: 0, minimum: -1, maximum: 1, step: 0.01 },
    rotation_z: { type: 'number', title: 'Roll (Z)', default: 0, minimum: -3.14, maximum: 3.14, step: 0.01 },
    perspective: { type: 'number', title: 'Perspective', default: 1.0, minimum: 0.1, maximum: 5.0, step: 0.1 },
    zoom: { type: 'number', title: 'Zoom', default: 1.0, minimum: 0.1, maximum: 5.0, step: 0.01 },

    // Effects
    glow_intensity: { type: 'number', title: 'Hyper Glow', default: 0.5, minimum: 0, maximum: 2.0, step: 0.01 },
    glitch_amount: { type: 'number', title: 'Glitch/Noise', default: 0.1, minimum: 0, maximum: 1.0, step: 0.01 },
    chromatic_aberration: { type: 'number', title: 'Chromatic Ab.', default: 0.02, minimum: 0, maximum: 0.1, step: 0.001 },
    pixelate: { type: 'number', title: 'Pixelate', default: 0, minimum: 0, maximum: 100, step: 1 },

    // Background
    background_mode: {
      type: 'string',
      title: 'Background',
      default: 'Plasma',
      enum: ['None', 'Plasma', 'Grid', 'Audio Wave', 'Starfield']
    },
    bg_opacity: { type: 'number', title: 'BG Opacity', default: 0.3, minimum: 0, maximum: 1.0, step: 0.01 },

    // Motion
    speed: { type: 'number', title: 'Speed 1', default: 0.1, minimum: 0, maximum: 2.0, step: 0.01 },
    speed2: { type: 'number', title: 'Speed 2', default: 0.1, minimum: 0, maximum: 2.0, step: 0.01 },
    audio_reactive_scale: { type: 'number', title: 'Audio Pulse', default: 0.5, minimum: 0, maximum: 2.0, step: 0.01 }
  },
  required: [],
  metadata: {
    category: 'Matrix Effects',
    author: 'Jules',
    description: 'The ultimate text visualization experience with 3D projection and advanced post-processing.'
  }
}
