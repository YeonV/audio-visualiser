# Performance Optimization Report

This document details the optimizations implemented to ensure smooth rendering and stable memory usage across all visualizers.

## 1. WebGL Pipeline Efficiency

### persistent Resource Management
Previously, many WebGL visualizers were recreating buffers and textures in every frame or on every component update. This led to significant GPU memory overhead and frequent stalls.

**Changes:**
- **Persistent Refs**: Implemented `buffersRef`, `texturesRef`, and `typedArraysRef` in `WebGLVisualiser.tsx` to maintain resources across frames.
- **Explicit Cleanup**: Added robust disposal logic using `gl.deleteBuffer`, `gl.deleteTexture`, and `gl.deleteProgram` to ensure resources are freed when a visualizer is switched or the component is unmounted.
- **Location Caching**: Uniform and attribute locations are now cached in `locationsRef` and `attribLocationsRef`, eliminating redundant `getUniformLocation` calls.

## 2. Reduction of Garbage Collection (GC) Pressure

High-frequency allocation of objects (60 times per second) is the primary cause of frame stutters in JavaScript applications.

**Changes:**
- **Zero-Allocation Render Loops**: Replaced `Array.from(audioData)` and `.map()` calls with direct loops over `Uint8Array` and `Float32Array`.
- **Pre-allocated Typed Arrays**: All geometry data and audio processing arrays are now pre-allocated and reused. For example, `bars3d` now uses a persistent `Float32Array` for its vertex data.
- **Shared Canvas for Gradients**: The `parseGradient` utility in `src/utils/gradient.ts` now uses a singleton canvas and context for all color calculations, removing the overhead of creating and destroying DOM elements.

## 3. Component Reactivity

**Changes:**
- **Ref-based State**: Audio data and configuration values are now stored in `useRef` and updated in the animation loop, preventing unnecessary React re-renders while maintaining high responsiveness to UI changes.
- **Selective Persistence**: Non-serializable objects (like the WebGL context) and static metadata (the visualizer list) are now excluded from Zustand's `localStorage` persistence to prevent rehydration crashes and ensure the UI always reflects the latest code state.

## 4. Visualizer Specific Optimizations

### Astrofox Visualiser
- **Parser Caching**: `FFTParser` and `WaveParser` instances are now cached per layer. This prevents memory growth when adjusting layer configurations and significantly reduces CPU usage during spectrum analysis.

### Fluid Simulation
- **Explicit Disposal**: The complex WebGL programs and framebuffers used by the fluid simulation are now explicitly deleted during cleanup, fixing a major GPU memory leak.
