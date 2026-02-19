// Equalizer 2D Shader - Spectrum analyzer with ring mode
export const equalizer2dShader = `
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
  uniform float u_ringMode;
  uniform float u_centerMode;
  uniform float u_spin;

  varying vec2 v_position;

  #define PI 3.14159265359

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;

    float bands = u_bands;
    vec3 color = vec3(0.0);

    if (u_ringMode > 0.5) {
      // Ring mode - polar coordinates
      float angle = atan(uv.y, uv.x) + PI + u_spin;
      float radius = length(uv);

      // Map angle to band index
      float bandAngle = 2.0 * PI / bands;
      float bandIdx = floor(mod(angle, 2.0 * PI) / bandAngle);
      float bandFrac = fract(mod(angle, 2.0 * PI) / bandAngle);

      // Sample melbank
      float melVal = texture2D(u_melbank, vec2((bandIdx + 0.5) / bands, 0.5)).r;

      // Bar dimensions in polar
      float innerRadius = 0.2;
      float maxRadius = 0.9;
      float barRadius = innerRadius + melVal * (maxRadius - innerRadius);

      // Draw bar
      float inBar = step(innerRadius, radius) * step(radius, barRadius);
      float edgeFade = smoothstep(0.0, 0.1, bandFrac) * smoothstep(1.0, 0.9, bandFrac);

      // Color by frequency
      float hue = bandIdx / bands;
      vec3 barColor = hsv2rgb(vec3(hue, 0.8, 1.0));

      color = barColor * inBar * edgeFade;

      // Peak glow
      float peakDist = abs(radius - barRadius);
      color += barColor * exp(-peakDist * 20.0) * 0.5;

      // Center glow
      color += u_primaryColor * exp(-radius * 5.0) * u_bass;

    } else {
      // Bar mode
      uv.x *= u_resolution.x / u_resolution.y;

      float barWidth = 2.0 / bands;
      float barIdx = floor((uv.x + 1.0) / barWidth);
      float barX = fract((uv.x + 1.0) / barWidth);

      if (barIdx >= 0.0 && barIdx < bands) {
        // Sample melbank
        float melVal = texture2D(u_melbank, vec2((barIdx + 0.5) / bands, 0.5)).r;

        float barHeight = melVal;
        float barY;

        if (u_centerMode > 0.5) {
          // Center mode - bars grow from middle
          barY = abs(uv.y);
          barHeight *= 0.5;
        } else {
          // Bottom mode - bars grow from bottom
          barY = (uv.y + 1.0) * 0.5;
        }

        // Draw bar
        float inBar = step(barY, barHeight);
        float edgeFade = smoothstep(0.0, 0.1, barX) * smoothstep(1.0, 0.9, barX);

        // Color by frequency
        float hue = barIdx / bands * 0.8;
        vec3 barColor = hsv2rgb(vec3(hue, 0.9, 1.0));

        color = barColor * inBar * edgeFade;

        // Top glow
        float topDist = abs(barY - barHeight);
        color += barColor * exp(-topDist * 30.0) * 0.5;
      }
    }

    // Beat flash
    color *= 1.0 + u_beat * 0.2;

    gl_FragColor = vec4(color, 1.0);
  }
`
