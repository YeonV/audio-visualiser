// Radial Shader - Radial patterns
export const radialShader = `
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
  uniform int u_outerGlowMode;
  uniform vec2 u_resolution;
  uniform sampler2D u_melbank;
  uniform float u_bands;

  varying vec2 v_position;

  #define PI 3.14159265359

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    uv.x *= u_resolution.x / u_resolution.y;

    float angle = atan(uv.y, uv.x) + PI;
    float radius = length(uv);

    float bands = u_bands;
    float bandAngle = 2.0 * PI / bands;
    float bandIdx = floor(angle / bandAngle);
    float bandFrac = fract(angle / bandAngle);

    // Sample melbank
    float melVal = texture2D(u_melbank, vec2((bandIdx + 0.5) / bands, 0.5)).r;

    // Radial bar
    float barLength = 0.1 + melVal * 0.8;
    float inBar = step(0.1, radius) * step(radius, 0.1 + barLength);

    // Edge fade
    float edge = smoothstep(0.0, 0.2, bandFrac) * smoothstep(1.0, 0.8, bandFrac);

    // Color by angle
    float hue = bandIdx / bands;
    vec3 barColor = hsv2rgb(vec3(hue, 0.9, 1.0));

    vec3 color = barColor * inBar * edge;

    // Outer glow
    float glowDist = abs(radius - (0.1 + barLength));
    if (u_outerGlowMode == 0) {
      // Original weak glow
      color += barColor * exp(-glowDist * 20.0) * 0.5 * edge;
    } else {
      // Strengthened glow
      color += barColor * exp(-glowDist * 8.0) * 0.8 * edge;
      color += barColor * exp(-glowDist * 4.0) * 0.4 * edge;
    }

    // Center glow
    color += u_primaryColor * exp(-radius * 4.0) * u_bass * 0.8;

    // Beat pulse
    if (u_fixMode == 0) {
      color *= 1.0 + u_beat * 0.3;
    } else if (u_fixMode == 1) {
      color *= 1.0 + u_energy * 0.8;
    } else {
      color *= 1.0 + u_beat * 0.8;
    }

    if (u_fixMode > 0) color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`
