import { useRef, useEffect, useCallback } from 'react'
import type { Theme } from '@mui/material/styles'
import {
  createShader,
  createProgram,
  vertexShaderSource,
  fragmentShaderSource,
  spectrumFragmentShader,
  particleVertexShader,
  particleFragmentShader,
  bleepFragmentShader,
  concentricFragmentShader,
  gifFragmentShader,
  quadVertexShader,
  hexToRgb,
  matrixRainShader,
  terrainShader,
  geometricShader,
  // Matrix Effects
  gameOfLifeShader,
  digitalRainShader,
  flameShader,
  plasma2dShader,
  equalizer2dShader,
  noise2dShader,
  // Additional Matrix Effects
  blenderShader,
  cloneShader,
  bandsShader,
  bandsMatrixShader,
  blocksShader,
  keybeat2dShader,
  texterShader,
  plasmaWled2dShader,
  radialShader,
  soapShader,
  waterfallShader,
  imageShader
} from '../../engines/webgl/shaders'
import type { WebGLVisualiserId } from '../../_generated/webgl'
import { parseGradient } from '../../utils/gradient'

export type WebGLVisualisationType = WebGLVisualiserId

interface PostProcessingControls {
  getInputFramebuffer: () => WebGLFramebuffer | null
  render: () => void
  updateTime: (deltaTime: number, beatData?: { isBeat: boolean; beatPhase: number; beatIntensity: number }) => void
}

interface WebGLVisualiserProps {
  audioData: number[] | Float32Array
  isPlaying: boolean
  visualType: WebGLVisualisationType
  config: Record<string, any>
  customShader?: string
  beatData?: {
    isBeat: boolean
    beatIntensity: number
    beatPhase: number
    bpm: number
  }
  frequencyBands?: {
    bass: number
    mid: number
    high: number
  }
  theme: Theme
  postProcessing?: PostProcessingControls
  postProcessingEnabled?: boolean
  onContextCreated?: (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  amplitude: number
}

const MAX_PARTICLES = 2000

export const WebGLVisualiser = ({
  audioData,
  isPlaying,
  visualType,
  config,
  customShader,
  beatData,
  frequencyBands,
  theme,
  postProcessing,
  postProcessingEnabled = false,
  onContextCreated
}: WebGLVisualiserProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const gradientTextureRef = useRef<WebGLTexture | null>(null)
  const currentGradientStrRef = useRef<string | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number>(Date.now())
  const previousDataRef = useRef<number[] | Float32Array>([])
  const particlesRef = useRef<Particle[]>([])
  const historyRef = useRef<number[]>(new Array(128).fill(0))
  const beatRef = useRef<number>(0)
  const audioDataRef = useRef<number[] | Float32Array>([])
  const isDrawingRef = useRef<boolean>(false)
  const themeColorsRef = useRef({ primary: [0, 0, 0], secondary: [0, 0, 0] })
  const lastFrameTimeRef = useRef<number>(performance.now())
  const postProcessingRef = useRef(postProcessing)
  const postProcessingEnabledRef = useRef(postProcessingEnabled)
  const onContextCreatedRef = useRef(onContextCreated)
  const beatDataRef = useRef(beatData)
  const frequencyBandsRef = useRef(frequencyBands)
  const configRef = useRef(config)

  // Keep refs in sync
  useEffect(() => {
    postProcessingRef.current = postProcessing
    postProcessingEnabledRef.current = postProcessingEnabled
    onContextCreatedRef.current = onContextCreated
  }, [postProcessing, postProcessingEnabled, onContextCreated])

  // Update audio and config refs every render
  beatDataRef.current = beatData
  frequencyBandsRef.current = frequencyBands
  configRef.current = config
  audioDataRef.current = audioData

  // Update theme colors
  useEffect(() => {
    themeColorsRef.current = {
      primary: hexToRgb(theme?.palette?.primary?.main || '#1976d2'),
      secondary: hexToRgb(theme?.palette?.secondary?.main || '#dc004e')
    }
  }, [theme?.palette?.primary?.main, theme?.palette?.secondary?.main])

  // Initialize WebGL
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    })

    if (!gl) {
      console.error('WebGL not supported')
      return false
    }

    glRef.current = gl

    if (programRef.current) {
      gl.deleteProgram(programRef.current)
      programRef.current = null
    }

    let vertexSource = vertexShaderSource
    let fragmentSource = customShader || fragmentShaderSource

    if (!customShader) {
      if (visualType === 'particles') {
        vertexSource = particleVertexShader
        fragmentSource = particleFragmentShader
      } else if (visualType === 'radial3d') {
        fragmentSource = spectrumFragmentShader
      } else if (visualType === 'bleep') {
        vertexSource = quadVertexShader
        fragmentSource = bleepFragmentShader
      } else if (visualType === 'concentric') {
        vertexSource = quadVertexShader
        fragmentSource = concentricFragmentShader
      } else if (visualType === 'gif') {
        vertexSource = quadVertexShader
        fragmentSource = gifFragmentShader
      } else if (visualType === 'matrix') {
        vertexSource = quadVertexShader
        fragmentSource = matrixRainShader
      } else if (visualType === 'terrain') {
        vertexSource = quadVertexShader
        fragmentSource = terrainShader
      } else if (visualType === 'geometric') {
        vertexSource = quadVertexShader
        fragmentSource = geometricShader
      } else if (visualType === 'gameoflife') {
        vertexSource = quadVertexShader
        fragmentSource = gameOfLifeShader
      } else if (visualType === 'digitalrain') {
        vertexSource = quadVertexShader
        fragmentSource = digitalRainShader
      } else if (visualType === 'flame') {
        vertexSource = quadVertexShader
        fragmentSource = flameShader
      } else if (visualType === 'plasma2d') {
        vertexSource = quadVertexShader
        fragmentSource = plasma2dShader
      } else if (visualType === 'equalizer2d') {
        vertexSource = quadVertexShader
        fragmentSource = equalizer2dShader
      } else if (visualType === 'noise2d') {
        vertexSource = quadVertexShader
        fragmentSource = noise2dShader
      } else if (visualType === 'blender') {
        vertexSource = quadVertexShader
        fragmentSource = blenderShader
      } else if (visualType === 'clone') {
        vertexSource = quadVertexShader
        fragmentSource = cloneShader
      } else if (visualType === 'bands') {
        vertexSource = quadVertexShader
        fragmentSource = bandsShader
      } else if (visualType === 'bandsmatrix') {
        vertexSource = quadVertexShader
        fragmentSource = bandsMatrixShader
      } else if (visualType === 'blocks') {
        vertexSource = quadVertexShader
        fragmentSource = blocksShader
      } else if (visualType === 'keybeat2d') {
        vertexSource = quadVertexShader
        fragmentSource = keybeat2dShader
      } else if (visualType === 'texter') {
        vertexSource = quadVertexShader
        fragmentSource = texterShader
      } else if (visualType === 'plasmawled2d') {
        vertexSource = quadVertexShader
        fragmentSource = plasmaWled2dShader
      } else if (visualType === 'radial') {
        vertexSource = quadVertexShader
        fragmentSource = radialShader
      } else if (visualType === 'soap') {
        vertexSource = quadVertexShader
        fragmentSource = soapShader
      } else if (visualType === 'waterfall') {
        vertexSource = quadVertexShader
        fragmentSource = waterfallShader
      } else if (visualType === 'image') {
        vertexSource = quadVertexShader
        fragmentSource = imageShader
      }
    } else {
      vertexSource = quadVertexShader
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

    if (!vertexShader || !fragmentShader) return false

    const program = createProgram(gl, vertexShader, fragmentShader)
    if (!program) return false

    programRef.current = program
    gl.useProgram(program)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    if (onContextCreatedRef.current) {
      onContextCreatedRef.current(gl, canvas)
    }

    return true
  }, [visualType, customShader])

  // Apply smoothing
  const getSmoothData = useCallback(
    (data: number[] | Float32Array): number[] | Float32Array => {
      const smoothing = configRef.current.audioSmoothing ?? configRef.current.smoothing ?? 0.5
      if (previousDataRef.current.length !== data.length) {
        previousDataRef.current = data.slice(0) as number[] | Float32Array
        return data
      }

      const smoothed = (data as any).map((val: number, i: number) => {
        const prev = previousDataRef.current[i] || 0
        return prev * smoothing + val * (1 - smoothing)
      })
      previousDataRef.current = smoothed
      return smoothed
    },
    []
  )

  // Draw bars with 3D effect
  const drawBars3D = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0

      const bufferLength = data.length
      const barWidth = width / bufferLength
      const vertices: number[] = []
      const amplitudes: number[] = []
      const indices: number[] = []

      for (let i = 0; i < bufferLength; i++) {
        const amplitude = Math.min(data[i] * sensitivity * 0.5, 1)
        const barHeight = amplitude * height
        const x = i * barWidth
        const w = barWidth - 2
        const depth = amplitude * 20

        vertices.push(
          x, height, x + w, height, x + w, height - barHeight,
          x, height, x + w, height - barHeight, x, height - barHeight
        )

        vertices.push(
          x, height - barHeight, x + w, height - barHeight, x + w + depth, height - barHeight - depth,
          x, height - barHeight, x + w + depth, height - barHeight - depth, x + depth, height - barHeight - depth
        )

        for (let j = 0; j < 12; j++) {
          amplitudes.push(amplitude)
          indices.push(i / bufferLength)
        }
      }

      const positionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW)
      const positionLoc = gl.getAttribLocation(program, 'a_position')
      gl.enableVertexAttribArray(positionLoc)
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

      const amplitudeBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, amplitudeBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(amplitudes), gl.DYNAMIC_DRAW)
      const amplitudeLoc = gl.getAttribLocation(program, 'a_amplitude')
      if (amplitudeLoc !== -1) {
        gl.enableVertexAttribArray(amplitudeLoc)
        gl.vertexAttribPointer(amplitudeLoc, 1, gl.FLOAT, false, 0, 0)
      }

      const indexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.DYNAMIC_DRAW)
      const indexLoc = gl.getAttribLocation(program, 'a_index')
      if (indexLoc !== -1) {
        gl.enableVertexAttribArray(indexLoc)
        gl.vertexAttribPointer(indexLoc, 1, gl.FLOAT, false, 0, 0)
      }

      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height)
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (Date.now() - startTimeRef.current) / 1000)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(gl.getUniformLocation(program, 'u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(gl.getUniformLocation(program, 'u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2)
      gl.disableVertexAttribArray(positionLoc)
      if (amplitudeLoc !== -1) gl.disableVertexAttribArray(amplitudeLoc)
      if (indexLoc !== -1) gl.disableVertexAttribArray(indexLoc)
      gl.deleteBuffer(positionBuffer); gl.deleteBuffer(amplitudeBuffer); gl.deleteBuffer(indexBuffer)
    },
    []
  )

  // Draw particles
  const drawParticles = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const avgAmplitude = (data as any).reduce((a: number, b: number) => a + b, 0) / data.length

      const spawnCount = Math.floor(avgAmplitude * sensitivity * 20)
      for (let i = 0; i < spawnCount && particlesRef.current.length < MAX_PARTICLES; i++) {
        const freqIndex = Math.floor(Math.random() * data.length)
        const amp = data[freqIndex] * sensitivity * 0.5
        particlesRef.current.push({
          x: (freqIndex / data.length) * width,
          y: height,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3 - 1,
          life: 0,
          size: Math.random() * 8 + 4,
          amplitude: amp
        })
      }

      const dt = 0.016
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx * 60 * dt
        p.y += p.vy * 60 * dt
        p.vy -= 0.1
        p.life += dt * 0.5
        return p.life < 1 && p.y > 0 && p.x > 0 && p.x < width
      })

      if (particlesRef.current.length === 0) return

      const positions: number[] = [], velocities: number[] = [], lives: number[] = [], sizes: number[] = [], amplitudes: number[] = []
      particlesRef.current.forEach((p) => {
        positions.push(p.x, p.y); velocities.push(p.vx, p.vy); lives.push(p.life); sizes.push(p.size); amplitudes.push(p.amplitude)
      })

      const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)
      const posLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const velBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, velBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(velocities), gl.DYNAMIC_DRAW)
      const velLoc = gl.getAttribLocation(program, 'a_velocity'); if (velLoc !== -1) { gl.enableVertexAttribArray(velLoc); gl.vertexAttribPointer(velLoc, 2, gl.FLOAT, false, 0, 0) }

      const lifeBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lives), gl.DYNAMIC_DRAW)
      const lifeLoc = gl.getAttribLocation(program, 'a_life'); if (lifeLoc !== -1) { gl.enableVertexAttribArray(lifeLoc); gl.vertexAttribPointer(lifeLoc, 1, gl.FLOAT, false, 0, 0) }

      const sizeBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW)
      const sizeLoc = gl.getAttribLocation(program, 'a_size'); if (sizeLoc !== -1) { gl.enableVertexAttribArray(sizeLoc); gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0) }

      const ampBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ampBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(amplitudes), gl.DYNAMIC_DRAW)
      const ampLoc = gl.getAttribLocation(program, 'a_amplitude'); if (ampLoc !== -1) { gl.enableVertexAttribArray(ampLoc); gl.vertexAttribPointer(ampLoc, 1, gl.FLOAT, false, 0, 0) }

      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height)
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (Date.now() - startTimeRef.current) / 1000)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(gl.getUniformLocation(program, 'u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(gl.getUniformLocation(program, 'u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      gl.drawArrays(gl.POINTS, 0, particlesRef.current.length)
      gl.disableVertexAttribArray(posLoc); if (velLoc !== -1) gl.disableVertexAttribArray(velLoc); if (lifeLoc !== -1) gl.disableVertexAttribArray(lifeLoc); if (sizeLoc !== -1) gl.disableVertexAttribArray(sizeLoc); if (ampLoc !== -1) gl.disableVertexAttribArray(ampLoc)
      gl.deleteBuffer(posBuf); gl.deleteBuffer(velBuf); gl.deleteBuffer(lifeBuf); gl.deleteBuffer(sizeBuf); gl.deleteBuffer(ampBuf)
    },
    []
  )

  // Draw radial visualization
  const drawRadial3D = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const centerX = width / 2, centerY = height / 2, baseRadius = Math.min(width, height) / 4
      const vertices: number[] = [], amplitudes: number[] = [], indices: number[] = []
      const bufferLength = data.length

      for (let i = 0; i < bufferLength; i++) {
        const amplitude = Math.min(data[i] * sensitivity * 0.5, 1)
        const angle = (i / bufferLength) * Math.PI * 2, nextAngle = ((i + 1) / bufferLength) * Math.PI * 2
        const innerRadius = baseRadius, outerRadius = baseRadius + amplitude * baseRadius
        const x1 = centerX + Math.cos(angle) * innerRadius, y1 = centerY + Math.sin(angle) * innerRadius
        const x2 = centerX + Math.cos(angle) * outerRadius, y2 = centerY + Math.sin(angle) * outerRadius
        const x3 = centerX + Math.cos(nextAngle) * outerRadius, y3 = centerY + Math.sin(nextAngle) * outerRadius
        const x4 = centerX + Math.cos(nextAngle) * innerRadius, y4 = centerY + Math.sin(nextAngle) * innerRadius
        vertices.push(x1, y1, x2, y2, x3, y3, x1, y1, x3, y3, x4, y4)
        for (let j = 0; j < 6; j++) { amplitudes.push(amplitude); indices.push(i / bufferLength) }
      }

      const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW)
      const posLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const ampBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ampBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(amplitudes), gl.DYNAMIC_DRAW)
      const ampLoc = gl.getAttribLocation(program, 'a_amplitude'); if (ampLoc !== -1) { gl.enableVertexAttribArray(ampLoc); gl.vertexAttribPointer(ampLoc, 1, gl.FLOAT, false, 0, 0) }

      const idxBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.DYNAMIC_DRAW)
      const idxLoc = gl.getAttribLocation(program, 'a_index'); if (idxLoc !== -1) { gl.enableVertexAttribArray(idxLoc); gl.vertexAttribPointer(idxLoc, 1, gl.FLOAT, false, 0, 0) }

      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height)
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (Date.now() - startTimeRef.current) / 1000)

      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2)
      gl.disableVertexAttribArray(posLoc); if (ampLoc !== -1) gl.disableVertexAttribArray(ampLoc); if (idxLoc !== -1) gl.disableVertexAttribArray(idxLoc)
      gl.deleteBuffer(posBuf); gl.deleteBuffer(ampBuf); gl.deleteBuffer(idxBuf)
    },
    []
  )

  // Draw waveform with 3D effect
  const drawWaveform3D = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const vertices: number[] = [], amplitudes: number[] = [], indices: number[] = []
      const bufferLength = data.length, sliceWidth = width / bufferLength, centerY = height / 2

      for (let i = 0; i < bufferLength - 1; i++) {
        const amp1 = data[i] * sensitivity * 0.3, amp2 = data[i + 1] * sensitivity * 0.3
        const x1 = i * sliceWidth, x2 = (i + 1) * sliceWidth, y1 = centerY + (amp1 - 0.5) * height * 0.8
        vertices.push(x1, centerY, x1, y1, x2, y1, x1, centerY, x2, y1, x2, centerY)
        for (let j = 0; j < 6; j++) { amplitudes.push((amp1 + amp2) / 2); indices.push(i / bufferLength) }
      }

      const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW)
      const posLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const ampBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ampBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(amplitudes), gl.DYNAMIC_DRAW)
      const ampLoc = gl.getAttribLocation(program, 'a_amplitude'); if (ampLoc !== -1) { gl.enableVertexAttribArray(ampLoc); gl.vertexAttribPointer(ampLoc, 1, gl.FLOAT, false, 0, 0) }

      const idxBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.DYNAMIC_DRAW)
      const idxLoc = gl.getAttribLocation(program, 'a_index'); if (idxLoc !== -1) { gl.enableVertexAttribArray(idxLoc); gl.vertexAttribPointer(idxLoc, 1, gl.FLOAT, false, 0, 0) }

      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height)
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (Date.now() - startTimeRef.current) / 1000)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(gl.getUniformLocation(program, 'u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(gl.getUniformLocation(program, 'u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2)
      gl.disableVertexAttribArray(posLoc); if (ampLoc !== -1) gl.disableVertexAttribArray(ampLoc); if (idxLoc !== -1) gl.disableVertexAttribArray(idxLoc)
      gl.deleteBuffer(posBuf); gl.deleteBuffer(ampBuf); gl.deleteBuffer(idxBuf)
    },
    []
  )

  // Draw Bleep
  const drawBleep = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const speed = cfg.scroll_time ? 1.0 / cfg.scroll_time : 1.0
      const avg = (data as any).reduce((a: number, b: number) => a + b, 0) / data.length
      historyRef.current.push(avg * sensitivity)
      if (historyRef.current.length > 128) historyRef.current.shift()

      const vertices = [-1, -1, 1, -1, -1, 1, 1, 1]
      const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
      const posLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture)
      const textureData = new Uint8Array(historyRef.current.length)
      for (let i = 0; i < historyRef.current.length; i++) textureData[i] = Math.min(255, Math.max(0, historyRef.current[i] * 255))
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, historyRef.current.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, textureData)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height)
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), ((Date.now() - startTimeRef.current) / 1000) * speed)
      gl.uniform1i(gl.getUniformLocation(program, 'u_history'), 0)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(gl.getUniformLocation(program, 'u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(gl.getUniformLocation(program, 'u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.disableVertexAttribArray(posLoc); gl.deleteBuffer(posBuf); gl.deleteTexture(texture)
    },
    []
  )

  // Draw Concentric
  const drawConcentric = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const scale = cfg.gradient_scale ?? 1.0
      const avg = (data as any).reduce((a: number, b: number) => a + b, 0) / data.length
      const currentBeatData = beatDataRef.current
      if (currentBeatData) beatRef.current += currentBeatData.beatIntensity * 0.2
      else beatRef.current += avg * sensitivity * 0.1

      const vertices = [-1, -1, 1, -1, -1, 1, 1, 1]
      const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
      const posLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height)
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (Date.now() - startTimeRef.current) / 1000)
      gl.uniform1f(gl.getUniformLocation(program, 'u_beat'), beatRef.current)
      const scaleLoc = gl.getUniformLocation(program, 'u_scale'); if (scaleLoc) gl.uniform1f(scaleLoc, scale)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(gl.getUniformLocation(program, 'u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(gl.getUniformLocation(program, 'u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.disableVertexAttribArray(posLoc); gl.deleteBuffer(posBuf)
    },
    []
  )

  // Draw Custom / GIF / Matrix Effects
  const drawCustom = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current

      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const avg = (data as any).reduce((a: number, b: number) => a + b, 0) / data.length

      const rotation = cfg.rotate ? cfg.rotate * (Math.PI / 180) : 0
      const brightness = cfg.brightness ?? 1.0
      const fps = cfg.gif_fps ?? 30
      const speed = fps / 30.0

      const vertices = [-1, -1, 1, -1, -1, 1, 1, 1]
      const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
      const posLoc = gl.getAttribLocation(program, 'a_position'); gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const resLoc = gl.getUniformLocation(program, 'u_resolution'); if (resLoc) gl.uniform2f(resLoc, width, height)
      const timeLoc = gl.getUniformLocation(program, 'u_time'); if (timeLoc) {
        const actualSpeed = cfg.speed ?? speed
        gl.uniform1f(timeLoc, ((Date.now() - startTimeRef.current) / 1000) * actualSpeed)
      }
      const energyLoc = gl.getUniformLocation(program, 'u_energy'); if (energyLoc) gl.uniform1f(energyLoc, avg * sensitivity)
      const beatLoc = gl.getUniformLocation(program, 'u_beat'); if (beatLoc) {
        const currentBeatData = beatDataRef.current
        if (currentBeatData) beatRef.current += currentBeatData.beatIntensity * 0.2
        else beatRef.current += avg * sensitivity * 0.1
        gl.uniform1f(beatLoc, beatRef.current)
      }
      const rotLoc = gl.getUniformLocation(program, 'u_rotate'); if (rotLoc) gl.uniform1f(rotLoc, rotation)
      const brLoc = gl.getUniformLocation(program, 'u_brightness'); if (brLoc) gl.uniform1f(brLoc, brightness)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(gl.getUniformLocation(program, 'u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(gl.getUniformLocation(program, 'u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      const freqBands = frequencyBandsRef.current
      const bass = freqBands?.bass ?? avg, mid = freqBands?.mid ?? avg, high = freqBands?.high ?? avg
      const bassLoc = gl.getUniformLocation(program, 'u_bass'); if (bassLoc) gl.uniform1f(bassLoc, bass * sensitivity)
      const midLoc = gl.getUniformLocation(program, 'u_mid'); if (midLoc) gl.uniform1f(midLoc, mid * sensitivity)
      const highLoc = gl.getUniformLocation(program, 'u_high'); if (highLoc) gl.uniform1f(highLoc, high * sensitivity)

      // Game of Life
      const csLoc = gl.getUniformLocation(program, 'u_cellSize'); if (csLoc) gl.uniform1f(csLoc, cfg.cell_size ?? cfg.base_game_speed ?? 8.0)
      const ibLoc = gl.getUniformLocation(program, 'u_injectBeat'); if (ibLoc) gl.uniform1f(ibLoc, beatDataRef.current?.isBeat && cfg.beat_inject !== false ? 1.0 : 0.0)

      // Digital Rain
      const denLoc = gl.getUniformLocation(program, 'u_density'); if (denLoc) gl.uniform1f(denLoc, cfg.count ?? cfg.density ?? 1.9)
      const spdLoc = gl.getUniformLocation(program, 'u_speed'); if (spdLoc) {
        const s = cfg.add_speed ? cfg.add_speed / 20.0 : (cfg.run_seconds ? 2.0 / cfg.run_seconds : 1.5)
        gl.uniform1f(spdLoc, s)
      }
      const tlLoc = gl.getUniformLocation(program, 'u_tailLength'); if (tlLoc) gl.uniform1f(tlLoc, (cfg.tail ?? 67) / 100.0)
      const giLoc = gl.getUniformLocation(program, 'u_glowIntensity'); if (giLoc) gl.uniform1f(giLoc, cfg.multiplier ? cfg.multiplier / 10.0 : 1.0)

      // Flame
      const inLoc = gl.getUniformLocation(program, 'u_intensity'); if (inLoc) gl.uniform1f(inLoc, cfg.intensity ?? 1.0)
      const wbLoc = gl.getUniformLocation(program, 'u_wobble'); if (wbLoc) gl.uniform1f(wbLoc, cfg.velocity ?? 0.3)
      const lcLoc = gl.getUniformLocation(program, 'u_lowColor'); if (lcLoc) { const c = hexToRgb(cfg.low_band ?? cfg.low_color ?? '#FF4400'); gl.uniform3f(lcLoc, c[0], c[1], c[2]) }
      const mcLoc = gl.getUniformLocation(program, 'u_midColor'); if (mcLoc) { const c = hexToRgb(cfg.mid_band ?? cfg.mid_color ?? '#FFAA00'); gl.uniform3f(mcLoc, c[0], c[1], c[2]) }
      const hcLoc = gl.getUniformLocation(program, 'u_highColor'); if (hcLoc) { const c = hexToRgb(cfg.high_band ?? cfg.high_color ?? '#FFFF00'); gl.uniform3f(hcLoc, c[0], c[1], c[2]) }

      // Plasma
      const twLoc = gl.getUniformLocation(program, 'u_twist'); if (twLoc) gl.uniform1f(twLoc, cfg.twist ?? 0.1)

      // Equalizer
      const bdLoc = gl.getUniformLocation(program, 'u_bands'); if (bdLoc) gl.uniform1f(bdLoc, cfg.bands ?? 16.0)
      const rmLoc = gl.getUniformLocation(program, 'u_ringMode'); if (rmLoc) gl.uniform1f(rmLoc, (cfg.ring || cfg.ring_mode) ? 1.0 : 0.0)
      const cmLoc = gl.getUniformLocation(program, 'u_centerMode'); if (cmLoc) gl.uniform1f(cmLoc, (cfg.center || cfg.center_mode) ? 1.0 : 0.0)
      const sLoc = gl.getUniformLocation(program, 'u_spin'); if (sLoc) {
        if (cfg.spin || cfg.spin_enabled) beatRef.current += bass * (cfg.spin_multiplier ?? 1.0) * 0.05
        gl.uniform1f(sLoc, beatRef.current)
      }

      // Gradient support
      const useGradLoc = gl.getUniformLocation(program, 'u_useGradient')
      const gradLoc = gl.getUniformLocation(program, 'u_gradient')
      const gradRollLoc = gl.getUniformLocation(program, 'u_gradientRoll')
      if (useGradLoc && gradLoc && cfg.gradient) {
        if (!gradientTextureRef.current) gradientTextureRef.current = gl.createTexture()
        if (currentGradientStrRef.current !== cfg.gradient) {
          const gradData = parseGradient(cfg.gradient); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gradientTextureRef.current)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gradData)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          currentGradientStrRef.current = cfg.gradient
        }
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gradientTextureRef.current); gl.uniform1i(gradLoc, 1); gl.uniform1i(useGradLoc, 1)
        if (gradRollLoc) {
          const rollSpeed = cfg.gradient_roll ?? 0
          gl.uniform1f(gradRollLoc, ((Date.now() - startTimeRef.current) / 1000 * rollSpeed) % 1.0)
        }
      } else if (useGradLoc) gl.uniform1i(useGradLoc, 0)

      const melBankLoc = gl.getUniformLocation(program, 'u_melbank')
      if (melBankLoc && data.length > 0) {
        const texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture)
        const texData = new Uint8Array(data.length)
        for (let i = 0; i < data.length; i++) texData[i] = Math.min(255, Math.max(0, data[i] * 255 * sensitivity))
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, data.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texData)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.uniform1i(melBankLoc, 0)
      }

      // Remaining uniforms
      const zLoc = gl.getUniformLocation(program, 'u_zoom'); if (zLoc) gl.uniform1f(zLoc, cfg.zoom ?? cfg.stretch ?? 3.0)
      const azLoc = gl.getUniformLocation(program, 'u_audioZoom'); if (azLoc) gl.uniform1f(azLoc, cfg.multiplier ?? cfg.audio_zoom ?? 1.0)
      const blurLoc = gl.getUniformLocation(program, 'u_blur'); if (blurLoc) gl.uniform1f(blurLoc, cfg.mask_cutoff ?? cfg.blur ?? 0.5)
      const mirLoc = gl.getUniformLocation(program, 'u_mirrors'); if (mirLoc) gl.uniform1f(mirLoc, cfg.screen ?? cfg.mirrors ?? 2.0)
      const flpLoc = gl.getUniformLocation(program, 'u_flip'); if (flpLoc) gl.uniform1f(flpLoc, (cfg.align === 'invert' || cfg.flip) ? 1.0 : 0.0)
      const bsLoc = gl.getUniformLocation(program, 'u_blockSize'); if (bsLoc) gl.uniform1f(bsLoc, cfg.block_count ?? cfg.block_size ?? 10.0)
      const kLoc = gl.getUniformLocation(program, 'u_keys'); if (kLoc) gl.uniform1f(kLoc, (cfg.stretch_horizontal / 6.25) || (cfg.keys ?? 16.0))
      const tdLoc = gl.getUniformLocation(program, 'u_density'); if (tdLoc && visualType === 'texter') gl.uniform1f(tdLoc, (cfg.height_percent / 10.0) || (cfg.density ?? 1.0))
      const rbLoc = gl.getUniformLocation(program, 'u_bands'); if (rbLoc && visualType === 'radial') gl.uniform1f(rbLoc, cfg.edges || cfg.bands || 32.0)
      const bcLoc = gl.getUniformLocation(program, 'u_bands'); if (bcLoc && (visualType === 'bands' || visualType === 'bandsmatrix')) gl.uniform1f(bcLoc, cfg.band_count || cfg.bands || 16.0)
      const wbndLoc = gl.getUniformLocation(program, 'u_bands'); if (wbndLoc && visualType === 'waterfall') gl.uniform1f(wbndLoc, cfg.bands || 16.0)
      const wspdLoc = gl.getUniformLocation(program, 'u_speed'); if (wspdLoc && visualType === 'waterfall') gl.uniform1f(wspdLoc, (3.0 / cfg.drop_secs) || (cfg.speed ?? 1.0))

      const bgcLoc = gl.getUniformLocation(program, 'u_bgColor'); if (bgcLoc) { const c = hexToRgb(cfg.bg_color ?? cfg.backgroundColor ?? '#000000'); gl.uniform3f(bgcLoc, c[0], c[1], c[2]) }
      const bgbLoc = gl.getUniformLocation(program, 'u_backgroundBrightness'); if (bgbLoc) gl.uniform1f(bgbLoc, cfg.background_brightness ?? 1.0)
      const mltLoc = gl.getUniformLocation(program, 'u_multiplier'); if (mltLoc) gl.uniform1f(mltLoc, cfg.multiplier ?? 0.5)
      const mszLoc = gl.getUniformLocation(program, 'u_minSize'); if (mszLoc) gl.uniform1f(mszLoc, cfg.min_size ?? 0.3)
      const frLoc = gl.getUniformLocation(program, 'u_frequencyRange'); if (frLoc) gl.uniform1f(frLoc, typeof cfg.frequency_range === 'number' ? cfg.frequency_range : 0.0)
      const clLoc = gl.getUniformLocation(program, 'u_clip'); if (clLoc) gl.uniform1f(clLoc, cfg.clip ? 1.0 : 0.0)
      const spiLoc = gl.getUniformLocation(program, 'u_spin'); if (spiLoc && visualType === 'image') gl.uniform1f(spiLoc, cfg.spin ? 1.0 : 0.0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.disableVertexAttribArray(posLoc); gl.deleteBuffer(posBuf)
    },
    [visualType]
  )

  // Main draw function
  const draw = useCallback(() => {
    const gl = glRef.current; const canvas = canvasRef.current
    if (!gl || !canvas || !isDrawingRef.current) return
    const width = canvas.width, height = canvas.height
    if (programRef.current) gl.useProgram(programRef.current)
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const now = performance.now(), deltaTime = (now - lastFrameTimeRef.current) / 1000
    lastFrameTimeRef.current = now

    const pp = postProcessingRef.current, ppEnabled = postProcessingEnabledRef.current && pp
    if (ppEnabled) {
      const inputFB = pp.getInputFramebuffer()
      if (inputFB) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, null); gl.bindFramebuffer(gl.FRAMEBUFFER, inputFB); gl.viewport(0, 0, width, height) }
    }

    gl.clearColor(0, 0, 0, 0.15); gl.clear(gl.COLOR_BUFFER_BIT)

    const currentAudioData = audioDataRef.current
    if (currentAudioData.length === 0) {
      if (ppEnabled) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        const bd = beatDataRef.current; pp.updateTime(deltaTime, bd ? { isBeat: bd.isBeat, beatPhase: bd.beatPhase, beatIntensity: bd.beatIntensity } : undefined); pp.render()
      }
      animationRef.current = requestAnimationFrame(draw); return
    }

    const smoothedData = getSmoothData(currentAudioData)
    if (customShader) drawCustom(gl, smoothedData, width, height)
    else {
      switch (visualType) {
        case 'bars3d': drawBars3D(gl, smoothedData, width, height); break
        case 'particles': drawParticles(gl, smoothedData, width, height); break
        case 'waveform3d': drawWaveform3D(gl, smoothedData, width, height); break
        case 'radial3d': drawRadial3D(gl, smoothedData, width, height); break
        case 'bleep': drawBleep(gl, smoothedData, width, height); break
        case 'concentric': drawConcentric(gl, smoothedData, width, height); break
        default: drawCustom(gl, smoothedData, width, height); break
      }
    }

    if (ppEnabled) {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, null); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, width, height)
      const bd = beatDataRef.current; pp.updateTime(deltaTime, bd ? { isBeat: bd.isBeat, beatPhase: bd.beatPhase, beatIntensity: bd.beatIntensity } : undefined); pp.render()
    }
    animationRef.current = requestAnimationFrame(draw)
  }, [visualType, getSmoothData, drawBars3D, drawParticles, drawWaveform3D, drawRadial3D, drawBleep, drawConcentric, drawCustom, customShader])

  // Initialize and cleanup
  useEffect(() => {
    if (isPlaying) {
      const success = initWebGL()
      if (success) {
        startTimeRef.current = Date.now(); isDrawingRef.current = true
        particlesRef.current = []; historyRef.current = new Array(128).fill(0); beatRef.current = 0; previousDataRef.current = []
        draw()
      }
    } else {
      isDrawingRef.current = false
      if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = undefined }
    }

    return () => {
      isDrawingRef.current = false
      if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = undefined }
      if (glRef.current && gradientTextureRef.current) { glRef.current.deleteTexture(gradientTextureRef.current); gradientTextureRef.current = null }
    }
  }, [isPlaying, initWebGL, draw])

  // Resize handler
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement
        if (container) {
          canvasRef.current.width = container.clientWidth
          canvasRef.current.height = container.clientHeight
          if (glRef.current) glRef.current.viewport(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
    }
    updateCanvasSize(); window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', backgroundColor: '#000' }} />
}

export default WebGLVisualiser
