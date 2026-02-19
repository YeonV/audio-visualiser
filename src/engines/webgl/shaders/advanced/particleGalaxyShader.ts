export const particleGalaxyShader = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beatIntensity;
  uniform float u_energy;
  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;

  varying vec2 v_position;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position;
    float time = u_time * 0.3;

    // Polar coordinates
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Spiral arms
    float arms = 3.0;
    float spiral = angle * arms + radius * 5.0 - time * 2.0;
    spiral += u_bass * 2.0;

    // Particle field
    vec2 particleUV = uv * 10.0;
    particleUV += vec2(sin(time), cos(time)) * u_mid;

    float particles = 0.0;
    for (float i = 0.0; i < 3.0; i++) {
      vec2 p = particleUV * (1.0 + i * 0.5);
      p += vec2(time * (0.5 + i * 0.2));
      float n = noise(p);
      particles += smoothstep(0.7, 0.9, n) * (1.0 - i * 0.2);
    }

    // Spiral structure
    float spiralPattern = sin(spiral) * 0.5 + 0.5;
    spiralPattern *= smoothstep(1.5, 0.2, radius);

    // Galaxy core glow
    float core = exp(-radius * 3.0) * (1.0 + u_beatIntensity);

    // Color gradient
    float hue = fract(angle / 6.28318 + time * 0.1 + u_mid * 0.3);
    vec3 galaxyColor = hsv2rgb(vec3(hue, 0.6, 0.8));

    // Combine
    vec3 color = vec3(0.0);
    color += galaxyColor * spiralPattern * 0.5;
    color += u_primaryColor * particles * u_energy;
    color += u_secondaryColor * core * 2.0;

    // Beat pulse
    color += u_primaryColor * u_beatIntensity * 0.4 * smoothstep(1.0, 0.0, radius);

    // Star points
    float stars = step(0.98, random(floor(uv * 50.0)));
    stars *= sin(time * 5.0 + random(floor(uv * 50.0)) * 10.0) * 0.5 + 0.5;
    color += vec3(1.0) * stars * u_high;

    gl_FragColor = vec4(color, 1.0);
  }
`
