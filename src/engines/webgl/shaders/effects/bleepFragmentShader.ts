// Bleep Shader (Scrolling History)
export const bleepFragmentShader = `
  precision mediump float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform sampler2D u_history; // 1D texture containing amplitude history
  uniform float u_time;

  varying vec2 v_position; // -1 to 1

  void main() {
    // Map x (-1 to 1) to texture coordinate (0 to 1)
    float texCoordX = v_position.x * 0.5 + 0.5;

    // Sample history
    float amplitude = texture2D(u_history, vec2(texCoordX, 0.5)).r;

    // Draw line
    float y = v_position.y; // -1 to 1
    // Map amplitude (0 to 1) to y range (-0.5 to 0.5 for example)
    float targetY = (amplitude - 0.5) * 1.5;

    // Thickness
    float thickness = 0.02 + amplitude * 0.05;
    float dist = abs(y - targetY);

    // Glow/Intensity
    float intensity = smoothstep(thickness, 0.0, dist);

    // Color
    vec3 color = mix(u_secondaryColor, u_primaryColor, amplitude);

    // Add some background grid or effect
    float grid = step(0.95, fract(v_position.x * 10.0)) * 0.1;

    gl_FragColor = vec4(color * intensity + grid * u_secondaryColor, 1.0);
  }
`
