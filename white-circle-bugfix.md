# White Circle Bugfix Report

This document explains the resolution of the "White Circle" issue that affected several WebGL visualizers.

## The Problem

### Cause: Cumulative `u_beat` Timer
In the original shader implementations, the `u_beat` uniform was often used to control brightness or glow. This uniform was a cumulative counter that increased every time a beat was detected.

**Symptom:**
As the application ran, `u_beat` would grow indefinitely. Shaders that used this value for brightness (e.g., `exp(-radius * u_beat)`) would eventually reach a state where the center of the screen became permanently saturated to pure white, forming a "white circle" that would never fade.

### Illustration of the Bug
```glsl
// Problematic code
float brightness = u_primaryColor * exp(-radius * 4.0) * u_beat;
// As u_beat -> infinity, brightness -> infinity (saturated white)
```

## The Solution

### Shift to Instantaneous `u_energy`
The fix involved introducing a new uniform, `u_energy`, which represents the *instantaneous* energy of the audio (normalized average amplitude).

**Changes:**
1.  **Uniform Update**: `WebGLVisualiser.tsx` now passes `u_energy` based on the current frame's average amplitude.
2.  **Shader Logic**: Beat-reactive brightness now uses `u_energy` for the primary pulse and uses a clamped/modulo version of `u_beat` only for temporal shifts (like rotation or color cycling).

### Improved Code
```glsl
// Corrected code
color *= 1.0 + u_energy * 0.8;
// This ensures the pulse always returns to the baseline brightness
```

## Alternative Approaches Considered

### 1. Modulo `u_beat`
One alternative was to wrap `u_beat` using `mod(u_beat, 1.0)`.
- **Pros**: Easy to implement.
- **Cons**: Causes a sudden "jump" in brightness when the counter resets, which is visually distracting.

### 2. Time-Based Decay
Another approach was to implement a decay function in JavaScript that reduces the "beat intensity" over time.
- **Pros**: Very smooth.
- **Cons**: Higher CPU overhead and requires keeping track of more state in the render loop.

**Final Decision:** The `u_energy` approach was chosen because it is the most robust, performs best, and naturally follows the rhythm of the music even between detected beats.
