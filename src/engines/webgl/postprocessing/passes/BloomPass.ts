/**
 * BloomPass - Creates a glow/bloom effect
 *
 * Multi-pass effect that:
 * 1. Extracts bright areas above threshold
 * 2. Applies Gaussian blur
 * 3. Blends with original image
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

// Luminance threshold shader - extracts bright areas
const luminanceFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform float threshold;
  uniform float smoothWidth;

  varying vec2 v_uv;

  void main() {
    vec4 color = texture2D(inputTexture, v_uv);

    // Calculate luminance
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // Smooth threshold
    float brightness = smoothstep(threshold - smoothWidth, threshold + smoothWidth, luma);

    gl_FragColor = vec4(color.rgb * brightness, color.a);
  }
`

// Gaussian blur shader (separable - run twice for H and V)
// WebGL 1.0 compatible - no array initializers
const gaussianBlurFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 resolution;
  uniform vec2 direction;

  varying vec2 v_uv;

  // 9-tap Gaussian kernel weights (WebGL 1.0 compatible - inline values)
  float getWeight(int i) {
    if (i == 0) return 0.227027;
    if (i == 1) return 0.1945946;
    if (i == 2) return 0.1216216;
    if (i == 3) return 0.054054;
    return 0.016216;
  }

  void main() {
    vec2 texelSize = 1.0 / resolution;
    vec3 result = texture2D(inputTexture, v_uv).rgb * getWeight(0);

    for (int i = 1; i < 5; i++) {
      vec2 offset = direction * texelSize * float(i);
      float w = getWeight(i);
      result += texture2D(inputTexture, v_uv + offset).rgb * w;
      result += texture2D(inputTexture, v_uv - offset).rgb * w;
    }

    gl_FragColor = vec4(result, 1.0);
  }
`

// Blend shader - combines bloom with original
const blendFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform sampler2D bloomTexture;
  uniform float intensity;
  uniform int blendMode; // 0 = add, 1 = screen

  varying vec2 v_uv;

  void main() {
    vec4 original = texture2D(inputTexture, v_uv);
    vec4 bloom = texture2D(bloomTexture, v_uv);

    vec3 result;
    if (blendMode == 0) {
      // Additive blend
      result = original.rgb + bloom.rgb * intensity;
    } else {
      // Screen blend
      result = 1.0 - (1.0 - original.rgb) * (1.0 - bloom.rgb * intensity);
    }

    gl_FragColor = vec4(result, original.a);
  }
`

export interface BloomConfig {
  threshold?: number
  intensity?: number
  radius?: number
  blendMode?: 'add' | 'screen'
}

export class BloomPass extends ShaderPass {
  // Internal passes
  private luminancePass: ShaderPass
  private blurHPass: ShaderPass
  private blurVPass: ShaderPass
  private blendPass: ShaderPass

  // Internal buffers
  private brightBuffer: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null
  private blurBuffer1: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null
  private blurBuffer2: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null

  // Store original texture for final blend
  private originalTexture: WebGLTexture | null = null

  // Config
  private _threshold: number
  private _intensity: number
  private _radius: number
  private _blendMode: 'add' | 'screen'

  constructor(config: BloomConfig = {}) {
    // Create a dummy shader for the parent - we override render()
    super(
      {
        uniforms: {},
        vertexShader: fullscreenVertexShader,
        fragmentShader: 'precision mediump float; void main() { gl_FragColor = vec4(1.0); }'
      },
      { needsSwap: true }
    )

    this._threshold = config.threshold ?? 0.5
    this._intensity = config.intensity ?? 0.5
    this._radius = config.radius ?? 4
    this._blendMode = config.blendMode ?? 'add'

    // Create internal passes
    this.luminancePass = new ShaderPass({
      uniforms: {
        inputTexture: { type: 't', value: null },
        threshold: { type: 'f', value: this._threshold },
        smoothWidth: { type: 'f', value: 0.1 }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: luminanceFragmentShader
    })

    this.blurHPass = new ShaderPass({
      uniforms: {
        inputTexture: { type: 't', value: null },
        resolution: { type: 'v2', value: [1, 1] },
        direction: { type: 'v2', value: [1, 0] }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: gaussianBlurFragmentShader
    })

    this.blurVPass = new ShaderPass({
      uniforms: {
        inputTexture: { type: 't', value: null },
        resolution: { type: 'v2', value: [1, 1] },
        direction: { type: 'v2', value: [0, 1] }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: gaussianBlurFragmentShader
    })

    this.blendPass = new ShaderPass({
      uniforms: {
        inputTexture: { type: 't', value: null },
        bloomTexture: { type: 't', value: null },
        intensity: { type: 'f', value: this._intensity },
        blendMode: { type: 'i', value: 0 }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: blendFragmentShader
    })
  }

  init(gl: WebGLRenderingContext): boolean {
    // Prevent re-initialization
    if (this.isInitialized && this.gl === gl) return true

    this.gl = gl

    // Initialize all internal passes
    if (!this.luminancePass.init(gl)) return false
    if (!this.blurHPass.init(gl)) return false
    if (!this.blurVPass.init(gl)) return false
    if (!this.blendPass.init(gl)) return false

    this.isInitialized = true
    return true
  }

  private createBuffer(
    width: number,
    height: number
  ): { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null {
    if (!this.gl) return null
    const gl = this.gl

    const framebuffer = gl.createFramebuffer()
    const texture = gl.createTexture()

    if (!framebuffer || !texture) return null

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)

    return { framebuffer, texture }
  }

  setSize(width: number, height: number): void {
    super.setSize(width, height)

    // Dispose old buffers
    this.disposeBuffers()

    // Create new buffers at half resolution for performance
    const blurWidth = Math.floor(width / 2)
    const blurHeight = Math.floor(height / 2)

    this.brightBuffer = this.createBuffer(blurWidth, blurHeight)
    this.blurBuffer1 = this.createBuffer(blurWidth, blurHeight)
    this.blurBuffer2 = this.createBuffer(blurWidth, blurHeight)

    // Update pass sizes
    this.luminancePass.setSize(blurWidth, blurHeight)
    this.blurHPass.setSize(blurWidth, blurHeight)
    this.blurVPass.setSize(blurWidth, blurHeight)
    this.blendPass.setSize(width, height)

    // Update blur direction with radius
    this.blurHPass.setUniforms({ direction: [this._radius, 0] })
    this.blurVPass.setUniforms({ direction: [0, this._radius] })
  }

  private disposeBuffers(): void {
    if (!this.gl) return

    const buffers = [this.brightBuffer, this.blurBuffer1, this.blurBuffer2]
    for (const buf of buffers) {
      if (buf) {
        this.gl.deleteFramebuffer(buf.framebuffer)
        this.gl.deleteTexture(buf.texture)
      }
    }

    this.brightBuffer = null
    this.blurBuffer1 = null
    this.blurBuffer2 = null
  }

  render(inputTexture: WebGLTexture | null, outputFramebuffer: WebGLFramebuffer | null): void {
    if (!this.gl || !inputTexture || !this.brightBuffer || !this.blurBuffer1 || !this.blurBuffer2)
      return

    // Store original for final blend
    this.originalTexture = inputTexture

    // Step 1: Extract bright areas
    this.luminancePass.render(inputTexture, this.brightBuffer.framebuffer)

    // Step 2: Horizontal blur
    this.blurHPass.render(this.brightBuffer.texture, this.blurBuffer1.framebuffer)

    // Step 3: Vertical blur
    this.blurVPass.render(this.blurBuffer1.texture, this.blurBuffer2.framebuffer)

    // Step 4: Blend bloom with original
    const gl = this.gl

    // Bind bloom texture to unit 1 (inputTexture will be bound to unit 0 by ShaderPass.render)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.blurBuffer2.texture)

    this.blendPass.setUniforms({
      inputTexture: 0,
      bloomTexture: 1,
      intensity: this._intensity,
      blendMode: this._blendMode === 'add' ? 0 : 1
    })

    // Render to output
    this.blendPass.render(inputTexture, outputFramebuffer)
  }

  get threshold(): number {
    return this._threshold
  }

  set threshold(value: number) {
    this._threshold = Math.max(0, Math.min(1, value))
    this.luminancePass.setUniforms({ threshold: this._threshold })
  }

  get intensity(): number {
    return this._intensity
  }

  set intensity(value: number) {
    this._intensity = Math.max(0, Math.min(2, value))
  }

  get radius(): number {
    return this._radius
  }

  set radius(value: number) {
    this._radius = Math.max(1, Math.min(10, value))
    this.blurHPass.setUniforms({ direction: [this._radius, 0] })
    this.blurVPass.setUniforms({ direction: [0, this._radius] })
  }

  get blendMode(): 'add' | 'screen' {
    return this._blendMode
  }

  set blendMode(value: 'add' | 'screen') {
    this._blendMode = value
  }

  updateConfig(config: BloomConfig): void {
    if (config.threshold !== undefined) this.threshold = config.threshold
    if (config.intensity !== undefined) this.intensity = config.intensity
    if (config.radius !== undefined) this.radius = config.radius
    if (config.blendMode !== undefined) this.blendMode = config.blendMode
  }

  dispose(): void {
    this.disposeBuffers()
    this.luminancePass.dispose()
    this.blurHPass.dispose()
    this.blurVPass.dispose()
    this.blendPass.dispose()
    super.dispose()
  }
}

export default BloomPass
