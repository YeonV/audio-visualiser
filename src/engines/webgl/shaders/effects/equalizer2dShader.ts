// Equalizer 2D Shader - Spectrum analyzer with ring mode
export const equalizer2dShader = `
  precision highp float;

  uniform vec3 u_pulseColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform sampler2D u_melbank;
  uniform float u_bands;
  uniform sampler2D u_peaks;
  uniform float u_ringMode;
  uniform float u_centerMode;
  uniform float u_spin;
  uniform sampler2D u_gradient;
  uniform float u_gradientRoll;
  uniform bool u_peakMarks;
  uniform vec3 u_peakColor;
  uniform bool u_flipHorizontal;
  uniform bool u_flipVertical;
  uniform float u_peakPercent;
  uniform float u_peakDecay;
  uniform float u_brightness;
  uniform float u_rotate;

  varying vec2 v_position;

  #define PI 3.14159265359

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    
    // Apply flip (use sign for correct mirroring)
    uv.x *= (u_flipHorizontal ? -1.0 : 1.0);
    uv.y *= (u_flipVertical ? -1.0 : 1.0);
    
    // Apply rotation
    float c = cos(u_rotate);
    float s = sin(u_rotate);
    uv = mat2(c, -s, s, c) * uv;

    float bands = u_bands;
    vec3 color = vec3(0.0);

    if (u_ringMode > 0.5) {
      // --- RING MODE ---
      float angle = atan(uv.y, uv.x) + PI + u_spin;
      float radius = length(uv);

      // Map angle to band index
      float bandAngle = 2.0 * PI / bands;
      float bandIdx = floor(mod(angle, 2.0 * PI) / bandAngle);
      float bandFrac = fract(mod(angle, 2.0 * PI) / bandAngle);

      vec2 texCoord = vec2((bandIdx + 0.5) / bands, 0.5);
      
      // Sample melbank
      float melVal = texture2D(u_melbank, texCoord).r;

      // Bar dimensions in polar
      float innerRadius = 0.2;
      float maxRadius = 0.9;
      float barRadius = innerRadius + melVal * (maxRadius - innerRadius);

      // Draw main bar
      float inBar = step(innerRadius, radius) * step(radius, barRadius);
      float edgeFade = smoothstep(0.0, 0.1, bandFrac) * smoothstep(1.0, 0.9, bandFrac);

      // Color by gradient texture
      float gradPos = mod(bandIdx / bands + u_gradientRoll, 1.0);
      vec3 barColor = texture2D(u_gradient, vec2(gradPos, 0.5)).rgb;

      color = barColor * inBar * edgeFade;

      // Peak glow
      float peakDist = abs(radius - barRadius);
      color += barColor * exp(-peakDist * 20.0) * 0.5;

      // Peak marks
      if (u_peakMarks) {
        float peakVal = texture2D(u_peaks, texCoord).r;
        float peakRadius = innerRadius + peakVal * (maxRadius - innerRadius);
        float markHalfHeight = u_peakPercent * 0.5 * (maxRadius - innerRadius);
        // Match bar width: use same edgeFade as bar
        float markEdgeFade = edgeFade;
        float inPeak = step(peakRadius - markHalfHeight, radius) * step(radius, peakRadius + markHalfHeight);
        color = mix(color, u_peakColor, inPeak * markEdgeFade);
      }

      // Center glow (pulse color, always visible in ring mode)
      color = mix(color, u_pulseColor, exp(-radius * 5.0) * clamp(u_bass, 0.0, 1.0));

    } else {
      // --- BAR MODE ---
      uv.x *= u_resolution.x / u_resolution.y;

      float barWidth = 2.0 / bands;
      float barIdx = floor((uv.x + 1.0) / barWidth);
      float barX = fract((uv.x + 1.0) / barWidth);

      if (barIdx >= 0.0 && barIdx < bands) {
        vec2 texCoord = vec2((barIdx + 0.5) / bands, 0.5);
        
        // Sample melbank
        float melVal = texture2D(u_melbank, texCoord).r;

        float barHeight = melVal;
        float barY;
        float heightMultiplier = 1.0; 

        if (u_centerMode > 0.5) {
          // Center mode - bars grow from middle
          barY = abs(uv.y);
          barHeight *= 0.5;
          heightMultiplier = 0.5;
        } else {
          // Bottom mode - bars grow from bottom
          barY = (uv.y + 1.0) * 0.5;
        }

        // Draw main bar
        float inBar = step(barY, barHeight);
        float edgeFade = smoothstep(0.0, 0.1, barX) * smoothstep(1.0, 0.9, barX);

        // Color by gradient texture
        float gradPos = mod(barIdx / bands + u_gradientRoll, 1.0);
        vec3 barColor = texture2D(u_gradient, vec2(gradPos, 0.5)).rgb;

        color = barColor * inBar * edgeFade;

        // Top glow
        float topDist = abs(barY - barHeight);
        color += barColor * exp(-topDist * 30.0) * 0.5;

        // Peak marks
        if (u_peakMarks) {
          float rawPeakVal = texture2D(u_peaks, texCoord).r;
          float scaledPeakVal = rawPeakVal * heightMultiplier;
          float markHalfHeight = u_peakPercent * 0.5 * heightMultiplier;
          // Match bar width: use same edgeFade as bar
          float markEdgeFade = edgeFade;
          float inPeak = step(scaledPeakVal - markHalfHeight, barY) * step(barY, scaledPeakVal + markHalfHeight);
          color = mix(color, u_peakColor, inPeak * markEdgeFade);
        }
      }
    }

    // Brightness
    color *= u_brightness;

    // Beat flash
    color *= 1.0 + u_beat * 0.2;

    gl_FragColor = vec4(color, 1.0);
  }
`;