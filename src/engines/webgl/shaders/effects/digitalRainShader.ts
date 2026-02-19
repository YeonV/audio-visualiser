// Digital Rain Shader - Matrix-style falling code
export const digitalRainShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform float u_density;
  uniform float u_speed;
  uniform float u_tailLength;
  uniform float u_glowIntensity;

  varying vec2 v_position;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float randomChar(vec2 st) {
    return fract(sin(dot(st, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;
    float time = u_time * u_speed;

    // Column parameters
    float cols = 40.0 * u_density;
    float charHeight = 0.025;

    // Get column index
    float colIdx = floor(uv.x * cols);
    float colX = (colIdx + 0.5) / cols;

    // Per-column properties (seeded by column index)
    float colSeed = random(vec2(colIdx, 0.0));
    float colSpeed = 0.5 + colSeed * 1.5;
    float colOffset = colSeed * 10.0;

    // Audio modulation per column (distribute bass/mid/high across columns)
    float audioMod = 1.0;
    float colFrac = colIdx / cols;
    if (colFrac < 0.33) {
      audioMod += u_bass * 2.0;
    } else if (colFrac < 0.66) {
      audioMod += u_mid * 1.5;
    } else {
      audioMod += u_high * 1.0;
    }

    // Calculate fall position
    float fall = fract(time * colSpeed * audioMod * 0.3 + colOffset);
    float headY = 1.0 - fall;

    // Character grid
    float charRow = floor(uv.y / charHeight);
    float charY = (charRow + 0.5) * charHeight;

    // Distance from head
    float dist = charY - headY;

    // Tail effect
    float tail = u_tailLength;
    float inTail = step(0.0, dist) * step(dist, tail);
    float tailFade = 1.0 - (dist / tail);
    tailFade = pow(tailFade, 2.0) * inTail;

    // Head glow (brightest point)
    float headDist = abs(charY - headY);
    float headGlow = exp(-headDist * 50.0) * u_glowIntensity;

    // Character flicker
    float charSeed = random(vec2(colIdx, charRow + floor(time * 10.0)));
    float charBright = step(0.3, charSeed);

    // Combine
    float brightness = (tailFade * charBright * 0.8 + headGlow);

    // Color - green with white head
    vec3 greenColor = u_primaryColor;
    vec3 whiteColor = vec3(1.0);
    vec3 color = mix(greenColor, whiteColor, headGlow);
    color *= brightness;

    // Add subtle column variation
    color *= 0.8 + 0.2 * random(vec2(colIdx, 1.0));

    // Beat pulse - flash all active characters
    color += greenColor * u_beat * tailFade * 0.3;

    // Scanline effect
    float scanline = sin(uv.y * u_resolution.y * 2.0) * 0.1 + 0.9;
    color *= scanline;

    gl_FragColor = vec4(color, 1.0);
  }
`
