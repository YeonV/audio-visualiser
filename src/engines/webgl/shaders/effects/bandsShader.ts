// Bands Shader - Simple audio bars (1D style)
export const bandsShader = `
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
  uniform float u_flip;
  uniform sampler2D u_gradient; // 1D gradient texture

  varying vec2 v_position;

  // Sample a color from the 1D gradient texture
  vec3 sampleGradient(float t) {
    return texture2D(u_gradient, vec2(t, 0.5)).rgb;
  }

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;

    float bands = u_bands;
    float barWidth = 1.0 / bands;
    float barIdx = floor(uv.x * bands);
    float barX = fract(uv.x * bands);

    // Sample melbank
    float melVal = texture2D(u_melbank, vec2((barIdx + 0.5) / bands, 0.5)).r;

    // Bar height
    float barY = u_flip > 0.5 ? 1.0 - uv.y : uv.y;
    float inBar = step(barY, melVal);

    // Gap between bars
    float gap = smoothstep(0.0, 0.1, barX) * smoothstep(1.0, 0.9, barX);

    // Color from gradient
    float gradT = barIdx / (bands - 1.0);
    vec3 barColor = sampleGradient(gradT);

    vec3 color = barColor * inBar * gap;

    // Glow at top
    float topGlow = exp(-abs(barY - melVal) * 20.0) * 0.5;
    color += barColor * topGlow * gap;

    // Beat pulse
    color *= 1.0 + u_beat * 0.2;

    gl_FragColor = vec4(color, 1.0);
  }
`
