// Flame Shader - Audio-reactive fire
export const flameShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform float u_intensity;
  uniform float u_wobble;
  uniform vec3 u_lowColor;
  uniform vec3 u_midColor;
  uniform vec3 u_highColor;

  varying vec2 v_position;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * snoise(p); p *= 2.02;
    f += 0.2500 * snoise(p); p *= 2.03;
    f += 0.1250 * snoise(p); p *= 2.01;
    f += 0.0625 * snoise(p);
    return f;
  }

  void main() {
    vec2 uv = v_position;
    uv.x *= u_resolution.x / u_resolution.y;

    float time = u_time;

    // Flame base position (from bottom)
    float flameBase = -1.0 + 0.2;

    // Distance from center bottom
    float distX = abs(uv.x);
    float distY = uv.y - flameBase;

    // Audio-driven wobble
    float wobbleX = snoise(vec2(uv.y * 3.0, time * 2.0)) * u_wobble;
    wobbleX *= (u_bass + u_mid * 0.5);
    uv.x += wobbleX * (1.0 - distY * 0.5);

    // Flame shape
    float flameWidth = 0.4 + u_bass * 0.3;
    float flameHeight = 0.8 + (u_bass + u_mid + u_high) * 0.3 * u_intensity;

    // Turbulent coordinates
    vec2 turbUV = uv * 3.0;
    turbUV.y -= time * 3.0;
    float turb = fbm(turbUV) * 0.5;

    // Flame density
    float flame = 1.0 - (distX / flameWidth);
    flame *= 1.0 - (distY / flameHeight);
    flame += turb * 0.5;
    flame = smoothstep(0.0, 1.0, flame);

    // Layer flames for bass/mid/high
    vec2 uv2 = uv;
    uv2.x += snoise(vec2(uv.y * 4.0, time * 3.0)) * u_wobble * u_mid;
    float flameMid = 1.0 - (abs(uv2.x) / (flameWidth * 0.7));
    flameMid *= 1.0 - (distY / (flameHeight * 0.8));
    flameMid += fbm(turbUV * 1.5 + 1.0) * 0.5;
    flameMid = smoothstep(0.0, 1.0, flameMid) * u_mid;

    vec2 uv3 = uv;
    uv3.x += snoise(vec2(uv.y * 5.0, time * 4.0)) * u_wobble * u_high;
    float flameHigh = 1.0 - (abs(uv3.x) / (flameWidth * 0.5));
    flameHigh *= 1.0 - (distY / (flameHeight * 0.6));
    flameHigh += fbm(turbUV * 2.0 + 2.0) * 0.5;
    flameHigh = smoothstep(0.0, 1.0, flameHigh) * u_high;

    // Combine colors
    vec3 color = vec3(0.0);
    color += u_lowColor * flame * (0.5 + u_bass);
    color += u_midColor * flameMid;
    color += u_highColor * flameHigh;

    // Inner glow (hottest part)
    float inner = flame * flameMid * flameHigh;
    color += vec3(1.0, 0.9, 0.7) * inner * 2.0;

    // Beat pulse
    color *= 1.0 + u_beat * 0.3;

    // Intensity
    color *= u_intensity;

    // Clip to positive Y
    color *= step(flameBase, uv.y);

    gl_FragColor = vec4(color, 1.0);
  }
`
