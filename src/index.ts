// src/index.ts

// Export the main component
export { AudioVisualiser } from './components/AudioVisualiser'

// Export types
export type { AudioVisualiserProps } from './components/AudioVisualiser.types'
export type { WebGLVisualisationType } from './components/WebGLVisualiser'

// Export isPremium flag
export { isPremium } from './components/AudioVisualiser.types'

// This is what will be attached to window.YzAudioVisualiser when built as IIFE
