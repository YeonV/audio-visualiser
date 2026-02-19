export const neonGridShader = `
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
  varying vec2 v_uv;

  void main() {
    vec2 uv = v_position;
    float time = u_time;

    // Perspective transform for ground plane
    float horizon = 0.0;
    float perspective = 1.0 / (uv.y - horizon + 0.5);
    vec2 groundUV = vec2(uv.x * perspective * 2.0, perspective);

    // Scroll
    groundUV.y -= time * 2.0 + u_bass * 2.0;

    // Grid lines
    float gridX = abs(sin(groundUV.x * 10.0));
    float gridY = abs(sin(groundUV.y * 5.0));

    float lineWidth = 0.05 + u_beatIntensity * 0.02;
    float grid = smoothstep(lineWidth, 0.0, gridX) + smoothstep(lineWidth, 0.0, gridY);

    // Wave on horizon
    float wave = sin(uv.x * 10.0 + time * 3.0) * u_bass * 0.1;
    wave += sin(uv.x * 20.0 - time * 2.0) * u_mid * 0.05;

    // Horizon line
    float horizonLine = smoothstep(0.02, 0.0, abs(uv.y - horizon - wave));

    // Sun
    vec2 sunPos = vec2(0.0, 0.3);
    float sunDist = length(uv - sunPos);
    float sun = smoothstep(0.3, 0.0, sunDist);
    float sunRays = sin(atan(uv.y - sunPos.y, uv.x - sunPos.x) * 20.0 + time) * 0.5 + 0.5;
    sun += sunRays * smoothstep(0.5, 0.2, sunDist) * 0.3;

    // Ground fade
    float groundFade = smoothstep(horizon - 0.5, horizon, uv.y);

    // Sky gradient
    vec3 skyColor = mix(vec3(0.0, 0.0, 0.1), vec3(0.1, 0.0, 0.2), uv.y + 0.5);

    // Colors
    vec3 color = skyColor;

    // Sun
    color += u_secondaryColor * sun * 2.0;

    // Grid
    color += u_primaryColor * grid * perspective * 0.5 * groundFade;

    // Horizon glow
    color += mix(u_primaryColor, u_secondaryColor, 0.5) * horizonLine * 2.0;

    // Mountains silhouette
    float mountain = sin(uv.x * 3.0 + 1.0) * 0.1 + sin(uv.x * 7.0) * 0.05;
    mountain = smoothstep(horizon + mountain + 0.05, horizon + mountain, uv.y);
    color *= 1.0 - mountain * 0.8;

    // Beat pulse
    color += u_primaryColor * u_beatIntensity * 0.2;

    // Scanlines
    color *= 0.95 + 0.05 * sin(v_uv.y * u_resolution.y * 2.0);

    gl_FragColor = vec4(color, 1.0);
  }
`
