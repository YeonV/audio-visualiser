export const spectrumFragmentShader = `
  precision mediump float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform sampler2D u_gradient;
  uniform bool u_useGradient;
  uniform float u_gradientRoll;

  varying float v_amplitude;
  varying float v_index;
  varying vec2 v_position;

  void main() {
    vec3 color;
    if (u_useGradient) {
      float gradPos = fract(v_index + u_gradientRoll);
      color = texture2D(u_gradient, vec2(gradPos, 0.5)).rgb;
    } else {
      color = mix(u_primaryColor, u_secondaryColor, v_amplitude);
    }
    float glow = smoothstep(0.0, 1.0, v_amplitude) * 0.5;
    color += glow;

    gl_FragColor = vec4(color, 1.0);
  }
`
