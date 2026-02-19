// Blender Shader - Color blending patterns
export const blenderShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform float u_speed;
  uniform float u_blur;

  varying vec2 v_position;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    uv.x *= u_resolution.x / u_resolution.y;

    float time = u_time * u_speed;

    // Multiple moving color blobs
    vec3 color = vec3(0.0);

    for (float i = 0.0; i < 5.0; i++) {
      float phase = i * 1.256;
      vec2 center = vec2(
        sin(time * 0.5 + phase) * 0.5,
        cos(time * 0.7 + phase * 1.3) * 0.5
      );

      float dist = length(uv - center);
      float blob = exp(-dist * (3.0 - u_blur * 2.0));

      // Color for each blob
      float hue = fract(i * 0.2 + time * 0.1);
      vec3 blobColor = hsv2rgb(vec3(hue, 0.8, 1.0));

      // Audio modulation
      float audioMod = 1.0;
      if (i < 2.0) audioMod += u_bass * 0.5;
      else if (i < 4.0) audioMod += u_mid * 0.5;
      else audioMod += u_high * 0.5;

      color += blobColor * blob * audioMod;
    }

    // Blend with theme colors
    color = mix(color, u_primaryColor, 0.1);
    color = mix(color, u_secondaryColor, 0.1);

    // Beat pulse
    color *= 1.0 + u_beat * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`
