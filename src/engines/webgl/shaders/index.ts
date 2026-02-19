/**
 * Shaders Module
 *
 * Central export for all WebGL shaders and utilities.
 * Provides backward compatibility while allowing modular imports.
 */

// Utility functions
export { createShader, createProgram, hexToRgb, deleteProgramAndShaders } from './utils'

// Base shaders
export {
  vertexShaderSource,
  fragmentShaderSource,
  particleVertexShader,
  particleFragmentShader,
  spectrumFragmentShader
} from './base'

// Effect shaders
export * from './effects'

// Advanced shaders
export * from './advanced'
