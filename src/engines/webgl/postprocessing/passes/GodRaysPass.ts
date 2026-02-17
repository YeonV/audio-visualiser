/**
 * GodRaysPass - Creates volumetric light rays (god rays/crepuscular rays)
 *
 * Uses radial blur from bright sources to simulate light scattering.
 * Features:
 * - Configurable light source position
 * - Adjustable ray intensity and decay
 * - Exposure and weight controls
 * - Audio-reactive light position
 */

import { ShaderPass, fullscreenVertexShader } from '../ShaderPass'

// First pass: Extract bright areas (similar to bloom)
const extractBrightFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform float threshold;

  varying vec2 v_uv;

  void main() {
    vec4 color = texture2D(inputTexture, v_uv);
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float brightness = max(0.0, luminance - threshold);
    gl_FragColor = vec4(color.rgb * brightness, 1.0);
  }
`

// Radial blur shader for god rays
const godRaysFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform vec2 lightPosition;
  uniform float exposure;
  uniform float decay;
  uniform float density;
  uniform float weight;
  uniform int numSamples;

  varying vec2 v_uv;

  void main() {
    vec2 texCoord = v_uv;
    vec2 deltaTexCoord = texCoord - lightPosition;
    deltaTexCoord *= 1.0 / float(numSamples) * density;

    vec3 color = texture2D(inputTexture, texCoord).rgb;
    float illuminationDecay = 1.0;

    // Radial blur towards light source
    for (int i = 0; i < 100; i++) {
      if (i >= numSamples) break;

      texCoord -= deltaTexCoord;
      vec3 sampleColor = texture2D(inputTexture, texCoord).rgb;
      sampleColor *= illuminationDecay * weight;
      color += sampleColor;
      illuminationDecay *= decay;
    }

    gl_FragColor = vec4(color * exposure, 1.0);
  }
`

// Blend god rays with original image
const blendGodRaysFragmentShader = `
  precision highp float;

  uniform sampler2D inputTexture;
  uniform sampler2D godRaysTexture;
  uniform float intensity;
  uniform vec3 rayColor;

  varying vec2 v_uv;

  void main() {
    vec4 original = texture2D(inputTexture, v_uv);
    vec4 godRays = texture2D(godRaysTexture, v_uv);

    // Tint the rays and add to original
    vec3 tintedRays = godRays.rgb * rayColor * intensity;
    vec3 result = original.rgb + tintedRays;

    gl_FragColor = vec4(result, original.a);
  }
`

export interface GodRaysConfig {
  lightX?: number // 0-1, X position of light source
  lightY?: number // 0-1, Y position of light source
  exposure?: number // 0-1, overall brightness
  decay?: number // 0-1, how quickly rays fade
  density?: number // 0-1, ray density
  weight?: number // 0-1, sample weight
  intensity?: number // 0-1, final blend intensity
  threshold?: number // 0-1, brightness threshold for sources
  rayColor?: [number, number, number] // RGB color tint for rays
  numSamples?: number // Number of blur samples (16-100)
}

export class GodRaysPass extends ShaderPass {
  // Internal passes
  private extractPass: ShaderPass
  private radialBlurPass: ShaderPass
  private blendPass: ShaderPass

  // Internal buffers
  private extractBuffer: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null
  private blurBuffer: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null

  // Config
  private _lightX: number
  private _lightY: number
  private _exposure: number
  private _decay: number
  private _density: number
  private _weight: number
  private _intensity: number
  private _threshold: number
  private _rayColor: [number, number, number]
  private _numSamples: number

  constructor(config: GodRaysConfig = {}) {
    super(
      {
        uniforms: {},
        vertexShader: fullscreenVertexShader,
        fragmentShader: 'precision mediump float; void main() { gl_FragColor = vec4(1.0); }'
      },
      { needsSwap: true }
    )

    this._lightX = config.lightX ?? 0.5
    this._lightY = config.lightY ?? 0.5
    this._exposure = config.exposure ?? 0.0034
    this._decay = config.decay ?? 0.97
    this._density = config.density ?? 0.84
    this._weight = config.weight ?? 5.65
    this._intensity = config.intensity ?? 0.5
    this._threshold = config.threshold ?? 0.5
    this._rayColor = config.rayColor ?? [1, 1, 1]
    this._numSamples = config.numSamples ?? 50

    // Create internal passes
    this.extractPass = new ShaderPass({
      uniforms: {
        inputTexture: { type: 't', value: null },
        threshold: { type: 'f', value: this._threshold }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: extractBrightFragmentShader
    })

    this.radialBlurPass = new ShaderPass({
      uniforms: {
        inputTexture: { type: 't', value: null },
        lightPosition: { type: 'v2', value: [this._lightX, this._lightY] },
        exposure: { type: 'f', value: this._exposure },
        decay: { type: 'f', value: this._decay },
        density: { type: 'f', value: this._density },
        weight: { type: 'f', value: this._weight },
        numSamples: { type: 'i', value: this._numSamples }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: godRaysFragmentShader
    })

    this.blendPass = new ShaderPass({
      uniforms: {
        inputTexture: { type: 't', value: null },
        godRaysTexture: { type: 't', value: null },
        intensity: { type: 'f', value: this._intensity },
        rayColor: { type: 'v3', value: this._rayColor }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: blendGodRaysFragmentShader
    })
  }

  init(gl: WebGLRenderingContext): boolean {
    if (this.isInitialized && this.gl === gl) return true

    this.gl = gl

    if (!this.extractPass.init(gl)) return false
    if (!this.radialBlurPass.init(gl)) return false
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
    this.disposeBuffers()

    // Create buffers at half resolution for performance
    const bufferWidth = Math.floor(width / 2)
    const bufferHeight = Math.floor(height / 2)

    this.extractBuffer = this.createBuffer(bufferWidth, bufferHeight)
    this.blurBuffer = this.createBuffer(bufferWidth, bufferHeight)

    this.extractPass.setSize(bufferWidth, bufferHeight)
    this.radialBlurPass.setSize(bufferWidth, bufferHeight)
    this.blendPass.setSize(width, height)
  }

  private disposeBuffers(): void {
    if (!this.gl) return

    const buffers = [this.extractBuffer, this.blurBuffer]
    for (const buf of buffers) {
      if (buf) {
        this.gl.deleteFramebuffer(buf.framebuffer)
        this.gl.deleteTexture(buf.texture)
      }
    }

    this.extractBuffer = null
    this.blurBuffer = null
  }

  render(inputTexture: WebGLTexture | null, outputFramebuffer: WebGLFramebuffer | null): void {
    if (!this.gl || !inputTexture || !this.extractBuffer || !this.blurBuffer) return
    const gl = this.gl

    // Step 1: Extract bright areas
    this.extractPass.render(inputTexture, this.extractBuffer.framebuffer)

    // Step 2: Apply radial blur
    this.radialBlurPass.render(this.extractBuffer.texture, this.blurBuffer.framebuffer)

    // Step 3: Blend with original
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.blurBuffer.texture)

    this.blendPass.setUniforms({
      inputTexture: 0,
      godRaysTexture: 1,
      intensity: this._intensity,
      rayColor: this._rayColor
    })

    // Render to output
    this.blendPass.render(inputTexture, outputFramebuffer)
  }

  get lightX(): number {
    return this._lightX
  }

  set lightX(value: number) {
    this._lightX = Math.max(0, Math.min(1, value))
    this.radialBlurPass.setUniforms({ lightPosition: [this._lightX, this._lightY] })
  }

  get lightY(): number {
    return this._lightY
  }

  set lightY(value: number) {
    this._lightY = Math.max(0, Math.min(1, value))
    this.radialBlurPass.setUniforms({ lightPosition: [this._lightX, this._lightY] })
  }

  get exposure(): number {
    return this._exposure
  }

  set exposure(value: number) {
    this._exposure = Math.max(0, Math.min(0.1, value))
    this.radialBlurPass.setUniforms({ exposure: this._exposure })
  }

  get decay(): number {
    return this._decay
  }

  set decay(value: number) {
    this._decay = Math.max(0.9, Math.min(1, value))
    this.radialBlurPass.setUniforms({ decay: this._decay })
  }

  get density(): number {
    return this._density
  }

  set density(value: number) {
    this._density = Math.max(0.1, Math.min(2, value))
    this.radialBlurPass.setUniforms({ density: this._density })
  }

  get weight(): number {
    return this._weight
  }

  set weight(value: number) {
    this._weight = Math.max(0.1, Math.min(10, value))
    this.radialBlurPass.setUniforms({ weight: this._weight })
  }

  get intensity(): number {
    return this._intensity
  }

  set intensity(value: number) {
    this._intensity = Math.max(0, Math.min(2, value))
  }

  get threshold(): number {
    return this._threshold
  }

  set threshold(value: number) {
    this._threshold = Math.max(0, Math.min(1, value))
    this.extractPass.setUniforms({ threshold: this._threshold })
  }

  get rayColor(): [number, number, number] {
    return this._rayColor
  }

  set rayColor(value: [number, number, number]) {
    this._rayColor = value
  }

  get numSamples(): number {
    return this._numSamples
  }

  set numSamples(value: number) {
    this._numSamples = Math.max(16, Math.min(100, Math.floor(value)))
    this.radialBlurPass.setUniforms({ numSamples: this._numSamples })
  }

  updateConfig(config: GodRaysConfig): void {
    if (config.lightX !== undefined) this.lightX = config.lightX
    if (config.lightY !== undefined) this.lightY = config.lightY
    if (config.exposure !== undefined) this.exposure = config.exposure
    if (config.decay !== undefined) this.decay = config.decay
    if (config.density !== undefined) this.density = config.density
    if (config.weight !== undefined) this.weight = config.weight
    if (config.intensity !== undefined) this.intensity = config.intensity
    if (config.threshold !== undefined) this.threshold = config.threshold
    if (config.rayColor !== undefined) this.rayColor = config.rayColor
    if (config.numSamples !== undefined) this.numSamples = config.numSamples
  }

  dispose(): void {
    this.disposeBuffers()
    this.extractPass.dispose()
    this.radialBlurPass.dispose()
    this.blendPass.dispose()
    super.dispose()
  }
}

export default GodRaysPass
