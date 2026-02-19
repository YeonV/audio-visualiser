// Blocks Shader - Random colored blocks
export const blocksShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform float u_blockSize;

  varying vec2 v_position;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;

    // Block grid
    float size = u_blockSize;
    vec2 blockPos = floor(uv * size);
    vec2 blockUV = fract(uv * size);

    // Random values per block
    float r1 = random(blockPos);
    float r2 = random(blockPos + 100.0);
    float r3 = random(blockPos + 200.0);

    // Timing - blocks change at different rates
    float changeRate = 0.5 + r1 * 2.0;
    float phase = floor(u_time * changeRate + r2 * 10.0);
    float nextPhase = phase + 1.0;

    // Interpolate between states
    float t = fract(u_time * changeRate + r2 * 10.0);
    t = smoothstep(0.0, 0.3, t) * smoothstep(1.0, 0.7, t);

    // Colors for current and next state
    float hue1 = random(blockPos + phase);
    float hue2 = random(blockPos + nextPhase);
    float hue = mix(hue1, hue2, t);

    // Audio reactivity
    float audioMod = 0.0;
    float blockFrac = (blockPos.x + blockPos.y * size) / (size * size);
    if (blockFrac < 0.33) audioMod = u_bass;
    else if (blockFrac < 0.66) audioMod = u_mid;
    else audioMod = u_high;

    // Brightness
    float brightness = 0.5 + audioMod * 0.5;
    brightness *= 0.8 + random(blockPos + phase * 0.1) * 0.4;

    vec3 color = hsv2rgb(vec3(hue, 0.7, brightness));

    // Block edges
    float edge = smoothstep(0.0, 0.05, blockUV.x) * smoothstep(1.0, 0.95, blockUV.x);
    edge *= smoothstep(0.0, 0.05, blockUV.y) * smoothstep(1.0, 0.95, blockUV.y);

    color *= edge * 0.8 + 0.2;

    // Beat flash
    color *= 1.0 + u_beat * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`
