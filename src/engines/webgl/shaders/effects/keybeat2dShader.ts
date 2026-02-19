// Keybeat2d Shader - Beat-reactive keyboard-style visualization
export const keybeat2dShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform float u_energy;
  uniform int u_fixMode;
  uniform vec2 u_resolution;
  uniform float u_keys;

  varying vec2 v_position;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;

    float keys = u_keys;
    float keyIdx = floor(uv.x * keys);
    float keyX = fract(uv.x * keys);

    // Key activation based on beat and randomness
    float seed = random(vec2(keyIdx, floor(u_time * 8.0)));

    float pulse = u_energy;
    if (u_fixMode == 0) pulse = u_beat * 0.1;
    else if (u_fixMode == 2) pulse = u_beat;

    float activated = step(0.7 - pulse * 0.5, seed);

    // Key shape
    float keyShape = smoothstep(0.0, 0.1, keyX) * smoothstep(1.0, 0.9, keyX);
    keyShape *= smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);

    // Color
    float hue = keyIdx / keys;
    vec3 keyColor = hsv2rgb(vec3(hue, 0.8, 1.0));

    // Inactive keys are dim
    float brightness = 0.1 + activated * 0.9;

    // Audio modulation per key region
    float keyFrac = keyIdx / keys;
    if (keyFrac < 0.33) brightness *= 0.5 + u_bass;
    else if (keyFrac < 0.66) brightness *= 0.5 + u_mid;
    else brightness *= 0.5 + u_high;

    vec3 color = keyColor * keyShape * brightness;

    // Glow for activated keys - strengthened and expanded
    if (activated > 0.5) {
      float d = length(vec2(keyX - 0.5, uv.y - 0.5));
      color += keyColor * exp(-d * 2.5) * 1.2;
      color += keyColor * exp(-d * 1.5) * 0.4;
    }

    if (u_fixMode > 0) color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`
