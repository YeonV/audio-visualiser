// Plasma 2D Shader - Classic plasma effect with audio
export const plasma2dShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_energy;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform float u_density;
  uniform float u_twist;

  varying vec2 v_position;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    uv.x *= u_resolution.x / u_resolution.y;

    float time = u_time * 0.5;
    float energy = u_energy;

    // Scale based on energy
    float scale = u_density * (0.5 + energy * 1.5);

    // Plasma formula
    float v = 0.0;

    // First wave
    v += sin((uv.x * scale + time));

    // Second wave
    v += sin((uv.y * scale + time) * 0.5);

    // Third wave (circular)
    float cx = uv.x + 0.5 * sin(time * 0.3);
    float cy = uv.y + 0.5 * cos(time * 0.4);
    v += sin(sqrt(cx * cx + cy * cy + 1.0) * scale);

    // Fourth wave (diagonal with twist)
    float twist = u_twist * (1.0 + energy);
    v += sin((uv.x * cos(time * twist) + uv.y * sin(time * twist)) * scale);

    // Normalize to 0-1
    v = v * 0.25 + 0.5;

    // Beat modulation
    v += sin(u_beat * 3.14159) * 0.1;

    // Color mapping
    float hue = fract(v + time * 0.1);
    vec3 color = hsv2rgb(vec3(hue, 0.8, 0.9));

    // Mix with theme colors
    color = mix(color, u_primaryColor, sin(v * 3.14159) * 0.3 + 0.3);
    color = mix(color, u_secondaryColor, cos(v * 3.14159 * 2.0) * 0.2 + 0.2);

    // Energy boost
    color *= 0.7 + energy * 0.6;

    gl_FragColor = vec4(color, 1.0);
  }
`
