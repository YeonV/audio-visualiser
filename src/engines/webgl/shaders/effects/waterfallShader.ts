// Waterfall Shader - Scrolling frequency waterfall
export const waterfallShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform sampler2D u_melbank;
  uniform float u_bands;
  uniform float u_speed;
  uniform sampler2D u_gradient; // 1D gradient texture

  varying vec2 v_position;

  // Sample a color from the 1D gradient texture
  vec3 sampleGradient(float t) {
    return texture2D(u_gradient, vec2(t, 0.5)).rgb;
  }

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;

    // Scrolling effect
    float scroll = fract(uv.y + u_time * u_speed * 0.1);

    // Frequency bands
    float bands = u_bands;
    float bandIdx = floor(uv.x * bands);

    // Sample current audio
    float melVal = texture2D(u_melbank, vec2((bandIdx + 0.5) / bands, 0.5)).r;

    // Create waterfall pattern
    // Use noise to simulate history since we can't store it
    float historyNoise = random(vec2(bandIdx, floor(scroll * 50.0)));
    float intensity = melVal * (1.0 - scroll) + historyNoise * scroll * 0.3;

    // Color from gradient by band
    float gradT = bandIdx / (bands - 1.0);
    vec3 baseColor = sampleGradient(gradT);
    vec3 color = baseColor * intensity;

    // Add glow for high values
    color += baseColor * pow(intensity, 3.0) * 0.5;

    // Beat pulse
    color *= 1.0 + u_beat * 0.2;

    gl_FragColor = vec4(color, 1.0);
  }
`
