// GIF Player - Kaleidoscope Audio Reactive
export const gifFragmentShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_energy;
  uniform float u_beat;
  uniform vec2 u_resolution;

  varying vec2 v_position;

  #define PI 3.14159265359

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    // Correct aspect ratio
    vec2 uv = v_position;
    if (u_resolution.y > 0.0) {
      uv.x *= u_resolution.x / u_resolution.y;
    }

    // Parameters driven by audio
    float time = u_time * 0.2;
    float beat = u_beat; // BPM driven phase
    float energy = u_energy; // RMS / Volume

    // Rotation based on BPM
    float rot = beat * 0.5 + time * 0.1;
    float c = cos(rot);
    float s = sin(rot);
    uv = mat2(c, -s, s, c) * uv;

    // Convert to polar
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Kaleidoscope Segments
    // Increase segments with energy, minimum 6
    float segments = 6.0 + floor(energy * 6.0);

    // Fold the space
    float segmentAngle = 2.0 * PI / segments;
    a = mod(a, segmentAngle);
    a = abs(a - segmentAngle * 0.5);

    // Map back to Cartesian for pattern generation
    vec2 p = r * vec2(cos(a), sin(a));

    // Generate "Glass Shard" Pattern
    // Interference pattern
    float pattern = 0.0;
    pattern += sin(p.x * 10.0 + beat);
    pattern += sin(p.y * 10.0 - beat);
    pattern += sin((p.x + p.y) * 8.0 + time);
    pattern += sin(r * 20.0 - time * 2.0);

    // Sharpen edges
    float shards = abs(pattern);
    shards = smoothstep(0.0, 0.5 + energy * 0.5, shards);

    // Invert for "glowing lines" effect if energy is high
    if (energy > 0.5) {
       shards = 1.0 - shards;
    }

    // Color Logic
    // Cycle hue based on time and radius
    float hue = fract(time * 0.1 + r * 0.2 + energy * 0.1);
    float sat = 0.8;
    float val = shards * (0.5 + energy * 1.5); // Brightness linked to energy

    vec3 color = hsv2rgb(vec3(hue, sat, val));

    // Mix with theme colors
    vec3 themeMix = mix(u_primaryColor, u_secondaryColor, sin(r * 5.0 + beat) * 0.5 + 0.5);
    color = mix(color, themeMix, 0.4);

    // Center Glow (Bass kick)
    float glow = exp(-r * 3.0) * energy * 2.0;
    color += u_primaryColor * glow;

    // Vignette
    color *= smoothstep(1.5, 0.5, r);

    gl_FragColor = vec4(color, 1.0);
  }
`

export const gifPlayerShader = gifFragmentShader
