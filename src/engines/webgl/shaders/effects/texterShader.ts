
// Texter Shader - Full text effects
export const texterShader = `
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

  uniform sampler2D u_textTexture;
  uniform float u_textAspect;
  uniform int u_textEffect; // 0=Side Scroll, 1=Spokes, 2=Carousel, 3=Wave, 4=Pulse, 5=Fade
  uniform bool u_flipH;
  uniform bool u_flipV;
  uniform float u_rotate; // radians

  // Second text uniforms
  uniform sampler2D u_textTexture2;
  uniform float u_textAspect2;
  uniform int u_textEffect2;
  uniform bool u_flipH2;
  uniform bool u_flipV2;
  uniform float u_rotate2;
  uniform float u_zoom2;
  uniform float u_squeezeX2;
  uniform float u_squeezeY2;
  uniform float u_offsetX2;
  uniform float u_offsetY2;

  uniform sampler2D u_gradient;
  uniform bool u_useGradient;
  uniform float u_gradientRoll;

  uniform float u_zoom;
  uniform float u_squeezeX;
  uniform float u_squeezeY;
  uniform float u_offsetX;
  uniform float u_offsetY;

  varying vec2 v_position;

  void main() {
    // --- First text layer ---
    vec2 uv1 = v_position;
    if (u_flipH) uv1.x *= -1.0;
    if (u_flipV) uv1.y *= -1.0;
    float c1 = cos(u_rotate);
    float s1 = sin(u_rotate);
    uv1 = mat2(c1, -s1, s1, c1) * uv1;
    float invZoom1 = 1.0 / u_zoom;
    float invSqueezeX1 = 1.0 / u_squeezeX;
    float invSqueezeY1 = 1.0 / u_squeezeY;
    uv1.x *= invSqueezeX1;
    uv1.y *= invSqueezeY1;
    uv1 *= invZoom1;
    uv1.x += u_offsetX;
    uv1.y += u_offsetY;
    float yOffset1 = 0.38;
    vec2 textUV1 = uv1 * 0.5 + 0.5;
    textUV1.y += yOffset1;
    textUV1.y = 1.0 - textUV1.y;
    if (u_textEffect == 0) {
      textUV1.x += mod(u_time * u_speed, 1.0);
      textUV1.x = mod(textUV1.x, 1.0);
    } else if (u_textEffect == 1) {
      float angle = atan(uv1.y, uv1.x);
      float spokes = 8.0;
      float spoke = floor((angle + 3.14159) / (6.28318 / spokes));
      float t = mod(u_time * u_speed + spoke / spokes, 1.0);
      textUV1.x += t;
      textUV1.x = mod(textUV1.x, 1.0);
    } else if (u_textEffect == 2) {
      float r = length(uv1);
      float theta = atan(uv1.y, uv1.x) + u_time * u_speed;
      textUV1.x = 0.5 + r * cos(theta) * 0.5;
      textUV1.y = 0.5 + r * sin(theta) * 0.5;
    } else if (u_textEffect == 3) {
      textUV1.y += sin(textUV1.x * 10.0 + u_time * u_speed) * 0.05;
    } else if (u_textEffect == 4) {
      float pulse = 0.5 + 0.5 * sin(u_time * u_speed * 2.0);
      textUV1.y = (textUV1.y - 0.5) * (0.8 + 0.4 * pulse) + 0.5;
    } else if (u_textEffect == 5) {
      float fade = 0.5 + 0.5 * sin(u_time * u_speed * 2.0);
      textUV1.x = (textUV1.x - 0.5) * (0.8 + 0.4 * fade) + 0.5;
    }
    vec4 texColor1 = texture2D(u_textTexture, textUV1);
    // If out of bounds, force alpha to 0
    if (textUV1.x < 0.0 || textUV1.x > 1.0 || textUV1.y < 0.0 || textUV1.y > 1.0) {
      texColor1 = vec4(0.0);
    } else if (u_useGradient) {
      float gradPos = mod(textUV1.x + u_gradientRoll, 1.0);
      vec3 gradColor = texture2D(u_gradient, vec2(gradPos, 0.5)).rgb;
      texColor1.rgb *= gradColor;
    }

    // --- Second text layer ---
    vec2 uv2 = v_position;
    if (u_flipH2) uv2.x *= -1.0;
    if (u_flipV2) uv2.y *= -1.0;
    float c2 = cos(u_rotate2);
    float s2 = sin(u_rotate2);
    uv2 = mat2(c2, -s2, s2, c2) * uv2;
    float invZoom2 = 1.0 / u_zoom2;
    float invSqueezeX2 = 1.0 / u_squeezeX2;
    float invSqueezeY2 = 1.0 / u_squeezeY2;
    uv2.x *= invSqueezeX2;
    uv2.y *= invSqueezeY2;
    uv2 *= invZoom2;
    uv2.x += u_offsetX2;
    uv2.y += u_offsetY2;
    float yOffset2 = 0.38;
    vec2 textUV2 = uv2 * 0.5 + 0.5;
    textUV2.y += yOffset2;
    textUV2.y = 1.0 - textUV2.y;
    if (u_textEffect2 == 0) {
      textUV2.x += mod(u_time * u_speed, 1.0);
      textUV2.x = mod(textUV2.x, 1.0);
    } else if (u_textEffect2 == 1) {
      float angle2 = atan(uv2.y, uv2.x);
      float spokes2 = 8.0;
      float spoke2 = floor((angle2 + 3.14159) / (6.28318 / spokes2));
      float t2 = mod(u_time * u_speed + spoke2 / spokes2, 1.0);
      textUV2.x += t2;
      textUV2.x = mod(textUV2.x, 1.0);
    } else if (u_textEffect2 == 2) {
      float r2 = length(uv2);
      float theta2 = atan(uv2.y, uv2.x) + u_time * u_speed;
      textUV2.x = 0.5 + r2 * cos(theta2) * 0.5;
      textUV2.y = 0.5 + r2 * sin(theta2) * 0.5;
    } else if (u_textEffect2 == 3) {
      textUV2.y += sin(textUV2.x * 10.0 + u_time * u_speed) * 0.05;
    } else if (u_textEffect2 == 4) {
      float pulse2 = 0.5 + 0.5 * sin(u_time * u_speed * 2.0);
      textUV2.y = (textUV2.y - 0.5) * (0.8 + 0.4 * pulse2) + 0.5;
    } else if (u_textEffect2 == 5) {
      float fade2 = 0.5 + 0.5 * sin(u_time * u_speed * 2.0);
      textUV2.x = (textUV2.x - 0.5) * (0.8 + 0.4 * fade2) + 0.5;
    }
    vec4 texColor2 = texture2D(u_textTexture2, textUV2);
    // If out of bounds, force alpha to 0
    if (textUV2.x < 0.0 || textUV2.x > 1.0 || textUV2.y < 0.0 || textUV2.y > 1.0) {
      texColor2 = vec4(0.0);
    } else if (u_useGradient) {
      float gradPos2 = mod(textUV2.x + u_gradientRoll, 1.0);
      vec3 gradColor2 = texture2D(u_gradient, vec2(gradPos2, 0.5)).rgb;
      texColor2.rgb *= gradColor2;
    }

    // Blend the two text layers (simple alpha blend)
    gl_FragColor = mix(texColor1, texColor2, texColor2.a);
  }
`
