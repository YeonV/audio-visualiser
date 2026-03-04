/**
 * Composer - Post-processing effect chain manager
 *
 * Implements the ping-pong buffer technique for chaining multiple
 * post-processing effects. Each pass reads from one buffer and writes
 * to another, then they swap for the next pass.
 *
 * Inspired by Astrofox's Composer pattern, adapted for raw WebGL.
 */

import { ShaderPass } from './ShaderPass'
import { hasGL, warnNoGL } from '../glUtils'

interface RenderTarget {
  framebuffer: WebGLFramebuffer
  texture: WebGLTexture
}

export class Composer {
  private gl: WebGLRenderingContext
  private width: number
  private height: number

  // Ping-pong buffers
  private readTarget: RenderTarget | null = null
  private writeTarget: RenderTarget | null = null

  // Passes
  private passes: ShaderPass[] = []

  // Copy pass for final render
  private copyPass: ShaderPass | null = null

  constructor(gl: WebGLRenderingContext, width: number, height: number) {
    this.gl = gl
    this.width = width
    this.height = height

    this.createRenderTargets()
    this.createCopyPass()
  }

  /**
   * Create the ping-pong render targets (framebuffers with textures)
   */
  private createRenderTargets(): void {
    this.readTarget = this.createRenderTarget()
    this.writeTarget = this.createRenderTarget()
  }

  /**
   * Create a single render target (framebuffer + texture)
   */
  private createRenderTarget(): RenderTarget | null {
    const gl = this.gl
    if (!hasGL(gl)) {
      warnNoGL('Composer.createRenderTarget')
      return null
    }

    // Create framebuffer
    const framebuffer = gl.createFramebuffer()
    if (!framebuffer) {
      console.error('Composer: Failed to create framebuffer')
      return null
    }

    // Create texture
    const texture = gl.createTexture()
    if (!texture) {
      console.error('Composer: Failed to create texture')
      gl.deleteFramebuffer(framebuffer)
      return null
    }

    // Configure texture
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.width,
      this.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // Attach texture to framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    // Check framebuffer status
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Composer: Framebuffer incomplete:', status)
      gl.deleteFramebuffer(framebuffer)
      gl.deleteTexture(texture)
      return null
    }

    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)

    return { framebuffer, texture }
  }

  /**
   * Create a simple copy pass for final output
   */
  private createCopyPass(): void {
    const copyShader = {
      uniforms: {
        inputTexture: { type: 't', value: null }
      },
      vertexShader: `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = a_position * 0.5 + 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform sampler2D inputTexture;
        varying vec2 v_uv;
        void main() {
          gl_FragColor = texture2D(inputTexture, v_uv);
        }
      `
    }

    this.copyPass = new ShaderPass(copyShader, { renderToScreen: true })
    if (this.gl && typeof this.copyPass.init === 'function') {
      this.copyPass.init(this.gl)
      this.copyPass.setSize(this.width, this.height)
    }
  }

  /**
   * Add a pass to the chain
   */
  addPass(pass: ShaderPass): void {
    pass.init(this.gl)
    pass.setSize(this.width, this.height)
    this.passes.push(pass)
  }

  /**
   * Remove a pass from the chain
   */
  removePass(pass: ShaderPass): void {
    const index = this.passes.indexOf(pass)
    if (index !== -1) {
      this.passes.splice(index, 1)
      pass.dispose()
    }
  }

  /**
   * Clear all passes from the chain (does not dispose them - they can be re-added)
   */
  clearPasses(): void {
    // Just clear the array - don't dispose passes since they may be re-added
    this.passes = []
  }

  /**
   * Clear and dispose all passes (use when cleaning up)
   */
  disposeAllPasses(): void {
    for (const pass of this.passes) {
      pass.dispose()
    }
    this.passes = []
  }

  /**
   * Swap read and write buffers
   */
  private swapBuffers(): void {
    const temp = this.readTarget
    this.readTarget = this.writeTarget
    this.writeTarget = temp
  }

  /**
   * Get the input framebuffer (where the base scene should be rendered)
   */
  getInputFramebuffer(): WebGLFramebuffer | null {
    return this.readTarget?.framebuffer ?? null
  }

  /**
   * Get the input texture (result of base scene render)
   */
  getInputTexture(): WebGLTexture | null {
    return this.readTarget?.texture ?? null
  }

  /**
   * Render all passes in sequence
   *
   * Call this after rendering your base scene to the input framebuffer.
   * The composer will chain all passes and output to screen.
   */
  render(): void {
    if (!this.readTarget || !this.writeTarget) {
        console.warn('Composer: Missing targets')
        return
    }

    // console.log('Composer: render', this.width, this.height, this.passes.length)

    // If no passes, just copy input to screen
    if (this.passes.length === 0) {
      this.renderToScreen()
      return
    }

    // Process each pass
    for (let i = 0; i < this.passes.length; i++) {
      const pass = this.passes[i]
      const isLast = i === this.passes.length - 1

      // Last pass renders to screen if configured, otherwise we copy after
      if (isLast && pass.renderToScreen) {
        pass.render(this.readTarget.texture, null)
      } else {
        // Render to write buffer
        pass.render(this.readTarget.texture, this.writeTarget.framebuffer)

        // Swap buffers if needed
        if (pass.needsSwap) {
          this.swapBuffers()
        }
      }
    }

    // If last pass didn't render to screen, copy now
    const lastPass = this.passes[this.passes.length - 1]
    if (!lastPass.renderToScreen) {
      this.renderToScreen()
    }
  }

  /**
   * Copy current read buffer to screen
   */
  renderToScreen(): void {
    if (!this.readTarget || !this.copyPass) return
    this.copyPass.render(this.readTarget.texture, null)
  }

  /**
   * Update size of all buffers and passes
   */
  setSize(width: number, height: number): void {
    if (width === this.width && height === this.height) return

    this.width = width
    this.height = height

    // Recreate render targets
    this.disposeRenderTargets()
    this.createRenderTargets()

    // Update all passes
    for (const pass of this.passes) {
      pass.setSize(width, height)
    }

    if (this.copyPass) {
      this.copyPass.setSize(width, height)
    }
  }

  /**
   * Clear the input buffer
   */
  clear(color: [number, number, number, number] = [0, 0, 0, 1]): void {
    if (!this.readTarget || !this.gl) return

    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.readTarget.framebuffer)
    gl.clearColor(color[0], color[1], color[2], color[3])
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  /**
   * Dispose of render targets
   */
  private disposeRenderTargets(): void {
    if (!this.gl) {
      this.readTarget = null
      this.writeTarget = null
      return
    }

    if (this.readTarget) {
      this.gl.deleteFramebuffer(this.readTarget.framebuffer)
      this.gl.deleteTexture(this.readTarget.texture)
      this.readTarget = null
    }

    if (this.writeTarget) {
      this.gl.deleteFramebuffer(this.writeTarget.framebuffer)
      this.gl.deleteTexture(this.writeTarget.texture)
      this.writeTarget = null
    }
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.clearPasses()
    this.disposeRenderTargets()

    if (this.copyPass) {
      this.copyPass.dispose()
      this.copyPass = null
    }
  }
}

export default Composer
