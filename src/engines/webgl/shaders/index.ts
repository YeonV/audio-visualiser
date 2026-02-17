/**
 * Shaders Module
 *
 * Central export for all WebGL shaders and utilities.
 * Provides backward compatibility while allowing modular imports.
 */

// Utility functions
export { createShader, createProgram, hexToRgb } from './utils'

// Base shaders
export {
  vertexShaderSource,
  fragmentShaderSource,
  particleVertexShader,
  particleFragmentShader,
  spectrumFragmentShader
} from './base'

// Effect shaders
export {
  quadVertexShader,
  bleepFragmentShader,
  concentricFragmentShader,
  gifFragmentShader,
  matrixRainShader,
  terrainShader,
  geometricShader,
  gameOfLifeShader,
  digitalRainShader,
  flameShader,
  plasma2dShader,
  equalizer2dShader,
  noise2dShader,
  blenderShader,
  cloneShader,
  bandsShader,
  bandsMatrixShader,
  blocksShader,
  keybeat2dShader,
  // texterShader,
  plasmaWled2dShader,
  radialShader,
  soapShader,
  waterfallShader,
  imageShader
} from './effects'
export { texterShader } from './effects/texterShader'

// Advanced shaders
export * from './advanced'
