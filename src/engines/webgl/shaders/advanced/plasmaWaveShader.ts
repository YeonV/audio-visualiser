export const plasmaWaveShader = `
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

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position * 2.0;
    float time = u_time * 0.5;

    // Multiple plasma layers
    float plasma = 0.0;

    // Layer 1 - Slow moving base
    plasma += sin(uv.x * 3.0 + time + u_bass * 5.0);
    plasma += sin(uv.y * 3.0 + time * 0.7);
    plasma += sin((uv.x + uv.y) * 2.0 + time * 0.5);

    // Layer 2 - Medium detail
    plasma += sin(length(uv) * 5.0 - time * 2.0 + u_mid * 3.0) * 0.5;
    plasma += sin(atan(uv.y, uv.x) * 4.0 + time) * 0.5;

    // Layer 3 - Fine detail
    vec2 rotUV = vec2(
      uv.x * cos(time * 0.2) - uv.y * sin(time * 0.2),
      uv.x * sin(time * 0.2) + uv.y * cos(time * 0.2)
    );
    plasma += sin(rotUV.x * 8.0 + u_high * 5.0) * 0.3;
    plasma += sin(rotUV.y * 8.0 - time) * 0.3;

    // Normalize
    plasma = plasma / 5.0;
    plasma = plasma * 0.5 + 0.5;

    // Beat modulation
    plasma = pow(plasma, 1.0 - u_beatIntensity * 0.3);

    // Color mapping
    float hue = plasma * 0.5 + time * 0.05 + u_bass * 0.2;
    vec3 plasmaColor = hsv2rgb(vec3(hue, 0.7, 0.8));

    // Mix with theme colors
    vec3 color = mix(u_primaryColor, plasmaColor, 0.7);
    color = mix(color, u_secondaryColor, sin(plasma * 3.14159) * 0.3);

    // Brightness based on energy
    color *= 0.5 + u_energy * 1.0;

    // Center glow on beat
    float centerDist = length(v_position);
    color += u_primaryColor * exp(-centerDist * 2.0) * u_beatIntensity;

    // Vignette
    color *= 1.0 - centerDist * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`
