/**
 * Base WebGL Shaders
 *
 * Core vertex and fragment shaders used across visualizations.
 */

export const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_amplitude;
  attribute float a_index;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_sensitivity;
  uniform int u_visualType;

  varying float v_amplitude;
  varying float v_index;
  varying vec2 v_position;

  void main() {
    v_amplitude = a_amplitude;
    v_index = a_index;
    v_position = a_position;

    vec2 pos = a_position;

    // Convert from pixels to clip space
    vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
    clipSpace.y = -clipSpace.y; // Flip Y

    gl_Position = vec4(clipSpace, 0.0, 1.0);
    gl_PointSize = 4.0;
  }
`

export const fragmentShaderSource = `
  precision mediump float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform int u_visualType;

  varying float v_amplitude;
  varying float v_index;
  varying vec2 v_position;

  void main() {
    // Gradient based on amplitude
    vec3 color = mix(u_primaryColor, u_secondaryColor, v_amplitude);

    // Add glow effect
    float glow = smoothstep(0.0, 1.0, v_amplitude);
    color += glow * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`

export const particleVertexShader = `
  attribute vec2 a_position;
  attribute float a_amplitude;
  attribute float a_size;
  attribute float a_life;

  uniform vec2 u_resolution;
  uniform float u_time;

  varying float v_amplitude;
  varying float v_life;

  void main() {
    v_amplitude = a_amplitude;
    v_life = a_life;

    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
    clipSpace.y = -clipSpace.y;

    gl_Position = vec4(clipSpace, 0.0, 1.0);
    gl_PointSize = a_size * (0.5 + v_life * 0.5);
  }
`

export const quadVertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

export const particleFragmentShader = `
  precision mediump float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;

  varying float v_amplitude;
  varying float v_life;

  void main() {
    // Circular particle shape
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Gradient based on amplitude
    vec3 color = mix(u_primaryColor, u_secondaryColor, v_amplitude);

    // Fade based on life
    float alpha = (1.0 - dist * 2.0) * v_life;

    // Add glow
    color += v_amplitude * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`

export const spectrumFragmentShader = `
  precision mediump float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;

  varying float v_amplitude;
  varying float v_index;
  varying vec2 v_position;

  void main() {
    vec3 color = mix(u_primaryColor, u_secondaryColor, v_amplitude);
    float glow = smoothstep(0.0, 1.0, v_amplitude) * 0.5;
    color += glow;

    gl_FragColor = vec4(color, 1.0);
  }
`
