# Affected Effects and Visual Changes

This document lists the visualizers that have undergone changes in appearance or behavior as a result of the performance and bugfix updates.

## 1. Radial (Radial Spectrum)
- **Before**: Had a weak outer glow and was prone to the "white circle" center saturation.
- **After**: Features a significantly strengthened outer glow and center pulse. The brightness now reacts instantaneously to audio energy, preventing permanent white-out.
- **Why**: To restore visual fidelity and make the effect feel more "alive" with the music.

## 2. Keybeat 2D
- **Before**: Inactive keys were barely visible, and activated keys had a very tight, dim glow.
- **After**: Inactive keys have a subtle baseline brightness. Activated keys now have a much broader and more intense glow that fills the surrounding space.
- **Why**: User feedback indicated the effect was too "flat." The new glow adds depth and a "mechanical keyboard" aesthetic.

## 3. Concentric Rings
- **Before**: The rings would often merge into a solid white mass after a few minutes of play.
- **After**: The expansion is now synchronized with `u_beat` modulo, and the pulse intensity is capped by `u_energy`. The rings remain distinct even during intense audio sections.

## 4. Particles (3D)
- **Before**: Particles were spawned based on a noisy amplitude calculation, leading to inconsistent density.
- **After**: Spawning is now smoothed using the `getSmoothData` helper, resulting in a more fluid and predictable flow of particles. Performance is also improved by using a single pre-allocated vertex buffer.

---

## Evidence and Alternative Approaches

### Glow Intensity
Some users might find the new glow in `Radial` and `Keybeat2d` too intense.

**Alternative Approach:**
If a more subtle look is desired, the `exp()` decay factors in the fragment shaders can be increased:
- Current: `exp(-glowDist * 8.0)`
- Alternative: `exp(-glowDist * 16.0)` (Sharper, thinner glow)

### Energy Mapping
The current `u_energy` mapping is linear.

**Alternative Approach:**
For a more "punchy" look that emphasizes loud beats over quiet background noise, a power function could be used in the shader:
- `float energy = pow(u_energy, 2.0);`
- This would make the visualizer more sensitive to transients while ignoring low-level audio.
