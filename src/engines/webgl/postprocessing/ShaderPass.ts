/**
 * ShaderPass - Base class for WebGL post-processing effects
 *
 * Inspired by Astrofox's ShaderPass pattern, adapted for raw WebGL.
 * Each ShaderPass represents a single fullscreen shader effect that
 * can be chained together using the Composer.
 */

export interface ShaderDefinition {
  uniforms: Record<string, { type: string; value: unknown }>
  vertexShader: string
  fragmentShader: string
}

export interface ShaderPassOptions {
  needsSwap?: boolean
  clearColor?: boolean
  clearDepth?: boolean
  renderToScreen?: boolean
}

// Standard fullscreen quad vertex shader
export const fullscreenVertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

// Standard fullscreen quad vertices
const FULLSCREEN_VERTICES = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

export class ShaderPass {
  protected gl: WebGLRenderingContext | null = null
  protected program: WebGLProgram | null = null
  protected vertexBuffer: WebGLBuffer | null = null

  // Shader sources
  protected vertexShader: string
  protected fragmentShader: string

  // Uniform definitions
  protected uniformDefs: Record<string, { type: string; value: unknown }>
  protected uniformLocations: Map<string, WebGLUniformLocation | null> = new Map()

  // Pass configuration
  public needsSwap: boolean
  public clearColor: boolean
  public clearDepth: boolean
  public renderToScreen: boolean

  // Cached state
  protected isInitialized = false
  protected width = 0
  protected height = 0

  constructor(shader: ShaderDefinition, options: ShaderPassOptions = {}) {
    this.vertexShader = shader.vertexShader || fullscreenVertexShader
    this.fragmentShader = shader.fragmentShader
    this.uniformDefs = { ...shader.uniforms }

    this.needsSwap = options.needsSwap ?? true
    this.clearColor = options.clearColor ?? false
    this.clearDepth = options.clearDepth ?? false
    this.renderToScreen = options.renderToScreen ?? false
  }

  /**
   * Initialize WebGL resources
   */
  init(gl: WebGLRenderingContext): boolean {
    // Prevent re-initialization
    if (this.isInitialized && this.gl === gl) return true

    this.gl = gl

    // Create shader program
    const vertShader = this.compileShader(gl.VERTEX_SHADER, this.vertexShader)
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShader)

    if (!vertShader || !fragShader) {
      console.error('ShaderPass: Failed to compile shaders')
      return false
    }

    const program = gl.createProgram()
    if (!program) {
      console.error('ShaderPass: Failed to create program')
      return false
    }

    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('ShaderPass: Failed to link program', gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      return false
    }

    this.program = program

    // Create fullscreen quad buffer
    const buffer = gl.createBuffer()
    if (!buffer) {
      console.error('ShaderPass: Failed to create buffer')
      return false
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_VERTICES, gl.STATIC_DRAW)
    this.vertexBuffer = buffer

    // Get uniform locations
    this.cacheUniformLocations()

    // Clean up shaders (they're now part of the program)
    gl.deleteShader(vertShader)
    gl.deleteShader(fragShader)

    this.isInitialized = true
    return true
  }

  /**
   * Compile a shader
   */
  protected compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null

    const shader = this.gl.createShader(type)
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(
        `ShaderPass: Shader compile error (${type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment'}):`,
        this.gl.getShaderInfoLog(shader)
      )
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * Cache uniform locations for performance
   */
  protected cacheUniformLocations(): void {
    if (!this.gl || !this.program) return

    // Always cache inputTexture and resolution
    this.uniformLocations.set(
      'inputTexture',
      this.gl.getUniformLocation(this.program, 'inputTexture')
    )
    this.uniformLocations.set('resolution', this.gl.getUniformLocation(this.program, 'resolution'))

    // Cache all defined uniforms
    for (const name of Object.keys(this.uniformDefs)) {
      if (!this.uniformLocations.has(name)) {
        this.uniformLocations.set(name, this.gl.getUniformLocation(this.program, name))
      }
    }
  }

  /**
   * Set uniform values
   */
  setUniforms(uniforms: Record<string, unknown>): void {
    if (!this.gl || !this.program) return

    this.gl.useProgram(this.program)

    for (const [name, value] of Object.entries(uniforms)) {
      const location = this.uniformLocations.get(name)
      if (location === null || location === undefined) {
        // Try to get the location if not cached
        const loc = this.gl.getUniformLocation(this.program, name)
        if (loc) {
          this.uniformLocations.set(name, loc)
          this.setUniformValue(name, loc, value)
        }
        continue
      }
      this.setUniformValue(name, location, value)
    }
  }

  /**
   * Set a single uniform value based on its type
   */
  protected setUniformValue(name: string, location: WebGLUniformLocation, value: unknown): void {
    if (!this.gl) return

    const def = this.uniformDefs[name]
    const type = def ? def.type : ''

    if (type === 'i' || type === 't') {
      this.gl.uniform1i(location, value as number)
    } else if (typeof value === 'number') {
      this.gl.uniform1f(location, value)
    } else if (typeof value === 'boolean') {
      this.gl.uniform1i(location, value ? 1 : 0)
    } else if (Array.isArray(value)) {
      if (value.length === 2) {
        this.gl.uniform2f(location, value[0], value[1])
      } else if (value.length === 3) {
        this.gl.uniform3f(location, value[0], value[1], value[2])
      } else if (value.length === 4) {
        this.gl.uniform4f(location, value[0], value[1], value[2], value[3])
      }
    }
  }

  /**
   * Update resolution
   */
  setSize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.setUniforms({ resolution: [width, height] })
  }

  /**
   * Render the pass
   * @param inputTexture - The input texture from previous pass
   * @param outputFramebuffer - The framebuffer to render to (null for screen)
   */
  render(inputTexture: WebGLTexture | null, outputFramebuffer: WebGLFramebuffer | null): void {
    if (!this.gl || !this.program || !this.isInitialized) return

    const gl = this.gl

    // Save current blend state and disable blending for post-processing
    const blendEnabled = gl.isEnabled(gl.BLEND)
    gl.disable(gl.BLEND)

    // Bind output framebuffer
    const targetFB = this.renderToScreen ? null : outputFramebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFB)

    // Set viewport to match framebuffer/screen size
    gl.viewport(0, 0, this.width, this.height)

    // Clear if needed
    if (this.clearColor || this.clearDepth) {
      let clearBits = 0
      if (this.clearColor) clearBits |= gl.COLOR_BUFFER_BIT
      if (this.clearDepth) clearBits |= gl.DEPTH_BUFFER_BIT
      gl.clear(clearBits)
    }

    // Use program
    gl.useProgram(this.program)

    // Bind input texture
    if (inputTexture) {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, inputTexture)

      const inputLoc = this.uniformLocations.get('inputTexture')
      if (inputLoc) {
        gl.uniform1i(inputLoc, 0)
      }
    }

    // Set resolution
    const resLoc = this.uniformLocations.get('resolution')
    if (resLoc) {
      gl.uniform2f(resLoc, this.width, this.height)
    }

    // Bind vertex buffer and set attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    const positionLoc = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Unbind texture to prevent feedback loops on next frame
    gl.bindTexture(gl.TEXTURE_2D, null)

    // Restore blend state
    if (blendEnabled) {
      gl.enable(gl.BLEND)
    }
  }

  /**
   * Clean up WebGL resources
   */
  dispose(): void {
    if (!this.gl) return

    if (this.program) {
      this.gl.deleteProgram(this.program)
      this.program = null
    }

    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer)
      this.vertexBuffer = null
    }

    this.uniformLocations.clear()
    this.isInitialized = false
    this.gl = null
  }
}

export default ShaderPass
