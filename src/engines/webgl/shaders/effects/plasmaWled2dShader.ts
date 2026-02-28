// PlasmaWled2d Shader - WLED-style plasma
export const plasmaWled2dShader = `
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

  void main() {
    vec2 uv = v_position;
    uv.x *= u_resolution.x / u_resolution.y;

    float time = u_time * 0.5;

    // WLED-style plasma (simpler, faster)
    float v = 0.0;
    v += sin(uv.x * 10.0 + time);
    v += sin(uv.y * 10.0 + time * 1.1);
    v += sin((uv.x + uv.y) * 5.0 + time * 0.5);
    v += sin(sqrt(uv.x * uv.x + uv.y * uv.y) * 10.0);

    v = v * 0.25;

    // Audio modulation
    v += u_bass * sin(time * 3.0) * 0.2;
    v += u_mid * sin(time * 5.0 + uv.x * 3.0) * 0.1;

    // Color from gradient based on v
    float gradT = clamp(v * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = sampleGradient(gradT);

    // Beat pulse
    color *= 0.8 + u_beat * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`
