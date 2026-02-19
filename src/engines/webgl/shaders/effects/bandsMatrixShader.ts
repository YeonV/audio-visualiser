// Bands Matrix Shader - 2D grid of bands
export const bandsMatrixShader = `
  precision highp float;

  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_beat;
  uniform vec2 u_resolution;
  uniform sampler2D u_melbank;
  uniform float u_bands;

  varying vec2 v_position;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_position * 0.5 + 0.5;

    float bands = u_bands;
    float rows = bands * 0.5;

    vec2 gridPos = vec2(floor(uv.x * bands), floor(uv.y * rows));
    vec2 cellUV = fract(vec2(uv.x * bands, uv.y * rows));

    // Sample melbank for this column
    float melVal = texture2D(u_melbank, vec2((gridPos.x + 0.5) / bands, 0.5)).r;

    // Map row to threshold
    float rowThreshold = (gridPos.y + 1.0) / rows;
    float lit = step(rowThreshold, melVal);

    // Cell shape
    float cell = smoothstep(0.0, 0.1, cellUV.x) * smoothstep(1.0, 0.9, cellUV.x);
    cell *= smoothstep(0.0, 0.1, cellUV.y) * smoothstep(1.0, 0.9, cellUV.y);

    // Color by column
    float hue = gridPos.x / bands * 0.7;
    vec3 cellColor = hsv2rgb(vec3(hue, 0.8, 0.9));

    // Brightness by row
    cellColor *= 0.5 + (gridPos.y / rows) * 0.5;

    vec3 color = cellColor * lit * cell;

    // Beat pulse
    color *= 1.0 + u_beat * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`
