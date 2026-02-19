// Game of Life Shader
// Uses ping-pong technique with state texture for cellular automaton
export const gameOfLifeShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_beat;
  uniform float u_bass;
  uniform vec2 u_resolution;
  uniform sampler2D u_state;
  uniform float u_cellSize;
  uniform float u_injectBeat;

  varying vec2 v_position;

  // Hash function for random
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;
    float cellSize = u_cellSize / min(u_resolution.x, u_resolution.y);

    // Grid coordinates
    vec2 cellPos = floor(uv / cellSize);
    vec2 cellUV = fract(uv / cellSize);

    // Sample current state (stored in red channel)
    float state = texture2D(u_state, (cellPos + 0.5) * cellSize).r;

    // Count neighbors
    float neighbors = 0.0;
    for (float dx = -1.0; dx <= 1.0; dx++) {
      for (float dy = -1.0; dy <= 1.0; dy++) {
        if (dx == 0.0 && dy == 0.0) continue;
        vec2 neighborPos = (cellPos + vec2(dx, dy) + 0.5) * cellSize;
        neighbors += step(0.5, texture2D(u_state, neighborPos).r);
      }
    }

    // Game of Life rules (will be applied in JS, here we just visualize)
    // For now, create procedural life simulation
    float t = u_time * (0.5 + u_bass * 2.0);

    // Noise-based life simulation
    float n1 = hash(cellPos + floor(t));
    float n2 = hash(cellPos * 1.3 + floor(t * 0.7));
    float n3 = hash(cellPos * 0.7 + floor(t * 1.3));

    // Create evolving patterns
    float life = 0.0;
    life += step(0.7, sin(cellPos.x * 0.3 + t) * sin(cellPos.y * 0.3 + t * 0.7));
    life += step(0.8, n1 + n2 * sin(t * 2.0));

    // Beat injection - spawn random cells
    if (u_injectBeat > 0.5) {
      float beatRand = hash(cellPos + floor(u_time * 10.0));
      life += step(0.85, beatRand);
    }

    life = clamp(life, 0.0, 1.0);

    // Smooth cell edges
    float cellBorder = smoothstep(0.0, 0.05, cellUV.x) * smoothstep(1.0, 0.95, cellUV.x);
    cellBorder *= smoothstep(0.0, 0.05, cellUV.y) * smoothstep(1.0, 0.95, cellUV.y);

    // Color: dead = dark red/brown, alive = bright green/white
    vec3 deadColor = vec3(0.2, 0.05, 0.05);
    vec3 aliveColor = mix(vec3(0.0, 0.8, 0.2), vec3(1.0), life * u_bass);

    vec3 color = mix(deadColor, aliveColor, life);
    color *= cellBorder * 0.8 + 0.2;

    // Add glow for alive cells
    color += aliveColor * life * 0.3 * (1.0 - cellBorder);

    // Energy boost
    color *= 0.7 + u_bass * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`
