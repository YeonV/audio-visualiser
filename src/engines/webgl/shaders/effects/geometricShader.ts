// Geometric Pulse
export const geometricShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_energy;
  uniform float u_beat;
  uniform int u_fixMode;

  varying vec2 v_position;

  float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float sdCircle(vec2 p, float r) {
    return length(p) - r;
  }

  mat2 rotate(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    vec2 uv = v_position;
    float time = u_time;
    float energy = u_energy;

    vec3 color = vec3(0.0);

    // Multiple rotating shapes
    for (float i = 0.0; i < 5.0; i++) {
      vec2 p = uv * rotate(time * (0.2 + i * 0.1) + i);
      float scale = 0.3 + i * 0.15 - energy * 0.1;

      // Alternating shapes
      float shape;
      if (mod(i, 2.0) < 1.0) {
        shape = sdBox(p, vec2(scale));
      } else {
        shape = sdCircle(p, scale);
      }

      // Pulsing with beat
      float beatIntensity = energy;
      if (u_fixMode == 0) beatIntensity = u_beat * 0.1;
      else if (u_fixMode == 2) beatIntensity = u_beat;

      float pulse = sin(u_beat * 2.0 + i * 1.5) * 0.05 * beatIntensity;
      shape += pulse;

      // Edge glow
      float edge = smoothstep(0.02, 0.0, abs(shape));
      float fill = smoothstep(0.0, -0.1, shape) * 0.1;

      // Color per layer
      vec3 layerColor = mix(u_primaryColor, u_secondaryColor, i / 5.0);
      color += layerColor * (edge + fill) * (1.0 - i * 0.15);
    }

    // Center glow
    float centerGlow = exp(-length(uv) * 3.0) * energy;
    color += u_primaryColor * centerGlow;

    // Energy boost
    float pulseBoost = energy;
    if (u_fixMode == 0) pulseBoost = u_beat * 0.1;
    else if (u_fixMode == 2) pulseBoost = u_beat;

    color *= 0.8 + pulseBoost * 0.8;

    if (u_fixMode > 0) color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`
