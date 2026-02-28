// Soap Shader - Soap bubble/iridescent effect
export const soapShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform sampler2D u_gradient; // 1D gradient texture

  varying vec2 v_position;

  // Sample a color from the 1D gradient texture
  vec3 sampleGradient(float t) {
    return texture2D(u_gradient, vec2(t, 0.5)).rgb;
  }

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = v_position;
    uv.x *= u_resolution.x / u_resolution.y;

    float time = u_time * 0.3;

    // Create soap bubble interference pattern
    float thickness = 0.0;

    // Multiple sine waves for interference
    thickness += sin(uv.x * 20.0 + time + u_bass * 5.0);
    thickness += sin(uv.y * 15.0 - time * 1.1);
    thickness += sin((uv.x + uv.y) * 12.0 + time * 0.8);
    thickness += sin(length(uv) * 25.0 - time * 1.5 + u_mid * 3.0);
    thickness += sin(uv.x * uv.y * 30.0 + time * 0.5);

    thickness = clamp(thickness * 0.1 + 0.5, 0.0, 1.0);

    // Color from gradient based on thickness
    float gradT = clamp(thickness, 0.0, 1.0);
    vec3 color = sampleGradient(gradT);

    // Add specular highlights
    vec2 lightPos = vec2(0.3, 0.3);
    float spec = exp(-length(uv - lightPos) * 3.0);
    color += vec3(1.0) * spec * 0.3;

    // Audio shimmer
    color *= 0.8 + (u_bass + u_mid + u_high) * 0.2;

    // Beat flash
    color *= 1.0 + u_beat * 0.2;

    // Clamp final color to prevent brightness blowout
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`
