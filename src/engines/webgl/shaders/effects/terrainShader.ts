// Waveform Terrain
export const terrainShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_energy;
  uniform float u_beat;

  varying vec2 v_position;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    float time = u_time * 0.5;
    float energy = u_energy;

    // Perspective transform
    float perspective = 1.0 / (uv.y * 0.5 + 1.0);
    vec2 groundUV = vec2(uv.x * perspective, perspective);

    // Scrolling terrain
    groundUV.y += time + u_beat * 0.5;

    // Generate terrain height
    float height = 0.0;
    height += sin(groundUV.x * 4.0 + groundUV.y * 2.0) * 0.3;
    height += sin(groundUV.x * 8.0 - groundUV.y * 4.0 + time) * 0.15;
    height += sin(groundUV.x * 16.0 + time * 2.0) * 0.075 * energy;

    // Height line
    float terrainY = height * (1.0 - uv.y * 0.5) * energy;
    float line = smoothstep(0.02, 0.0, abs(uv.y - 0.3 - terrainY * 0.5));

    // Grid lines
    float gridX = smoothstep(0.02, 0.0, abs(fract(groundUV.x * 10.0) - 0.5) - 0.48);
    float gridY = smoothstep(0.02, 0.0, abs(fract(groundUV.y * 5.0) - 0.5) - 0.48);
    float grid = max(gridX, gridY) * smoothstep(-0.5, 0.5, uv.y) * 0.3;

    // Sun/horizon glow
    float sun = exp(-length(uv - vec2(0.0, 0.8)) * 3.0);

    // Color
    vec3 color = vec3(0.0);

    // Sky gradient
    float skyGrad = smoothstep(-0.2, 0.8, uv.y);
    color = mix(u_secondaryColor * 0.3, vec3(0.0), skyGrad);

    // Sun
    color += u_primaryColor * sun * 2.0;

    // Grid
    color += u_primaryColor * grid * perspective;

    // Terrain line
    color += u_primaryColor * line * 2.0 * (1.0 + energy);

    // Scanlines
    color *= 0.9 + 0.1 * sin(uv.y * 200.0);

    gl_FragColor = vec4(color, 1.0);
  }
`
