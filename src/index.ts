// src/index.ts

// Export the main component (standalone version)
export { default as AudioVisualiser } from './VisualiserIso'

// Export types
export type { WebGLVisualisationType } from './WebGLVisualiser'

// Export constants
export { DEFAULT_CONFIGS, VISUAL_TO_BACKEND_EFFECT, VISUALISER_SCHEMAS } from './visualizerConstants'

// This is what will be attached to window.YzAudioVisualiser when built as IIFE
