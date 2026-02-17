export const frequencyBars3DShader = `
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
  uniform sampler2D u_frequencyTexture;

  varying vec2 v_position;
  varying vec2 v_uv;

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = v_uv;

    // Number of bars
    float numBars = 32.0;
    float barIndex = floor(uv.x * numBars);
    float barX = (barIndex + 0.5) / numBars;

    // Sample frequency
    float freq = texture2D(u_frequencyTexture, vec2(barX, 0.5)).r;
    freq = pow(freq, 0.8) * (1.0 + u_beatIntensity * 0.5);

    // Bar dimensions
    float barWidth = 0.7 / numBars;
    float barLocalX = fract(uv.x * numBars) - 0.5;

    // Bar shape
    float inBar = step(abs(barLocalX), barWidth * numBars * 0.5);
    float barHeight = freq;

    // Draw bar
    float bar = inBar * step(uv.y, barHeight);

    // Top cap with glow
    float topGlow = smoothstep(0.05, 0.0, abs(uv.y - barHeight)) * inBar;

    // Reflection
    float reflection = inBar * step(uv.y, -barHeight * 0.3) * step(-0.3, uv.y);
    reflection *= (1.0 + uv.y / 0.3) * 0.3;

    // Color gradient based on height
    float hue = barHeight * 0.3 + barX * 0.2;
    vec3 barColor = hsv2rgb(vec3(hue, 0.8, 0.9));
    barColor = mix(u_primaryColor, barColor, 0.6);

    // Apply bar
    vec3 color = vec3(0.0);
    color += barColor * bar * (0.5 + uv.y / barHeight * 0.5);
    color += u_secondaryColor * topGlow * 2.0;
    color += barColor * reflection * 0.5;

    // Beat flash
    color += u_primaryColor * u_beatIntensity * 0.1 * bar;

    // Background gradient
    vec3 bg = mix(vec3(0.02, 0.02, 0.05), vec3(0.0), uv.y + 0.5);
    color = mix(bg, color, step(0.01, bar + topGlow + reflection));

    gl_FragColor = vec4(color, 1.0);
  }
`
