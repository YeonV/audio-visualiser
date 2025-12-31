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
  quadVertexShader,
  particleFragmentShader,
  spectrumFragmentShader
} from './base'

// Effect shaders - re-exported from original file for backward compatibility
export {
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
  texterShader,
  plasmaWled2dShader,
  radialShader
} from '../shaders'
