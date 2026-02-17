export const particleFragmentShader = `
  precision mediump float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform sampler2D u_gradient;
  uniform bool u_useGradient;
  uniform float u_gradientRoll;

  varying float v_amplitude;
  varying float v_life;
  varying float v_index;

  void main() {
    // Circular particle shape
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Color
    vec3 color;
    if (u_useGradient) {
      color = texture2D(u_gradient, vec2(fract(v_index + u_gradientRoll), 0.5)).rgb;
    } else {
      color = mix(u_primaryColor, u_secondaryColor, v_amplitude);
    }

    // Fade based on life
    float alpha = (1.0 - dist * 2.0) * v_life;

    // Add glow
    color += v_amplitude * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`
