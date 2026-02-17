export const particleVertexShader = `
  attribute vec2 a_position;
  attribute float a_amplitude;
  attribute float a_size;
  attribute float a_life;
  attribute float a_index;

  uniform vec2 u_resolution;
  uniform float u_time;

  varying float v_amplitude;
  varying float v_life;
  varying float v_index;

  void main() {
    v_amplitude = a_amplitude;
    v_life = a_life;
    v_index = a_index;

    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
    clipSpace.y = -clipSpace.y;

    gl_Position = vec4(clipSpace, 0.0, 1.0);
    gl_PointSize = a_size * (0.5 + v_life * 0.5);
  }
`
