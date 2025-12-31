/**
 * FluidVisualiser - GPU-based fluid simulation with audio reactivity
 *
 * Implements a simplified Navier-Stokes fluid simulation with:
 * - Advection (fluid movement)
 * - Pressure projection (incompressibility)
 * - Particle system following velocity field
 * - Audio-reactive force injection
 */

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { Box, Slider, Typography, Switch, FormControlLabel, TextField } from '@mui/material'

// Types
export interface FluidConfig {
  particleCount: number
  dyeResolution: number
  simResolution: number
  densityDissipation: number
  velocityDissipation: number
  pressureIterations: number
  curl: number
  splatRadius: number
  splatForce: number
  colorUpdateSpeed: number
  bloom: boolean
  bloomIntensity: number
  audioSensitivity: number
  bassMultiplier: number
  midMultiplier: number
  highMultiplier: number
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  autoInject: boolean
  autoInjectSpeed: number
}

export interface FluidVisualiserProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  config: FluidConfig
  onConfigChange?: (config: Partial<FluidConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}

export interface FluidVisualiserRef {
  reset: () => void
  addSplat: (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => void
}

export const DEFAULT_FLUID_CONFIG: FluidConfig = {
  particleCount: 65536,
  dyeResolution: 1024,
  simResolution: 256,
  densityDissipation: 0.97,
  velocityDissipation: 0.98,
  pressureIterations: 20,
  curl: 30,
  splatRadius: 0.25,
  splatForce: 6000,
  colorUpdateSpeed: 10,
  bloom: true,
  bloomIntensity: 0.8,
  audioSensitivity: 1.0,
  bassMultiplier: 2.0,
  midMultiplier: 1.5,
  highMultiplier: 1.0,
  primaryColor: '#ff00ff',
  secondaryColor: '#00ffff',
  tertiaryColor: '#0066ff',
  autoInject: true,
  autoInjectSpeed: 0.5,
}

// Shader Sources
const baseVertexShader = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const copyShader = `
  precision mediump float;
  uniform sampler2D uTexture;
  varying vec2 vUv;
  void main () { gl_FragColor = texture2D(uTexture, vUv); }
`

const clearShader = `
  precision mediump float;
  uniform sampler2D uTexture;
  uniform float value;
  varying vec2 vUv;
  void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
`

const splatShader = `
  precision highp float;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  varying vec2 vUv;

  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`

const advectionShader = `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  varying vec2 vUv;

  void main () {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = dissipation * texture2D(uSource, coord);
    gl_FragColor = result;
  }
`

const divergenceShader = `
  precision mediump float;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`

const curlShader = `
  precision mediump float;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`

const vorticityShader = `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`

const pressureShader = `
  precision mediump float;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`

const gradientSubtractShader = `
  precision mediump float;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`

const particleVertexShader = `
  precision highp float;
  attribute vec2 aPosition;
  uniform sampler2D uParticlePos;
  uniform vec2 resolution;
  uniform float pointSize;
  varying vec2 vParticleUv;

  void main() {
    vParticleUv = aPosition;
    vec4 particleData = texture2D(uParticlePos, aPosition);
    vec2 pos = particleData.xy;
    vec2 clipPos = pos * 2.0 - 1.0;
    gl_Position = vec4(clipPos, 0.0, 1.0);
    gl_PointSize = pointSize;
  }
`

const particleFragmentShader = `
  precision highp float;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform float time;
  varying vec2 vParticleUv;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.0, dist);
    float t = sin(vParticleUv.x * 6.28 + time) * 0.5 + 0.5;
    float t2 = sin(vParticleUv.y * 6.28 + time * 0.7) * 0.5 + 0.5;

    vec3 color = mix(color1, color2, t);
    color = mix(color, color3, t2 * 0.5);

    gl_FragColor = vec4(color * alpha, alpha * 0.8);
  }
`

const particleUpdateShader = `
  precision highp float;
  uniform sampler2D uParticlePos;
  uniform sampler2D uVelocity;
  uniform float dt;
  uniform float decay;
  uniform vec2 texelSize;
  varying vec2 vUv;

  void main() {
    vec4 particleData = texture2D(uParticlePos, vUv);
    vec2 pos = particleData.xy;
    float life = particleData.z;
    float age = particleData.w;

    vec2 vel = texture2D(uVelocity, pos).xy;
    pos += vel * dt * texelSize * 50.0;
    pos = fract(pos + 1.0);
    age += dt;

    gl_FragColor = vec4(pos, life, age);
  }
`

// WebGL Helpers
function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }
  return program
}

interface FBO {
  texture: WebGLTexture
  fbo: WebGLFramebuffer
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
}

interface DoubleFBO {
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  read: FBO
  write: FBO
  swap: () => void
}

function createFBO(gl: WebGL2RenderingContext, width: number, height: number, internalFormat: number, format: number, type: number, filter: number): FBO | null {
  gl.activeTexture(gl.TEXTURE0)
  const texture = gl.createTexture()
  if (!texture) return null

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null)

  const fbo = gl.createFramebuffer()
  if (!fbo) return null
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.viewport(0, 0, width, height)
  gl.clear(gl.COLOR_BUFFER_BIT)

  return { texture, fbo, width, height, texelSizeX: 1.0 / width, texelSizeY: 1.0 / height }
}

function createDoubleFBO(gl: WebGL2RenderingContext, width: number, height: number, internalFormat: number, format: number, type: number, filter: number): DoubleFBO | null {
  const fbo1 = createFBO(gl, width, height, internalFormat, format, type, filter)
  const fbo2 = createFBO(gl, width, height, internalFormat, format, type, filter)
  if (!fbo1 || !fbo2) return null

  return {
    width, height, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
    read: fbo1, write: fbo2,
    swap() { const temp = this.read; this.read = this.write; this.write = temp }
  }
}

function hexToRgbNormalized(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
  }
  return [1, 0, 1]
}

// Main Component
export const FluidVisualiser = forwardRef<FluidVisualiserRef, FluidVisualiserProps>(
  ({ audioData, isPlaying, config, onConfigChange, frequencyBands, beatData }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGL2RenderingContext | null>(null)
    const animationRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)
    const timeRef = useRef<number>(0)

    const velocityRef = useRef<DoubleFBO | null>(null)
    const dyeRef = useRef<DoubleFBO | null>(null)
    const pressureRef = useRef<DoubleFBO | null>(null)
    const divergenceRef = useRef<FBO | null>(null)
    const curlRef = useRef<FBO | null>(null)
    const particlePosRef = useRef<DoubleFBO | null>(null)

    const programsRef = useRef<Record<string, WebGLProgram | null>>({})
    const quadVAORef = useRef<WebGLVertexArrayObject | null>(null)
    const particleVAORef = useRef<WebGLVertexArrayObject | null>(null)

    const autoInjectAngleRef = useRef<number>(0)
    const lastBeatRef = useRef<boolean>(false)
    const [showControls, setShowControls] = useState(false)

    const initFBOs = useCallback(() => {
      const gl = glRef.current
      if (!gl) return

      const simRes = config.simResolution
      const dyeRes = config.dyeResolution
      const particleRes = Math.sqrt(config.particleCount)

      const halfFloat = gl.HALF_FLOAT
      const rgba16f = gl.RGBA16F
      const rg16f = gl.RG16F
      const r16f = gl.R16F

      velocityRef.current = createDoubleFBO(gl, simRes, simRes, rg16f, gl.RG, halfFloat, gl.LINEAR)
      dyeRef.current = createDoubleFBO(gl, dyeRes, dyeRes, rgba16f, gl.RGBA, halfFloat, gl.LINEAR)
      pressureRef.current = createDoubleFBO(gl, simRes, simRes, r16f, gl.RED, halfFloat, gl.NEAREST)
      divergenceRef.current = createFBO(gl, simRes, simRes, r16f, gl.RED, halfFloat, gl.NEAREST)
      curlRef.current = createFBO(gl, simRes, simRes, r16f, gl.RED, halfFloat, gl.NEAREST)
      particlePosRef.current = createDoubleFBO(gl, particleRes, particleRes, rgba16f, gl.RGBA, halfFloat, gl.NEAREST)

      if (particlePosRef.current) {
        const particleData = new Float32Array(particleRes * particleRes * 4)
        for (let i = 0; i < particleRes * particleRes; i++) {
          particleData[i * 4 + 0] = Math.random()
          particleData[i * 4 + 1] = Math.random()
          particleData[i * 4 + 2] = 1.0
          particleData[i * 4 + 3] = Math.random() * 100
        }
        gl.bindTexture(gl.TEXTURE_2D, particlePosRef.current.read.texture)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, particleRes, particleRes, gl.RGBA, halfFloat, particleData)
      }
    }, [config.simResolution, config.dyeResolution, config.particleCount])

    const initGL = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: false })
      if (!gl) { console.error('WebGL2 not supported'); return }
      glRef.current = gl

      gl.getExtension('EXT_color_buffer_float')
      gl.getExtension('OES_texture_float_linear')

      const programs = programsRef.current
      programs.copy = createProgram(gl, baseVertexShader, copyShader)
      programs.clear = createProgram(gl, baseVertexShader, clearShader)
      programs.splat = createProgram(gl, baseVertexShader, splatShader)
      programs.advection = createProgram(gl, baseVertexShader, advectionShader)
      programs.divergence = createProgram(gl, baseVertexShader, divergenceShader)
      programs.curl = createProgram(gl, baseVertexShader, curlShader)
      programs.vorticity = createProgram(gl, baseVertexShader, vorticityShader)
      programs.pressure = createProgram(gl, baseVertexShader, pressureShader)
      programs.gradientSubtract = createProgram(gl, baseVertexShader, gradientSubtractShader)
      programs.particleUpdate = createProgram(gl, baseVertexShader, particleUpdateShader)
      programs.particleRender = createProgram(gl, particleVertexShader, particleFragmentShader)

      const quadVAO = gl.createVertexArray()
      gl.bindVertexArray(quadVAO)
      const quadBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      quadVAORef.current = quadVAO

      const particleSize = Math.sqrt(config.particleCount)
      const particleUvs: number[] = []
      for (let y = 0; y < particleSize; y++) {
        for (let x = 0; x < particleSize; x++) {
          particleUvs.push((x + 0.5) / particleSize, (y + 0.5) / particleSize)
        }
      }
      const particleVAO = gl.createVertexArray()
      gl.bindVertexArray(particleVAO)
      const particleBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particleUvs), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      particleVAORef.current = particleVAO

      gl.bindVertexArray(null)
      initFBOs()
    }, [config.particleCount, initFBOs])

    const blit = useCallback((target: FBO | null) => {
      const gl = glRef.current
      if (!gl || !quadVAORef.current) return
      if (target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
        gl.viewport(0, 0, target.width, target.height)
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      }
      gl.bindVertexArray(quadVAORef.current)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }, [])

    const splat = useCallback((x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
      const gl = glRef.current
      const programs = programsRef.current
      const velocity = velocityRef.current
      const dye = dyeRef.current
      if (!gl || !programs.splat || !velocity || !dye) return

      gl.useProgram(programs.splat)
      gl.uniform1i(gl.getUniformLocation(programs.splat, 'uTarget'), 0)
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'aspectRatio'), gl.canvas.width / gl.canvas.height)
      gl.uniform2f(gl.getUniformLocation(programs.splat, 'point'), x, y)
      gl.uniform3f(gl.getUniformLocation(programs.splat, 'color'), dx, dy, 0)
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'radius'), config.splatRadius / 100)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
      blit(velocity.write)
      velocity.swap()

      gl.uniform3f(gl.getUniformLocation(programs.splat, 'color'), color[0], color[1], color[2])
      gl.bindTexture(gl.TEXTURE_2D, dye.read.texture)
      blit(dye.write)
      dye.swap()
    }, [config.splatRadius, blit])

    const step = useCallback((dt: number) => {
      const gl = glRef.current
      const programs = programsRef.current
      const velocity = velocityRef.current
      const dye = dyeRef.current
      const pressure = pressureRef.current
      const divergence = divergenceRef.current
      const curl = curlRef.current
      const particlePos = particlePosRef.current
      if (!gl || !velocity || !dye || !pressure || !divergence || !curl) return

      gl.disable(gl.BLEND)

      // Curl
      if (programs.curl) {
        gl.useProgram(programs.curl)
        gl.uniform2f(gl.getUniformLocation(programs.curl, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY)
        gl.uniform1i(gl.getUniformLocation(programs.curl, 'uVelocity'), 0)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
        blit(curl)
      }

      // Vorticity
      if (programs.vorticity) {
        gl.useProgram(programs.vorticity)
        gl.uniform2f(gl.getUniformLocation(programs.vorticity, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY)
        gl.uniform1i(gl.getUniformLocation(programs.vorticity, 'uVelocity'), 0)
        gl.uniform1i(gl.getUniformLocation(programs.vorticity, 'uCurl'), 1)
        gl.uniform1f(gl.getUniformLocation(programs.vorticity, 'curl'), config.curl)
        gl.uniform1f(gl.getUniformLocation(programs.vorticity, 'dt'), dt)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, curl.texture)
        blit(velocity.write)
        velocity.swap()
      }

      // Divergence
      if (programs.divergence) {
        gl.useProgram(programs.divergence)
        gl.uniform2f(gl.getUniformLocation(programs.divergence, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY)
        gl.uniform1i(gl.getUniformLocation(programs.divergence, 'uVelocity'), 0)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
        blit(divergence)
      }

      // Clear pressure
      if (programs.clear) {
        gl.useProgram(programs.clear)
        gl.uniform1i(gl.getUniformLocation(programs.clear, 'uTexture'), 0)
        gl.uniform1f(gl.getUniformLocation(programs.clear, 'value'), 0.8)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture)
        blit(pressure.write)
        pressure.swap()
      }

      // Pressure iterations
      if (programs.pressure) {
        gl.useProgram(programs.pressure)
        gl.uniform2f(gl.getUniformLocation(programs.pressure, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY)
        gl.uniform1i(gl.getUniformLocation(programs.pressure, 'uDivergence'), 0)
        gl.uniform1i(gl.getUniformLocation(programs.pressure, 'uPressure'), 1)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, divergence.texture)
        for (let i = 0; i < config.pressureIterations; i++) {
          gl.activeTexture(gl.TEXTURE1)
          gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture)
          blit(pressure.write)
          pressure.swap()
        }
      }

      // Gradient subtract
      if (programs.gradientSubtract) {
        gl.useProgram(programs.gradientSubtract)
        gl.uniform2f(gl.getUniformLocation(programs.gradientSubtract, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY)
        gl.uniform1i(gl.getUniformLocation(programs.gradientSubtract, 'uPressure'), 0)
        gl.uniform1i(gl.getUniformLocation(programs.gradientSubtract, 'uVelocity'), 1)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
        blit(velocity.write)
        velocity.swap()
      }

      // Advect velocity
      if (programs.advection) {
        gl.useProgram(programs.advection)
        gl.uniform2f(gl.getUniformLocation(programs.advection, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY)
        gl.uniform1i(gl.getUniformLocation(programs.advection, 'uVelocity'), 0)
        gl.uniform1i(gl.getUniformLocation(programs.advection, 'uSource'), 0)
        gl.uniform1f(gl.getUniformLocation(programs.advection, 'dt'), dt)
        gl.uniform1f(gl.getUniformLocation(programs.advection, 'dissipation'), config.velocityDissipation)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
        blit(velocity.write)
        velocity.swap()

        // Advect dye
        gl.uniform2f(gl.getUniformLocation(programs.advection, 'texelSize'), dye.texelSizeX, dye.texelSizeY)
        gl.uniform1i(gl.getUniformLocation(programs.advection, 'uSource'), 1)
        gl.uniform1f(gl.getUniformLocation(programs.advection, 'dissipation'), config.densityDissipation)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, dye.read.texture)
        blit(dye.write)
        dye.swap()
      }

      // Update particles
      if (programs.particleUpdate && particlePos) {
        gl.useProgram(programs.particleUpdate)
        gl.uniform2f(gl.getUniformLocation(programs.particleUpdate, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY)
        gl.uniform1i(gl.getUniformLocation(programs.particleUpdate, 'uParticlePos'), 0)
        gl.uniform1i(gl.getUniformLocation(programs.particleUpdate, 'uVelocity'), 1)
        gl.uniform1f(gl.getUniformLocation(programs.particleUpdate, 'dt'), dt)
        gl.uniform1f(gl.getUniformLocation(programs.particleUpdate, 'decay'), 0.99)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, particlePos.read.texture)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
        blit(particlePos.write)
        particlePos.swap()
      }
    }, [config, blit])

    const render = useCallback(() => {
      const gl = glRef.current
      const programs = programsRef.current
      const dye = dyeRef.current
      const particlePos = particlePosRef.current
      if (!gl || !programs.copy || !dye) return

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.useProgram(programs.copy)
      gl.uniform1i(gl.getUniformLocation(programs.copy, 'uTexture'), 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, dye.read.texture)
      blit(null)

      if (programs.particleRender && particlePos && particleVAORef.current) {
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
        gl.useProgram(programs.particleRender)
        gl.uniform1i(gl.getUniformLocation(programs.particleRender, 'uParticlePos'), 0)
        gl.uniform2f(gl.getUniformLocation(programs.particleRender, 'resolution'), gl.canvas.width, gl.canvas.height)
        gl.uniform1f(gl.getUniformLocation(programs.particleRender, 'pointSize'), 2.0)
        gl.uniform1f(gl.getUniformLocation(programs.particleRender, 'time'), timeRef.current)

        const color1 = hexToRgbNormalized(config.primaryColor)
        const color2 = hexToRgbNormalized(config.secondaryColor)
        const color3 = hexToRgbNormalized(config.tertiaryColor)
        gl.uniform3f(gl.getUniformLocation(programs.particleRender, 'color1'), ...color1)
        gl.uniform3f(gl.getUniformLocation(programs.particleRender, 'color2'), ...color2)
        gl.uniform3f(gl.getUniformLocation(programs.particleRender, 'color3'), ...color3)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, particlePos.read.texture)
        gl.bindVertexArray(particleVAORef.current)
        gl.drawArrays(gl.POINTS, 0, config.particleCount)
        gl.disable(gl.BLEND)
      }
    }, [config, blit])

    const reset = useCallback(() => { initFBOs() }, [initFBOs])

    useImperativeHandle(ref, () => ({ reset, addSplat: splat }), [reset, splat])

    const animate = useCallback(() => {
      const now = performance.now() / 1000
      const dt = Math.min(now - lastTimeRef.current, 0.016)
      lastTimeRef.current = now
      timeRef.current += dt

      if (!isPlaying) { animationRef.current = requestAnimationFrame(animate); return }

      let bass = 0, mid = 0, high = 0
      if (frequencyBands) {
        bass = frequencyBands.bass; mid = frequencyBands.mid; high = frequencyBands.high
      } else if (audioData.length > 0) {
        const len = audioData.length
        const bassEnd = Math.floor(len * 0.1)
        const midEnd = Math.floor(len * 0.5)
        for (let i = 0; i < bassEnd; i++) bass += audioData[i]
        for (let i = bassEnd; i < midEnd; i++) mid += audioData[i]
        for (let i = midEnd; i < len; i++) high += audioData[i]
        bass /= bassEnd || 1; mid /= (midEnd - bassEnd) || 1; high /= (len - midEnd) || 1
      }

      bass *= config.bassMultiplier * config.audioSensitivity
      mid *= config.midMultiplier * config.audioSensitivity
      high *= config.highMultiplier * config.audioSensitivity

      if (config.autoInject) {
        autoInjectAngleRef.current += dt * config.autoInjectSpeed
        const energy = (bass + mid * 0.5 + high * 0.3) / 3
        const injectStrength = energy * config.splatForce

        if (injectStrength > 100) {
          const leftX = 0.1 + Math.sin(autoInjectAngleRef.current) * 0.05
          const leftY = 0.5 + Math.cos(autoInjectAngleRef.current * 0.7) * 0.2
          splat(leftX, leftY, bass * 500, 0, hexToRgbNormalized(config.tertiaryColor))

          const rightX = 0.9 + Math.sin(autoInjectAngleRef.current * 1.3) * 0.05
          const rightY = 0.5 + Math.cos(autoInjectAngleRef.current * 0.9) * 0.2
          splat(rightX, rightY, -high * 500, 0, hexToRgbNormalized(config.tertiaryColor))
        }

        if (mid > 0.3) {
          const cx = 0.5 + Math.sin(autoInjectAngleRef.current * 2) * 0.15
          const cy = 0.5 + Math.cos(autoInjectAngleRef.current * 1.5) * 0.15
          const angle = autoInjectAngleRef.current * 3
          splat(cx, cy, Math.cos(angle) * mid * 300, Math.sin(angle) * mid * 300, hexToRgbNormalized(config.primaryColor))
        }
      }

      if (beatData?.isBeat && !lastBeatRef.current) {
        const beatX = 0.5 + (Math.random() - 0.5) * 0.4
        const beatY = 0.5 + (Math.random() - 0.5) * 0.4
        const angle = Math.random() * Math.PI * 2
        const force = beatData.beatIntensity * config.splatForce * 2
        splat(beatX, beatY, Math.cos(angle) * force, Math.sin(angle) * force, hexToRgbNormalized(config.secondaryColor))
      }
      lastBeatRef.current = beatData?.isBeat || false

      step(dt)
      render()
      animationRef.current = requestAnimationFrame(animate)
    }, [isPlaying, audioData, frequencyBands, beatData, config, splat, step, render])

    useEffect(() => { initGL() }, [initGL])
    useEffect(() => {
      animationRef.current = requestAnimationFrame(animate)
      return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
    }, [animate])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const handleResize = () => {
        const parent = canvas.parentElement
        if (parent) {
          canvas.width = parent.clientWidth * window.devicePixelRatio
          canvas.height = parent.clientHeight * window.devicePixelRatio
          canvas.style.width = `${parent.clientWidth}px`
          canvas.style.height = `${parent.clientHeight}px`
        }
      }
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      let lastX = 0, lastY = 0, isDown = false

      const handleMouseDown = (e: MouseEvent) => { isDown = true; lastX = e.offsetX / canvas.clientWidth; lastY = 1.0 - e.offsetY / canvas.clientHeight }
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDown) return
        const x = e.offsetX / canvas.clientWidth
        const y = 1.0 - e.offsetY / canvas.clientHeight
        splat(x, y, (x - lastX) * config.splatForce, (y - lastY) * config.splatForce, hexToRgbNormalized(config.primaryColor))
        lastX = x; lastY = y
      }
      const handleMouseUp = () => { isDown = false }

      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseup', handleMouseUp)
      canvas.addEventListener('mouseleave', handleMouseUp)
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown)
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseup', handleMouseUp)
        canvas.removeEventListener('mouseleave', handleMouseUp)
      }
    }, [config.splatForce, config.primaryColor, splat])

    const renderControls = () => {
      if (!showControls) return null
      return (
        <Box sx={{ position: 'absolute', top: 8, right: 8, width: 280, bgcolor: 'rgba(0,0,0,0.8)', borderRadius: 1, p: 2, color: 'white', maxHeight: '80vh', overflowY: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>FLUID CONTROLS</Typography>
          <Typography variant="caption">Curl: {config.curl}</Typography>
          <Slider size="small" value={config.curl} min={0} max={50} onChange={(_, v) => onConfigChange?.({ curl: v as number })} />
          <Typography variant="caption">Splat Radius: {config.splatRadius.toFixed(2)}</Typography>
          <Slider size="small" value={config.splatRadius} min={0.05} max={1} step={0.01} onChange={(_, v) => onConfigChange?.({ splatRadius: v as number })} />
          <Typography variant="caption">Splat Force: {config.splatForce}</Typography>
          <Slider size="small" value={config.splatForce} min={1000} max={20000} onChange={(_, v) => onConfigChange?.({ splatForce: v as number })} />
          <Typography variant="caption">Density Dissipation: {config.densityDissipation.toFixed(2)}</Typography>
          <Slider size="small" value={config.densityDissipation} min={0.9} max={1} step={0.001} onChange={(_, v) => onConfigChange?.({ densityDissipation: v as number })} />
          <Typography variant="caption">Velocity Dissipation: {config.velocityDissipation.toFixed(2)}</Typography>
          <Slider size="small" value={config.velocityDissipation} min={0.9} max={1} step={0.001} onChange={(_, v) => onConfigChange?.({ velocityDissipation: v as number })} />
          <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>AUDIO</Typography>
          <Typography variant="caption">Sensitivity: {config.audioSensitivity.toFixed(1)}</Typography>
          <Slider size="small" value={config.audioSensitivity} min={0.1} max={3} step={0.1} onChange={(_, v) => onConfigChange?.({ audioSensitivity: v as number })} />
          <Typography variant="caption">Bass: {config.bassMultiplier.toFixed(1)}</Typography>
          <Slider size="small" value={config.bassMultiplier} min={0} max={5} step={0.1} onChange={(_, v) => onConfigChange?.({ bassMultiplier: v as number })} />
          <Typography variant="caption">Mid: {config.midMultiplier.toFixed(1)}</Typography>
          <Slider size="small" value={config.midMultiplier} min={0} max={5} step={0.1} onChange={(_, v) => onConfigChange?.({ midMultiplier: v as number })} />
          <Typography variant="caption">High: {config.highMultiplier.toFixed(1)}</Typography>
          <Slider size="small" value={config.highMultiplier} min={0} max={5} step={0.1} onChange={(_, v) => onConfigChange?.({ highMultiplier: v as number })} />
          <FormControlLabel control={<Switch size="small" checked={config.autoInject} onChange={(e) => onConfigChange?.({ autoInject: e.target.checked })} />} label="Auto Inject" />
          <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>COLORS</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" type="color" value={config.primaryColor} onChange={(e) => onConfigChange?.({ primaryColor: e.target.value })} sx={{ width: 60 }} />
            <TextField size="small" type="color" value={config.secondaryColor} onChange={(e) => onConfigChange?.({ secondaryColor: e.target.value })} sx={{ width: 60 }} />
            <TextField size="small" type="color" value={config.tertiaryColor} onChange={(e) => onConfigChange?.({ tertiaryColor: e.target.value })} sx={{ width: 60 }} />
          </Box>
        </Box>
      )
    }

    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', background: '#000' }} onClick={() => setShowControls(!showControls)} />
        {renderControls()}
      </Box>
    )
  }
)

FluidVisualiser.displayName = 'FluidVisualiser'
export default FluidVisualiser
