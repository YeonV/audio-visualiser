// Matrix Rain Effect
export const matrixRainShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_energy;
  uniform vec2 u_resolution;

  varying vec2 v_position;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;
    float time = u_time;
    float energy = u_energy;

    // Create grid
    float cols = 30.0;
    float rows = 20.0;

    vec2 gridUV = uv * vec2(cols, rows);
    vec2 gridID = floor(gridUV);
    vec2 gridPos = fract(gridUV);

    // Random speed per column
    float colRand = random(vec2(gridID.x, 0.0));
    float speed = 2.0 + colRand * 3.0 + energy * 5.0;

    // Falling effect
    float fall = fract(time * speed * 0.1 + colRand * 10.0);
    float brightness = 1.0 - abs(gridID.y / rows - fall);
    brightness = pow(max(0.0, brightness), 3.0);

    // Character flicker
    float charRand = random(gridID + floor(time * 10.0));
    float char = step(0.5, charRand) * brightness;

    // Trail effect
    float trail = smoothstep(0.0, 0.5, brightness) * 0.5;

    // Color
    vec3 color = u_primaryColor * (char + trail);
    color += u_secondaryColor * brightness * 0.2;

    // Energy boost
    color *= 0.7 + energy * 1.5;

    // Add glow
    color += u_primaryColor * exp(-length(gridPos - 0.5) * 4.0) * char * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`
