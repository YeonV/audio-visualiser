// Concentric Shader
export const concentricFragmentShader = `
  precision mediump float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_beat; // Accumulating beat/power value

  varying vec2 v_position;

  void main() {
    float dist = length(v_position);

    // Expanding rings: dist - time
    // We use u_beat to modulate the expansion
    float phase = dist * 4.0 - u_beat * 2.0;

    float val = sin(phase);
    float ring = smoothstep(0.0, 0.1, val) - smoothstep(0.4, 0.5, val);

    // Color gradient based on distance
    vec3 color = mix(u_primaryColor, u_secondaryColor, dist * 0.5 + 0.5);

    // Modulate brightness
    color *= (ring * 0.8 + 0.2);

    // Vignette
    color *= 1.0 - smoothstep(0.5, 1.5, dist);

    gl_FragColor = vec4(color, 1.0);
  }
`
