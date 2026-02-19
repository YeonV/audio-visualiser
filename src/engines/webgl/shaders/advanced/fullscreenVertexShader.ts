export const fullscreenVertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  varying vec2 v_position;

  void main() {
    v_position = a_position;
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`
