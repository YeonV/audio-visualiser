export const fragmentShaderSource = `
  precision mediump float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform int u_visualType;
  uniform sampler2D u_gradient;
  uniform bool u_useGradient;
  uniform float u_gradientRoll;

  varying float v_amplitude;
  varying float v_index;
  varying vec2 v_position;

  void main() {
    vec3 color;
    if (u_useGradient) {
      color = texture2D(u_gradient, vec2(fract(v_index + u_gradientRoll), 0.5)).rgb;
    } else {
      color = mix(u_primaryColor, u_secondaryColor, v_amplitude);
    }

    // Add glow effect
    float glow = smoothstep(0.0, 1.0, v_amplitude);
    color += glow * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`
