export const spectrumRingsShader = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beatIntensity;
  uniform float u_bpm;
  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_energy;

  varying vec2 v_position;
  varying vec2 v_uv;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    // Beat-synced time
    float beatTime = u_time * (u_bpm > 0.0 ? u_bpm / 120.0 : 1.0);

    // Multiple concentric rings with different frequencies
    float ring1 = sin(dist * 20.0 - beatTime * 4.0 + u_bass * 10.0) * 0.5 + 0.5;
    float ring2 = sin(dist * 15.0 - beatTime * 3.0 + u_mid * 8.0) * 0.5 + 0.5;
    float ring3 = sin(dist * 25.0 - beatTime * 5.0 + u_high * 12.0) * 0.5 + 0.5;

    // Combine rings with frequency bands
    float rings = ring1 * u_bass + ring2 * u_mid * 0.8 + ring3 * u_high * 0.6;

    // Beat pulse
    float pulse = 1.0 + u_beatIntensity * 0.5;

    // Radial gradient
    float fade = 1.0 - smoothstep(0.0, 1.5, dist * pulse);

    // Angular variation
    float angularPattern = sin(angle * 6.0 + beatTime) * 0.5 + 0.5;

    // Color based on frequency
    float hue = fract(u_bass * 0.3 + u_mid * 0.2 + beatTime * 0.1);
    vec3 freqColor = hsv2rgb(vec3(hue, 0.8, 0.9));

    // Mix colors
    vec3 color = mix(u_primaryColor, freqColor, rings * 0.7);
    color = mix(color, u_secondaryColor, angularPattern * 0.3);

    // Apply effects
    color *= fade;
    color *= (0.5 + rings * 0.5);
    color += u_primaryColor * exp(-dist * 3.0) * u_beatIntensity * 2.0;

    // Glow
    color += freqColor * exp(-dist * 2.0) * u_energy;

    gl_FragColor = vec4(color, 1.0);
  }
`
