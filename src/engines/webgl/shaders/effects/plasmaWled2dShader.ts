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

  varying vec2 v_position;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
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

    // Color palette (WLED style - bright and saturated)
    float hue = fract(v + time * 0.1);
    vec3 color = hsv2rgb(vec3(hue, 1.0, 1.0));

    // Beat pulse
    color *= 0.8 + u_beat * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`
