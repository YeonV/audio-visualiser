// --- Schemas for Visualiser Effects ---

export const VISUALISER_SCHEMAS: Record<string, any[]> = {
  gif: [
    {
      id: 'rotate',
      title: 'Rotate',
      type: 'number',
      min: 0,
      max: 360,
      step: 1
    },
    {
      id: 'gif_fps',
      title: 'GIF FPS',
      type: 'integer',
      min: 1,
      max: 60,
      step: 1
    },
    {
      id: 'brightness',
      title: 'Brightness',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.05
    },
    {
      id: 'bounce',
      title: 'Bounce',
      type: 'boolean'
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    },
    {
      id: 'image_location',
      title: 'Image Location',
      type: 'string'
    }
  ],
  bleep: [
    {
      id: 'scroll_time',
      title: 'Scroll Speed',
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1
    },
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  concentric: [
    {
      id: 'gradient_scale',
      title: 'Gradient Scale',
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1
    },
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'invert',
      title: 'Invert',
      type: 'boolean'
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  bars3d: [
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'smoothing',
      title: 'Smoothing',
      type: 'number',
      min: 0,
      max: 0.95,
      step: 0.05
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  particles: [
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'smoothing',
      title: 'Smoothing',
      type: 'number',
      min: 0,
      max: 0.95,
      step: 0.05
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  waveform3d: [
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  radial3d: [
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  matrix: [
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  terrain: [
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  geometric: [
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  hexgrid: [
    {
      id: 'hexSize',
      title: 'Hex Size',
      type: 'integer',
      min: 10,
      max: 100,
      step: 1
    },
    {
      id: 'gridRadius',
      title: 'Grid Radius',
      type: 'integer',
      min: 5,
      max: 30,
      step: 1
    },
    {
      id: 'strokeWidth',
      title: 'Stroke Width',
      type: 'number',
      min: 0.5,
      max: 5.0,
      step: 0.5
    },
    {
      id: 'glowIntensity',
      title: 'Glow Intensity',
      type: 'number',
      min: 0,
      max: 50,
      step: 1
    },
    {
      id: 'rippleSpeed',
      title: 'Ripple Speed',
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1
    },
    {
      id: 'primaryColor',
      title: 'Primary Color',
      type: 'color'
    },
    {
      id: 'secondaryColor',
      title: 'Secondary Color',
      type: 'color'
    },
    {
      id: 'backgroundColor',
      title: 'Background Color',
      type: 'color'
    },
    {
      id: 'bassMultiplier',
      title: 'Bass Multiplier',
      type: 'number',
      min: 0,
      max: 5.0,
      step: 0.1
    },
    {
      id: 'midMultiplier',
      title: 'Mid Multiplier',
      type: 'number',
      min: 0,
      max: 5.0,
      step: 0.1
    },
    {
      id: 'highMultiplier',
      title: 'High Multiplier',
      type: 'number',
      min: 0,
      max: 5.0,
      step: 0.1
    },
    {
      id: 'rotationSpeed',
      title: 'Rotation Speed',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.01
    },
    {
      id: 'pulseOnBeat',
      title: 'Pulse on Beat',
      type: 'boolean'
    },
    {
      id: 'fillHexagons',
      title: 'Fill Hexagons',
      type: 'boolean'
    },
    {
      id: 'audioSensitivity',
      title: 'Audio Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  // --- NEW MATRIX EFFECTS ---
  gameoflife: [
    {
      id: 'cell_size',
      title: 'Cell Size',
      type: 'integer',
      min: 4,
      max: 32,
      step: 1
    },
    {
      id: 'speed',
      title: 'Speed',
      type: 'number',
      min: 0.1,
      max: 2.0,
      step: 0.1
    },
    {
      id: 'beat_inject',
      title: 'Beat Inject',
      type: 'boolean'
    },
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  digitalrain: [
    {
      id: 'density',
      title: 'Density',
      type: 'number',
      min: 0.5,
      max: 2.0,
      step: 0.1
    },
    {
      id: 'speed',
      title: 'Speed',
      type: 'number',
      min: 0.5,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'tail_length',
      title: 'Tail Length',
      type: 'number',
      min: 0.2,
      max: 0.8,
      step: 0.05
    },
    {
      id: 'glow_intensity',
      title: 'Glow Intensity',
      type: 'number',
      min: 0.5,
      max: 2.0,
      step: 0.1
    },
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  flame: [
    {
      id: 'intensity',
      title: 'Intensity',
      type: 'number',
      min: 0.5,
      max: 2.0,
      step: 0.1
    },
    {
      id: 'wobble',
      title: 'Wobble',
      type: 'number',
      min: 0.1,
      max: 1.0,
      step: 0.1
    },
    {
      id: 'low_color',
      title: 'Bass Color',
      type: 'color'
    },
    {
      id: 'mid_color',
      title: 'Mid Color',
      type: 'color'
    },
    {
      id: 'high_color',
      title: 'High Color',
      type: 'color'
    },
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  plasma2d: [
    {
      id: 'density',
      title: 'Density',
      type: 'number',
      min: 0.5,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'twist',
      title: 'Twist',
      type: 'number',
      min: 0.01,
      max: 0.3,
      step: 0.01
    },
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  equalizer2d: [
    {
      id: 'bands',
      title: 'Bands',
      type: 'integer',
      min: 8,
      max: 64,
      step: 4
    },
    {
      id: 'ring_mode',
      title: 'Ring Mode',
      type: 'boolean'
    },
    {
      id: 'center_mode',
      title: 'Center Mode',
      type: 'boolean'
    },
    {
      id: 'spin_enabled',
      title: 'Spin Enabled',
      type: 'boolean'
    },
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  noise2d: [
    {
      id: 'zoom',
      title: 'Zoom',
      type: 'number',
      min: 0.5,
      max: 10.0,
      step: 0.5
    },
    {
      id: 'speed',
      title: 'Speed',
      type: 'number',
      min: 0.2,
      max: 2.0,
      step: 0.1
    },
    {
      id: 'audio_zoom',
      title: 'Audio Zoom',
      type: 'number',
      min: 0.0,
      max: 2.0,
      step: 0.1
    },
    {
      id: 'sensitivity',
      title: 'Sensitivity',
      type: 'number',
      min: 0.1,
      max: 3.0,
      step: 0.1
    },
    {
      id: 'developer_mode',
      title: 'Developer Mode',
      type: 'boolean'
    }
  ],
  // --- ADDITIONAL MATRIX EFFECTS ---
  blender: [
    { id: 'speed', title: 'Speed', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'blur', title: 'Blur', type: 'number', min: 0.0, max: 1.0, step: 0.1 },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  clone: [
    { id: 'mirrors', title: 'Mirrors', type: 'number', min: 1, max: 8, step: 1 },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  bands: [
    { id: 'bands', title: 'Bands', type: 'integer', min: 8, max: 64, step: 4 },
    { id: 'flip', title: 'Flip', type: 'boolean' },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  bandsmatrix: [
    { id: 'bands', title: 'Bands', type: 'integer', min: 8, max: 64, step: 4 },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  blocks: [
    { id: 'block_size', title: 'Block Size', type: 'integer', min: 4, max: 30, step: 1 },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  keybeat2d: [
    { id: 'keys', title: 'Keys', type: 'integer', min: 8, max: 32, step: 1 },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  texter: [
    { id: 'density', title: 'Density', type: 'number', min: 0.5, max: 2.0, step: 0.1 },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  plasmawled2d: [
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  radial: [
    { id: 'bands', title: 'Bands', type: 'integer', min: 8, max: 64, step: 4 },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  soap: [
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  waterfall: [
    { id: 'bands', title: 'Bands', type: 'integer', min: 16, max: 128, step: 8 },
    { id: 'speed', title: 'Speed', type: 'number', min: 0.5, max: 3.0, step: 0.1 },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ],
  image: [
    { id: 'bg_color', title: 'BG Color', type: 'color' },
    { id: 'rotate', title: 'Rotate', type: 'number', min: 0, max: 360, step: 1 },
    { id: 'brightness', title: 'Brightness', type: 'number', min: 0, max: 1, step: 0.05 },
    {
      id: 'background_brightness',
      title: 'Background Brightness',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.05
    },
    { id: 'multiplier', title: 'Multiplier', type: 'number', min: 0, max: 1, step: 0.05 },
    { id: 'min_size', title: 'Min Size', type: 'number', min: 0, max: 1, step: 0.05 },
    {
      id: 'frequency_range',
      title: 'Frequency Range (0=lows, 1=mids, 2=highs)',
      type: 'integer',
      min: 0,
      max: 2,
      step: 1
    },
    { id: 'clip', title: 'Clip', type: 'boolean' },
    { id: 'spin', title: 'Spin', type: 'boolean' },
    { id: 'sensitivity', title: 'Sensitivity', type: 'number', min: 0.1, max: 3.0, step: 0.1 },
    { id: 'developer_mode', title: 'Developer Mode', type: 'boolean' }
  ]
}

export const DEFAULT_CONFIGS: Record<string, any> = {
  gif: {
    rotate: 0,
    gif_fps: 30,
    brightness: 1.0,
    bounce: false,
    developer_mode: false,
    image_location: ''
  },
  bleep: { scroll_time: 1.0, sensitivity: 1.5, developer_mode: false },
  concentric: { gradient_scale: 1.0, sensitivity: 1.0, invert: false, developer_mode: false },
  bars3d: { sensitivity: 1.5, smoothing: 0.7, developer_mode: false },
  particles: { sensitivity: 1.5, smoothing: 0.7, developer_mode: false },
  waveform3d: { sensitivity: 1.5, developer_mode: false },
  radial3d: { sensitivity: 1.5, developer_mode: false },
  matrix: { sensitivity: 1.5, developer_mode: false },
  terrain: { sensitivity: 1.5, developer_mode: false },
  geometric: { sensitivity: 1.5, developer_mode: false },
  hexgrid: {
    hexSize: 30,
    gridRadius: 12,
    strokeWidth: 1.5,
    glowIntensity: 15,
    rippleSpeed: 2,
    primaryColor: '#00ffff',
    secondaryColor: '#ff00ff',
    backgroundColor: '#1a1a2e',
    audioSensitivity: 1.2,
    bassMultiplier: 2.0,
    midMultiplier: 1.0,
    highMultiplier: 0.6,
    rotationSpeed: 0.1,
    pulseOnBeat: true,
    fillHexagons: false,
    perspectiveDepth: 0.3,
    developer_mode: false
  },
  // --- NEW MATRIX EFFECTS ---
  gameoflife: {
    cell_size: 8,
    speed: 1.0,
    beat_inject: true,
    sensitivity: 1.5,
    developer_mode: false
  },
  digitalrain: {
    density: 1.0,
    speed: 1.5,
    tail_length: 0.5,
    glow_intensity: 1.0,
    sensitivity: 1.5,
    developer_mode: false
  },
  flame: {
    intensity: 1.0,
    wobble: 0.5,
    low_color: '#FF4400',
    mid_color: '#FFAA00',
    high_color: '#FFFF00',
    sensitivity: 1.5,
    developer_mode: false
  },
  plasma2d: { density: 1.5, twist: 0.1, sensitivity: 1.5, developer_mode: false },
  equalizer2d: {
    bands: 32,
    ring_mode: false,
    center_mode: false,
    spin_enabled: false,
    sensitivity: 1.5,
    developer_mode: false
  },
  noise2d: { zoom: 3.0, speed: 0.5, audio_zoom: 1.0, sensitivity: 1.5, developer_mode: false },
  // --- ADDITIONAL MATRIX EFFECTS ---
  blender: { speed: 1.0, blur: 0.5, sensitivity: 1.5, developer_mode: false },
  clone: { mirrors: 2, sensitivity: 1.5, developer_mode: false },
  bands: { bands: 32, flip: false, sensitivity: 1.5, developer_mode: false },
  bandsmatrix: { bands: 32, sensitivity: 1.5, developer_mode: false },
  blocks: { block_size: 8, sensitivity: 1.5, developer_mode: false },
  keybeat2d: { keys: 16, sensitivity: 1.5, developer_mode: false },
  texter: { density: 1.0, sensitivity: 1.5, developer_mode: false },
  plasmawled2d: { sensitivity: 1.5, developer_mode: false },
  radial: { bands: 32, sensitivity: 1.5, developer_mode: false },
  soap: { sensitivity: 1.5, developer_mode: false },
  waterfall: { bands: 64, speed: 1.0, sensitivity: 1.5, developer_mode: false },
  image: {
    bg_color: '#000000',
    rotate: 0,
    brightness: 1.0,
    background_brightness: 1.0,
    multiplier: 0.5,
    min_size: 0.3,
    frequency_range: 0,
    clip: false,
    spin: false,
    sensitivity: 1.5,
    developer_mode: false
  }
}

// Map visualType to backend effect type keys
// These must match the keys in schemas.effects from /api/schema
export const VISUAL_TO_BACKEND_EFFECT: Record<string, string> = {
  // Matrix Effects (use backend schemas)
  gameoflife: 'game_of_life',
  digitalrain: 'digital_rain',
  flame: 'flame2d',
  plasma2d: 'plasma2d',
  equalizer2d: 'equalizer2d',
  noise2d: 'noise2d',
  blender: 'blender',
  clone: 'clone',
  bands: 'bands',
  bandsmatrix: 'bands_matrix',
  blocks: 'blocks',
  keybeat2d: 'keybeat2d',
  texter: 'texter2d',
  plasmawled2d: 'plasmawled2d',
  radial: 'radial',
  soap: 'soap2d',
  waterfall: 'waterfall2d',
  image: 'imagespin',
  gif: 'gifplayer',
  bleep: 'bleep',
  concentric: 'concentric'
}

// Order effect properties same as EffectsComplex
const configOrder = ['color', 'number', 'integer', 'string', 'boolean']

export const orderEffectProperties = (
  schema: any,
  hidden_keys?: string[],
  advanced_keys?: string[],
  advanced?: boolean
) => {
  if (!schema || !schema.properties) return []
  const properties: any[] = Object.keys(schema.properties)
    .filter((k) => {
      if (hidden_keys && hidden_keys.length > 0) {
        return hidden_keys?.indexOf(k) === -1
      }
      return true
    })
    .filter((ke) => {
      if (advanced_keys && advanced_keys.length > 0 && !advanced) {
        return advanced_keys?.indexOf(ke) === -1
      }
      return true
    })
    .map((sk) => ({
      ...schema.properties[sk],
      id: sk
    }))
  const ordered = [] as any[]
  configOrder.forEach((type) => {
    ordered.push(...properties.filter((x) => x.type === type))
  })
  ordered.push(...properties.filter((x) => !configOrder.includes(x.type)))
  return ordered
    .sort((a) => (a.id === 'advanced' ? 1 : -1))
    .sort((a) => (a.type === 'string' && a.enum && a.enum.length ? -1 : 1))
    .sort((a) => (a.type === 'number' ? -1 : 1))
    .sort((a) => (a.type === 'integer' ? -1 : 1))
    .sort((a) => (a.id === 'bg_color' ? -1 : 1))
    .sort((a) => (a.type === 'color' ? -1 : 1))
    .sort((a) => (a.id === 'color' ? -1 : 1))
    .sort((a) => (a.id === 'gradient' ? -1 : 1))
}
