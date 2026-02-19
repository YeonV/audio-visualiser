
export const bladeTexterPlusShader = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_energy;
  uniform float u_beat;
  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;

  // Text 1
  uniform sampler2D u_textTexture;
  uniform float u_textAspect;
  uniform int u_textEffect;
  uniform float u_speed;
  uniform sampler2D u_gradient;
  uniform bool u_useGradient;
  uniform float u_gradientRoll;

  // Text 2
  uniform sampler2D u_textTexture2;
  uniform float u_textAspect2;
  uniform int u_textEffect2;
  uniform float u_speed2;
  uniform sampler2D u_gradient2;
  uniform bool u_useGradient2;
  uniform float u_gradientRoll2;

  // 3D & Advanced
  uniform float u_rotationX;
  uniform float u_rotationY;
  uniform float u_rotationZ;
  uniform float u_perspective;
  uniform float u_zoom;
  uniform float u_glowIntensity;
  uniform float u_glitchAmount;
  uniform float u_chromaticAberration;
  uniform float u_pixelate;
  uniform int u_backgroundMode;
  uniform float u_bgOpacity;
  uniform float u_audioPulse;

  varying vec2 v_position;

  // --- Helpers ---

  mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1, 0, 0, 0, c, -s, 0, s, c);
  }

  mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
  }

  mat3 rotateZ(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, -s, 0, s, c, 0, 0, 0, 1);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec3 getBackground(vec2 uv) {
    if (u_backgroundMode == 1) { // Plasma
      float v = sin(uv.x * 10.0 + u_time) + sin((uv.y + u_time) * 10.0) + sin((uv.x + uv.y + u_time) * 10.0);
      return mix(u_primaryColor, u_secondaryColor, sin(v) * 0.5 + 0.5);
    } else if (u_backgroundMode == 2) { // Grid
      vec2 g = abs(fract(uv * 10.0 - 0.5) - 0.5);
      float line = min(g.x, g.y);
      return vec3(1.0 - smoothstep(0.0, 0.05, line)) * u_primaryColor;
    } else if (u_backgroundMode == 3) { // Audio Wave
      float dist = abs(uv.y - sin(uv.x * 5.0 + u_time) * u_energy * 0.5);
      return u_secondaryColor * (0.01 / dist);
    } else if (u_backgroundMode == 4) { // Starfield
      vec2 st = uv * 20.0;
      vec2 ipos = floor(st);
      float h = hash(ipos);
      float star = smoothstep(0.45, 0.5, h) * (0.1 / length(fract(st) - 0.5));
      return vec3(star) * u_primaryColor;
    }
    return vec3(0.0);
  }

  vec4 sampleText(sampler2D tex, vec2 uv, int effect, float speed, sampler2D grad, bool useGrad, float gradRoll) {
    vec2 textUV = uv * 0.5 + 0.5;
    textUV.y = 1.0 - (textUV.y + 0.38); // Baseline correction

    if (effect == 0) { // Side Scroll
      textUV.x = mod(textUV.x + u_time * speed, 1.0);
    } else if (effect == 1) { // Spokes
      float angle = atan(uv.y, uv.x);
      textUV.x = mod(textUV.x + u_time * speed + angle / 6.28, 1.0);
    } else if (effect == 5) { // Fade
      float f = sin(u_time * speed * 5.0) * 0.5 + 0.5;
      if (f < 0.1) return vec4(0.0);
    }

    if (textUV.x < 0.0 || textUV.x > 1.0 || textUV.y < 0.0 || textUV.y > 1.0) return vec4(0.0);

    vec4 col = texture2D(tex, textUV);
    if (useGrad && col.a > 0.1) {
      vec3 g = texture2D(grad, vec2(mod(textUV.x + gradRoll, 1.0), 0.5)).rgb;
      col.rgb *= g;
    }
    return col;
  }

  void main() {
    vec2 uv = v_position;

    // Pixelate
    if (u_pixelate > 0.0) {
      float res = 101.0 - u_pixelate;
      uv = floor(uv * res) / res;
    }

    // Audio Pulse Scale
    float pScale = 1.0 + u_energy * u_audioPulse;
    uv /= pScale;

    // Background
    vec3 bg = getBackground(uv) * u_bgOpacity;

    // 3D Projection
    vec3 rd = normalize(vec3(uv, u_perspective));
    mat3 rot = rotateX(u_rotationX) * rotateY(u_rotationY) * rotateZ(u_rotationZ);

    // Chromatic Aberration & Sample Text
    vec4 finalTex = vec4(0.0);
    float offset = u_chromaticAberration;

    // Unrolled Layer Pass 1
    {
        vec3 p = rd * rot * (1.0 / u_zoom);
        vec2 planeUV = p.xy / p.z;
        if (p.z > 0.0) {
            vec4 r = sampleText(u_textTexture, planeUV + vec2(offset, 0), u_textEffect, u_speed, u_gradient, u_useGradient, u_gradientRoll);
            vec4 g = sampleText(u_textTexture, planeUV, u_textEffect, u_speed, u_gradient, u_useGradient, u_gradientRoll);
            vec4 b = sampleText(u_textTexture, planeUV - vec2(offset, 0), u_textEffect, u_speed, u_gradient, u_useGradient, u_gradientRoll);
            vec4 layerCol = vec4(r.r, g.g, b.b, max(max(r.a, g.a), b.a));
            layerCol.rgb += layerCol.rgb * layerCol.a * u_glowIntensity * (1.0 + u_energy);
            if (u_glitchAmount > 0.0) {
               float n = hash(vec2(floor(u_time * 15.0), floor(uv.y * 10.0)));
               if (n < u_glitchAmount * 0.2) { layerCol.rgb = layerCol.gbr; }
            }
            finalTex = mix(finalTex, layerCol, layerCol.a);
        }
    }

    // Unrolled Layer Pass 2
    {
        vec3 p = rd * rot * (1.0 / (u_zoom * 0.8));
        vec2 planeUV = p.xy / p.z;
        if (p.z > 0.0) {
            vec4 r = sampleText(u_textTexture2, planeUV + vec2(offset, 0), u_textEffect2, u_speed2, u_gradient2, u_useGradient2, u_gradientRoll2);
            vec4 g = sampleText(u_textTexture2, planeUV, u_textEffect2, u_speed2, u_gradient2, u_useGradient2, u_gradientRoll2);
            vec4 b = sampleText(u_textTexture2, planeUV - vec2(offset, 0), u_textEffect2, u_speed2, u_gradient2, u_useGradient2, u_gradientRoll2);
            vec4 layerCol = vec4(r.r, g.g, b.b, max(max(r.a, g.a), b.a));
            layerCol.rgb += layerCol.rgb * layerCol.a * u_glowIntensity * (1.0 + u_energy);
            if (u_glitchAmount > 0.0) {
               float n = hash(vec2(floor(u_time * 15.0 + 1.0), floor(uv.y * 10.0)));
               if (n < u_glitchAmount * 0.2) { layerCol.rgb = layerCol.gbr; }
            }
            finalTex = mix(finalTex, layerCol, layerCol.a);
        }
    }

    vec3 finalRGB = mix(bg, finalTex.rgb, finalTex.a);
    gl_FragColor = vec4(finalRGB, 1.0);
  }
`
