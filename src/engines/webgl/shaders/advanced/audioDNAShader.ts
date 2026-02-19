export const audioDNAShader = `
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

  varying vec2 v_position;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    float time = u_time * 0.5;

    // DNA helix parameters
    float twist = 8.0;
    float amplitude = 0.3 + u_bass * 0.2;

    // Two helices
    float helix1 = sin(uv.y * twist + time * 2.0) * amplitude;
    float helix2 = sin(uv.y * twist + time * 2.0 + 3.14159) * amplitude;

    // Distance to helices
    float dist1 = abs(uv.x - helix1);
    float dist2 = abs(uv.x - helix2);

    // Helix lines
    float lineWidth = 0.02 + u_mid * 0.02;
    float line1 = smoothstep(lineWidth, 0.0, dist1);
    float line2 = smoothstep(lineWidth, 0.0, dist2);

    // Connecting bars
    float barPhase = fract(uv.y * twist / 6.28318 + time * 0.3);
    float barDist = abs(barPhase - 0.5);
    float showBar = step(barDist, 0.1);

    float barX = mix(helix1, helix2, barPhase * 2.0);
    float barLine = smoothstep(lineWidth * 0.5, 0.0, abs(uv.x - barX)) * showBar;
    barLine *= step(min(helix1, helix2), uv.x) * step(uv.x, max(helix1, helix2));

    // Node points
    float nodes = 0.0;
    for (float i = -5.0; i < 5.0; i++) {
      float y = i * 0.4 + fract(time * 0.5) * 0.4;
      if (abs(uv.y - y) < 0.5) {
        float x1 = sin(y * twist + time * 2.0) * amplitude;
        float x2 = sin(y * twist + time * 2.0 + 3.14159) * amplitude;
        nodes += smoothstep(0.05, 0.0, length(uv - vec2(x1, y)));
        nodes += smoothstep(0.05, 0.0, length(uv - vec2(x2, y)));
      }
    }

    // Color based on position
    float hue = fract(uv.y * 0.2 + time * 0.1);
    vec3 helixColor = hsv2rgb(vec3(hue, 0.7, 0.9));

    // Combine
    vec3 color = vec3(0.0);
    color += u_primaryColor * line1;
    color += u_secondaryColor * line2;
    color += mix(u_primaryColor, u_secondaryColor, 0.5) * barLine * 0.7;
    color += helixColor * nodes * 2.0;

    // Glow
    float glow1 = smoothstep(0.3, 0.0, dist1);
    float glow2 = smoothstep(0.3, 0.0, dist2);
    color += u_primaryColor * glow1 * 0.3 * u_energy;
    color += u_secondaryColor * glow2 * 0.3 * u_energy;

    // Beat pulse
    color += vec3(1.0) * nodes * u_beatIntensity;

    // Fade edges
    color *= smoothstep(1.0, 0.5, abs(uv.y));

    gl_FragColor = vec4(color, 1.0);
  }
`
