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
