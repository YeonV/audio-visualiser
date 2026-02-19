export const waveformTunnelShader = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beatIntensity;
  uniform float u_energy;
  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform sampler2D u_frequencyTexture;

  varying vec2 v_position;
  varying vec2 v_uv;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    float time = u_time * 0.5;

    // Tunnel effect
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Tunnel depth
    float depth = 0.5 / (radius + 0.1);

    // Tunnel UV
    float tunnelX = angle / 3.14159;
    float tunnelY = depth - time;

    // Waveform distortion
    float wave = sin(tunnelX * 10.0 + tunnelY * 5.0 + u_bass * 10.0) * u_mid;
    wave += sin(tunnelX * 20.0 - tunnelY * 3.0) * u_high * 0.5;

    // Tunnel rings
    float rings = sin(depth * 20.0 - time * 5.0 + u_beatIntensity * 5.0);
    rings = smoothstep(0.0, 0.1, rings) - smoothstep(0.4, 0.5, rings);

    // Beat pulse on radius
    float pulse = 1.0 + u_beatIntensity * 0.3;

    // Color gradient through tunnel
    float hue = fract(depth * 0.2 + time * 0.1 + u_bass * 0.3);
    vec3 tunnelColor = hsv2rgb(vec3(hue, 0.7, 0.8));

    // Mix with theme colors
    vec3 color = mix(u_primaryColor, tunnelColor, 0.6);
    color = mix(color, u_secondaryColor, rings * 0.5);

    // Apply depth fade
    color *= smoothstep(5.0, 0.5, depth);

    // Add edge glow
    color += u_primaryColor * rings * 0.5;

    // Beat flash
    color += u_secondaryColor * u_beatIntensity * 0.3;

    // Center glow
    float centerGlow = exp(-radius * 3.0) * u_energy * 2.0;
    color += u_primaryColor * centerGlow;

    // Vignette
    color *= 1.0 - smoothstep(0.5, 1.5, radius);

    gl_FragColor = vec4(color, 1.0);
  }
`
