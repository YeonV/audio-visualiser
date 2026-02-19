// Image Shader - Audio-reactive shape with full configuration
export const imageShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform vec3 u_bgColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform float u_rotate;
  uniform float u_brightness;
  uniform float u_backgroundBrightness;
  uniform float u_multiplier;
  uniform float u_minSize;
  uniform float u_frequencyRange; // 0=lows, 1=mids, 2=highs
  uniform float u_clip;
  uniform float u_spin;

  varying vec2 v_position;

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;
    vec2 center = uv - 0.5;

    // Get energy based on frequency range
    float energy = u_bass;
    if (u_frequencyRange > 0.5 && u_frequencyRange < 1.5) energy = u_mid;
    if (u_frequencyRange > 1.5) energy = u_high;

    // Apply rotation
    float angle = u_rotate * 3.14159 / 180.0;
    if (u_spin > 0.5) angle += u_time * 0.5;
    float cs = cos(angle);
    float sn = sin(angle);
    center = vec2(center.x * cs - center.y * sn, center.x * sn + center.y * cs);

    // Calculate size based on audio
    float size = u_minSize + energy * u_multiplier;

    // Create a circular shape
    float dist = length(center);
    float shape = smoothstep(size + 0.02, size - 0.02, dist);

    // Clip mode - hard edges
    if (u_clip > 0.5) {
      shape = dist < size ? 1.0 : 0.0;
    }

    // Mix foreground and background
    vec3 bgColor = u_bgColor * u_backgroundBrightness;
    vec3 fgColor = mix(u_primaryColor, u_secondaryColor, energy);

    vec3 color = mix(bgColor, fgColor, shape);

    // Apply brightness
    color *= u_brightness;

    // Beat pulse
    color *= 1.0 + u_beat * 0.15;

    gl_FragColor = vec4(color, 1.0);
  }
`
