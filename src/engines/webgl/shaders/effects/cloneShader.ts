// Clone Shader - Mirrored/cloned patterns
export const cloneShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform float u_mirrors;

  varying vec2 v_position;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    uv.x *= u_resolution.x / u_resolution.y;

    float time = u_time;

    // Apply mirror effect
    float mirrors = max(1.0, u_mirrors);
    uv = abs(uv);
    uv = fract(uv * mirrors / 2.0) * 2.0 - 1.0;
    uv = abs(uv);

    // Create pattern
    float pattern = 0.0;
    float scale = 3.0 + u_bass * 2.0;

    pattern += sin(uv.x * scale + time);
    pattern += sin(uv.y * scale + time * 1.1);
    pattern += sin((uv.x + uv.y) * scale * 0.7 + time * 0.9);
    pattern += sin(length(uv) * scale * 1.5 - time * 1.3);

    pattern = pattern * 0.25 + 0.5;

    // Color
    float hue = fract(pattern + time * 0.1);
    vec3 color = hsv2rgb(vec3(hue, 0.7, 0.9));

    // Mix with theme
    color = mix(color, u_primaryColor, pattern * 0.3);
    color = mix(color, u_secondaryColor, (1.0 - pattern) * 0.2);

    // Beat flash
    color *= 1.0 + u_beat * 0.4;

    // Audio energy
    color *= 0.7 + (u_bass + u_mid + u_high) * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`
