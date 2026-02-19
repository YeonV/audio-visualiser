import { useRef, useEffect, useCallback } from 'react'
import type { Theme } from '@mui/material/styles'
import {
  createShader,
  createProgram,
  deleteProgramAndShaders,
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
  bladeTexterShader,
  plasmaWled2dShader,
  radialShader,
  soapShader,
  waterfallShader,
  imageShader
} from '../../engines/webgl/shaders'
import type { WebGLVisualiserId } from '../../_generated/webgl'
import { parseGradient } from '../../utils/gradient'
import { useStore } from '../../store'

export type WebGLVisualisationType = WebGLVisualiserId

interface PostProcessingControls {
  getInputFramebuffer: () => WebGLFramebuffer | null
  render: (width?: number, height?: number) => void
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
  index: number
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
  const globalSmoothing = useStore(state => state.globalSmoothing)
  const whiteCircleFix = useStore(state => state.whiteCircleFix)
  const outerGlowMode = useStore(state => state.outerGlowMode)
  const textAutoFit = useStore(state => state.textAutoFit)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const melbankTextureRef = useRef<WebGLTexture | null>(null)
  const historyTextureRef = useRef<WebGLTexture | null>(null)
  const gradientTextureRef = useRef<WebGLTexture | null>(null)
  const gradientTexture2Ref = useRef<WebGLTexture | null>(null)
  const textTextureRef = useRef<WebGLTexture | null>(null)
  const textTexture2Ref = useRef<WebGLTexture | null>(null)
  const currentGradientStrRef = useRef<string | null>(null)
  const currentGradient2StrRef = useRef<string | null>(null)
  const currentTextKeyRef = useRef<string | null>(null)
  const currentTextKey2Ref = useRef<string | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number>(performance.now())
  const previousDataRef = useRef<number[] | Float32Array>([])
  const particlesRef = useRef<Particle[]>([])
  const historyRef = useRef<number[]>(new Array(128).fill(0))
  const beatRef = useRef<number>(0)
  const audioDataRef = useRef<number[] | Float32Array>([])
  const isDrawingRef = useRef<boolean>(false)
  const themeColorsRef = useRef({ primary: [0, 0, 0], secondary: [0, 0, 0] })
  const lastFrameTimeRef = useRef<number>(performance.now())
  const lastContextRef = useRef<WebGLRenderingContext | null>(null)

  // Resource management
  const buffersRef = useRef<Map<string, WebGLBuffer>>(new Map())
  const quadBufferRef = useRef<WebGLBuffer | null>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const smoothedDataArrayRef = useRef<Float32Array | null>(null)
  const melbankArrayRef = useRef<Uint8Array | null>(null)
  const textStateRef = useRef({ aspect: 1.0, texW: 0, texH: 0 })
  const textState2Ref = useRef({ aspect: 1.0, texW: 0, texH: 0 })
  const typedArraysRef = useRef<Map<string, any>>(new Map())

  const getTypedArray = useCallback((name: string, length: number, Type: any = Float32Array) => {
    let arr = typedArraysRef.current.get(name)
    if (!arr || arr.length !== length) {
      arr = new Type(length)
      typedArraysRef.current.set(name, arr)
    }
    return arr
  }, [])

  const getBuffer = useCallback((gl: WebGLRenderingContext, name: string) => {
    let buffer = buffersRef.current.get(name)
    if (!buffer) {
      buffer = gl.createBuffer() as WebGLBuffer
      buffersRef.current.set(name, buffer)
    }
    return buffer
  }, [])

  const postProcessingRef = useRef(postProcessing)
  const postProcessingEnabledRef = useRef(postProcessingEnabled)
  const onContextCreatedRef = useRef(onContextCreated)
  const beatDataRef = useRef(beatData)
  const frequencyBandsRef = useRef(frequencyBands)
  const configRef = useRef(config)
  const visualTypeRef = useRef(visualType)

  // Uniform location cache
  const locationsRef = useRef<Record<string, WebGLUniformLocation | null>>({})
  const attribLocationsRef = useRef<Record<string, number>>({})
  const zeroArrayRef = useRef<Float32Array | null>(null)

  // Keep refs in sync
  useEffect(() => {
    postProcessingRef.current = postProcessing
    postProcessingEnabledRef.current = postProcessingEnabled
    onContextCreatedRef.current = onContextCreated
    beatDataRef.current = beatData
    frequencyBandsRef.current = frequencyBands
    configRef.current = config
    audioDataRef.current = audioData
    visualTypeRef.current = visualType
  }, [postProcessing, postProcessingEnabled, onContextCreated, beatData, frequencyBands, config, audioData, visualType])

  const globalSmoothingRef = useRef(globalSmoothing)
  const whiteCircleFixRef = useRef(whiteCircleFix)
  const outerGlowModeRef = useRef(outerGlowMode)
  const textAutoFitRef = useRef(textAutoFit)

  useEffect(() => {
    globalSmoothingRef.current = globalSmoothing
    whiteCircleFixRef.current = whiteCircleFix
  }, [globalSmoothing, whiteCircleFix])

  // Update theme colors
  useEffect(() => {
    themeColorsRef.current = {
      primary: hexToRgb(theme?.palette?.primary?.main || '#1976d2'),
      secondary: hexToRgb(theme?.palette?.secondary?.main || '#dc004e')
    }
  }, [theme?.palette?.primary?.main, theme?.palette?.secondary?.main])

  const getLoc = useCallback((name: string) => {
    if (locationsRef.current[name] !== undefined) return locationsRef.current[name]
    if (!glRef.current || !programRef.current) return null
    const loc = glRef.current.getUniformLocation(programRef.current, name)
    locationsRef.current[name] = loc
    return loc
  }, [])

  const getAttribLoc = useCallback((name: string) => {
    if (attribLocationsRef.current[name] !== undefined) return attribLocationsRef.current[name]
    if (!glRef.current || !programRef.current) return -1
    const loc = glRef.current.getAttribLocation(programRef.current, name)
    attribLocationsRef.current[name] = loc
    return loc
  }, [])

  // Helper to handle text texture
  const handleTextTexture = useCallback((gl: WebGLRenderingContext, cfg: any) => {
    const fontSize = 180;
    const canvasW = gl.canvas ? gl.canvas.width : 1000;
    const canvasH = gl.canvas ? gl.canvas.height : 500;
    const texW = Math.max(2000, canvasW * 2);
    const texH = Math.max(1000, canvasH * 2);

    const processLayer = (idx: number, text: string, font: string, color: string, textureRef: React.MutableRefObject<WebGLTexture | null>, keyRef: React.MutableRefObject<string | null>, stateRef: React.MutableRefObject<{ aspect: number; texW: number; texH: number }>) => {
      const key = `${text}-${font}-${color}-${textAutoFitRef.current ? 'autofit' : 'fixed'}-${texW}x${texH}`;
      const texUnit = idx === 1 ? gl.TEXTURE2 : gl.TEXTURE3;

      const drawTextToTexture = () => {
        if (!textureRef.current) textureRef.current = gl.createTexture();
        if (!offscreenCanvasRef.current) offscreenCanvasRef.current = document.createElement('canvas');
        const outCanvas = offscreenCanvasRef.current;

        const ctx = outCanvas.getContext('2d');
        if (ctx) {
          ctx.font = `${fontSize}px "${font}", Arial`;
          const metrics = ctx.measureText(text);
          let targetW = texW;
          if (textAutoFitRef.current) {
            targetW = Math.max(2000, metrics.width + 100);
          }

          outCanvas.width = targetW;
          outCanvas.height = texH;

          // Reset context properties after resize
          ctx.clearRect(0, 0, targetW, texH);
          ctx.font = `${fontSize}px "${font}", Arial`;
          ctx.fillStyle = color;
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          ctx.fillText(text, 0, 0);

          gl.activeTexture(texUnit);
          gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, outCanvas);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          stateRef.current.aspect = targetW / texH;
        }
      };

      if (keyRef.current !== key || stateRef.current.texW !== texW) {
        keyRef.current = key;
        stateRef.current.texW = texW;
        stateRef.current.texH = texH;
        if (document.fonts && document.fonts.load) {
          document.fonts.load(`${fontSize}px "${font}"`).then(() => drawTextToTexture());
        } else {
          drawTextToTexture();
        }
      }

      const locName = idx === 1 ? 'u_textTexture' : 'u_textTexture2';
      const aspectName = idx === 1 ? 'u_textAspect' : 'u_textAspect2';
      const textLoc = getLoc(locName);
      if (textLoc) {
        gl.activeTexture(texUnit);
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.uniform1i(textLoc, idx === 1 ? 2 : 3);
        gl.uniform1f(getLoc(aspectName), stateRef.current.aspect);
      }
    };

    processLayer(1, cfg.text || 'LedFx', cfg.font || 'Press Start 2P', cfg.text_color || '#FFFFFF', textTextureRef, currentTextKeyRef, textStateRef);
    if (visualTypeRef.current === 'bladeTexter') {
      processLayer(2, cfg.text2 || 'LedFx', cfg.font2 || 'Press Start 2P', cfg.text_color2 || '#FFFFFF', textTexture2Ref, currentTextKey2Ref, textState2Ref);
    }
  }, [getLoc])

  // Helper to handle gradient uniforms
  const handleGradients = useCallback((gl: WebGLRenderingContext, cfg: any) => {
    // Layer 1
    const useGradLoc = getLoc('u_useGradient')
    const gradLoc = getLoc('u_gradient')
    const gradRollLoc = getLoc('u_gradientRoll')

    if (gradLoc && cfg.gradient) {
      if (!gradientTextureRef.current) {
        gradientTextureRef.current = gl.createTexture()
        currentGradientStrRef.current = null
      }
      if (currentGradientStrRef.current !== cfg.gradient) {
        const gradData = parseGradient(cfg.gradient); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gradientTextureRef.current)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gradData)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        currentGradientStrRef.current = cfg.gradient
      }
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gradientTextureRef.current); gl.uniform1i(gradLoc, 1)
      if (useGradLoc) gl.uniform1i(useGradLoc, 1)
      if (gradRollLoc) {
        const rollSpeed = cfg.gradient_roll ?? 0
        gl.uniform1f(gradRollLoc, ((performance.now() - startTimeRef.current) / 1000 * rollSpeed) % 1.0)
      }
    } else if (useGradLoc) {
      gl.uniform1i(useGradLoc, 0)
    }

    // Layer 2 (BladeTexter)
    const useGrad2Loc = getLoc('u_useGradient2')
    const grad2Loc = getLoc('u_gradient2')
    const gradRoll2Loc = getLoc('u_gradientRoll2')

    if (grad2Loc && cfg.gradient2) {
      if (!gradientTexture2Ref.current) {
        gradientTexture2Ref.current = gl.createTexture()
        currentGradient2StrRef.current = null
      }
      if (currentGradient2StrRef.current !== cfg.gradient2) {
        const gradData = parseGradient(cfg.gradient2); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, gradientTexture2Ref.current)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gradData)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        currentGradient2StrRef.current = cfg.gradient2
      }
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, gradientTexture2Ref.current); gl.uniform1i(grad2Loc, 4)
      if (useGrad2Loc) gl.uniform1i(useGrad2Loc, 1)
      if (gradRoll2Loc) {
        const rollSpeed = cfg.gradient_roll2 ?? 0
        gl.uniform1f(gradRoll2Loc, ((performance.now() - startTimeRef.current) / 1000 * rollSpeed) % 1.0)
      }
    } else if (useGrad2Loc) {
      gl.uniform1i(useGrad2Loc, 0)
    }
  }, [getLoc])

  // Initialize WebGL
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false

    const gl = glRef.current || canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    })

    if (!gl) {
      console.error('WebGL not supported')
      return false
    }

    glRef.current = gl
    locationsRef.current = {} // Clear cache

    if (programRef.current) {
      deleteProgramAndShaders(gl, programRef.current)
      programRef.current = null
    }

    // Initialize quad buffer if needed
    if (!quadBufferRef.current) {
      quadBufferRef.current = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBufferRef.current)
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    }

    let vertexSource = vertexShaderSource
    let fragmentSource = customShader || fragmentShaderSource

    if (!customShader) {
      const type = visualType
      if (type === 'particles') {
        vertexSource = particleVertexShader
        fragmentSource = particleFragmentShader
      } else if (type === 'radial3d') {
        fragmentSource = spectrumFragmentShader
      } else if (type === 'bleep') {
        vertexSource = quadVertexShader
        fragmentSource = bleepFragmentShader
      } else if (type === 'concentric') {
        vertexSource = quadVertexShader
        fragmentSource = concentricFragmentShader
      } else if (type === 'gif') {
        vertexSource = quadVertexShader
        fragmentSource = gifFragmentShader
      } else if (type === 'matrix') {
        vertexSource = quadVertexShader
        fragmentSource = matrixRainShader
      } else if (type === 'terrain') {
        vertexSource = quadVertexShader
        fragmentSource = terrainShader
      } else if (type === 'geometric') {
        vertexSource = quadVertexShader
        fragmentSource = geometricShader
      } else if (type === 'gameoflife') {
        vertexSource = quadVertexShader
        fragmentSource = gameOfLifeShader
      } else if (type === 'digitalrain') {
        vertexSource = quadVertexShader
        fragmentSource = digitalRainShader
      } else if (type === 'flame') {
        vertexSource = quadVertexShader
        fragmentSource = flameShader
      } else if (type === 'plasma2d') {
        vertexSource = quadVertexShader
        fragmentSource = plasma2dShader
      } else if (type === 'equalizer2d') {
        vertexSource = quadVertexShader
        fragmentSource = equalizer2dShader
      } else if (type === 'noise2d') {
        vertexSource = quadVertexShader
        fragmentSource = noise2dShader
      } else if (type === 'blender') {
        vertexSource = quadVertexShader
        fragmentSource = blenderShader
      } else if (type === 'clone') {
        vertexSource = quadVertexShader
        fragmentSource = cloneShader
      } else if (type === 'bands') {
        vertexSource = quadVertexShader
        fragmentSource = bandsShader
      } else if (type === 'bandsmatrix') {
        vertexSource = quadVertexShader
        fragmentSource = bandsMatrixShader
      } else if (type === 'blocks') {
        vertexSource = quadVertexShader
        fragmentSource = blocksShader
      } else if (type === 'keybeat2d') {
        vertexSource = quadVertexShader
        fragmentSource = keybeat2dShader
      } else if (type === 'texter') {
        vertexSource = quadVertexShader
        fragmentSource = texterShader
      } else if (type === 'bladeTexter') {
        vertexSource = quadVertexShader
        fragmentSource = bladeTexterShader
      } else if (type === 'plasmawled2d') {
        vertexSource = quadVertexShader
        fragmentSource = plasmaWled2dShader
      } else if (type === 'radial') {
        vertexSource = quadVertexShader
        fragmentSource = radialShader
      } else if (type === 'soap') {
        vertexSource = quadVertexShader
        fragmentSource = soapShader
      } else if (type === 'waterfall') {
        vertexSource = quadVertexShader
        fragmentSource = waterfallShader
      } else if (type === 'image') {
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

    if (onContextCreatedRef.current && lastContextRef.current !== gl) {
      lastContextRef.current = gl
      onContextCreatedRef.current(gl, canvas)
    }

    return true
  }, [customShader, visualType])

  // Apply smoothing
  const getSmoothData = useCallback(
    (data: number[] | Float32Array): number[] | Float32Array => {
      const smoothing = globalSmoothingRef.current
      const length = data.length;

      if (!smoothedDataArrayRef.current || smoothedDataArrayRef.current.length !== length) {
        smoothedDataArrayRef.current = new Float32Array(data);
        return smoothedDataArrayRef.current;
      }

      const smoothed = smoothedDataArrayRef.current;
      for (let i = 0; i < length; i++) {
        smoothed[i] = smoothed[i] * smoothing + data[i] * (1 - smoothing);
      }

      return smoothed;
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

      const posArr = getTypedArray('bars3d_pos_arr', bufferLength * 12 * 2)
      const ampArr = getTypedArray('bars3d_amp_arr', bufferLength * 12)
      const idxArr = getTypedArray('bars3d_idx_arr', bufferLength * 12)

      for (let i = 0; i < bufferLength; i++) {
        const amplitude = Math.min(data[i] * sensitivity * 0.5, 1)
        const barHeight = amplitude * height
        const x = i * barWidth
        const w = barWidth - 2
        const depth = amplitude * 20

        const vOffset = i * 24
        const aOffset = i * 12
        const iVal = i / bufferLength

        // Triangle 1
        posArr[vOffset] = x; posArr[vOffset+1] = height
        posArr[vOffset+2] = x + w; posArr[vOffset+3] = height
        posArr[vOffset+4] = x + w; posArr[vOffset+5] = height - barHeight
        // Triangle 2
        posArr[vOffset+6] = x; posArr[vOffset+7] = height
        posArr[vOffset+8] = x + w; posArr[vOffset+9] = height - barHeight
        posArr[vOffset+10] = x; posArr[vOffset+11] = height - barHeight

        // Triangle 3 (side/depth)
        posArr[vOffset+12] = x; posArr[vOffset+13] = height - barHeight
        posArr[vOffset+14] = x + w; posArr[vOffset+15] = height - barHeight
        posArr[vOffset+16] = x + w + depth; posArr[vOffset+17] = height - barHeight - depth
        // Triangle 4
        posArr[vOffset+18] = x; posArr[vOffset+19] = height - barHeight
        posArr[vOffset+20] = x + w + depth; posArr[vOffset+21] = height - barHeight - depth
        posArr[vOffset+22] = x + depth; posArr[vOffset+23] = height - barHeight - depth

        for (let j = 0; j < 12; j++) {
          ampArr[aOffset + j] = amplitude
          idxArr[aOffset + j] = iVal
        }
      }

      const positionBuffer = getBuffer(gl, 'bars3d_pos')
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, posArr, gl.DYNAMIC_DRAW)
      const positionLoc = getAttribLoc('a_position')
      if (positionLoc !== -1) {
        gl.enableVertexAttribArray(positionLoc)
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
      }

      const amplitudeBuffer = getBuffer(gl, 'bars3d_amp')
      gl.bindBuffer(gl.ARRAY_BUFFER, amplitudeBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, ampArr, gl.DYNAMIC_DRAW)
      const amplitudeLoc = getAttribLoc('a_amplitude')
      if (amplitudeLoc !== -1) {
        gl.enableVertexAttribArray(amplitudeLoc)
        gl.vertexAttribPointer(amplitudeLoc, 1, gl.FLOAT, false, 0, 0)
      }

      const indexBuffer = getBuffer(gl, 'bars3d_idx')
      gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, idxArr, gl.DYNAMIC_DRAW)
      const indexLoc = getAttribLoc('a_index')
      if (indexLoc !== -1) {
        gl.enableVertexAttribArray(indexLoc)
        gl.vertexAttribPointer(indexLoc, 1, gl.FLOAT, false, 0, 0)
      }

      gl.uniform2f(getLoc('u_resolution'), width, height)
      gl.uniform1f(getLoc('u_time'), (performance.now() - startTimeRef.current) / 1000)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(getLoc('u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(getLoc('u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      handleGradients(gl, cfg)

      gl.drawArrays(gl.TRIANGLES, 0, bufferLength * 12)
      gl.disableVertexAttribArray(positionLoc)
      if (amplitudeLoc !== -1) gl.disableVertexAttribArray(amplitudeLoc)
      if (indexLoc !== -1) gl.disableVertexAttribArray(indexLoc)
    },
    [getLoc, getAttribLoc, handleGradients, getBuffer, getTypedArray]
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
          amplitude: amp,
          index: freqIndex / data.length
        })
      }

      const dt = 0.016
      const particles = particlesRef.current
      let activeCount = 0
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx * 60 * dt
        p.y += p.vy * 60 * dt
        p.vy -= 0.1
        p.life += dt * 0.5

        if (p.life < 1 && p.y > 0 && p.x > 0 && p.x < width) {
          if (activeCount !== i) {
            particles[activeCount] = p
          }
          activeCount++
        }
      }
      if (particles.length !== activeCount) {
        particles.length = activeCount
      }

      if (activeCount === 0) return

      const posArr = getTypedArray('part_pos_arr', activeCount * 2)
      const velArr = getTypedArray('part_vel_arr', activeCount * 2)
      const lifeArr = getTypedArray('part_life_arr', activeCount)
      const sizeArr = getTypedArray('part_size_arr', activeCount)
      const ampArr = getTypedArray('part_amp_arr', activeCount)
      const idxArr = getTypedArray('part_idx_arr', activeCount)

      for (let i = 0; i < activeCount; i++) {
        const p = particles[i]
        posArr[i * 2] = p.x; posArr[i * 2 + 1] = p.y
        velArr[i * 2] = p.vx; velArr[i * 2 + 1] = p.vy
        lifeArr[i] = p.life
        sizeArr[i] = p.size
        ampArr[i] = p.amplitude
        idxArr[i] = p.index
      }

      const posBuf = getBuffer(gl, 'part_pos'); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, posArr, gl.DYNAMIC_DRAW)
      const posLoc = getAttribLoc('a_position'); if (posLoc !== -1) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0) }

      const velBuf = getBuffer(gl, 'part_vel'); gl.bindBuffer(gl.ARRAY_BUFFER, velBuf); gl.bufferData(gl.ARRAY_BUFFER, velArr, gl.DYNAMIC_DRAW)
      const velLoc = getAttribLoc('a_velocity'); if (velLoc !== -1) { gl.enableVertexAttribArray(velLoc); gl.vertexAttribPointer(velLoc, 2, gl.FLOAT, false, 0, 0) }

      const lifeBuf = getBuffer(gl, 'part_life'); gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuf); gl.bufferData(gl.ARRAY_BUFFER, lifeArr, gl.DYNAMIC_DRAW)
      const lifeLoc = getAttribLoc('a_life'); if (lifeLoc !== -1) { gl.enableVertexAttribArray(lifeLoc); gl.vertexAttribPointer(lifeLoc, 1, gl.FLOAT, false, 0, 0) }

      const sizeBuf = getBuffer(gl, 'part_size'); gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf); gl.bufferData(gl.ARRAY_BUFFER, sizeArr, gl.DYNAMIC_DRAW)
      const sizeLoc = getAttribLoc('a_size'); if (sizeLoc !== -1) { gl.enableVertexAttribArray(sizeLoc); gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0) }

      const ampBuf = getBuffer(gl, 'part_amp'); gl.bindBuffer(gl.ARRAY_BUFFER, ampBuf); gl.bufferData(gl.ARRAY_BUFFER, ampArr, gl.DYNAMIC_DRAW)
      const ampLoc = getAttribLoc('a_amplitude'); if (ampLoc !== -1) { gl.enableVertexAttribArray(ampLoc); gl.vertexAttribPointer(ampLoc, 1, gl.FLOAT, false, 0, 0) }

      const idxBuf = getBuffer(gl, 'part_idx'); gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ARRAY_BUFFER, idxArr, gl.DYNAMIC_DRAW)
      const idxLoc = getAttribLoc('a_index'); if (idxLoc !== -1) { gl.enableVertexAttribArray(idxLoc); gl.vertexAttribPointer(idxLoc, 1, gl.FLOAT, false, 0, 0) }

      gl.uniform2f(getLoc('u_resolution'), width, height)
      gl.uniform1f(getLoc('u_time'), (performance.now() - startTimeRef.current) / 1000)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(getLoc('u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(getLoc('u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      handleGradients(gl, cfg)

      gl.drawArrays(gl.POINTS, 0, particlesRef.current.length)
      gl.disableVertexAttribArray(posLoc); if (velLoc !== -1) gl.disableVertexAttribArray(velLoc); if (lifeLoc !== -1) gl.disableVertexAttribArray(lifeLoc); if (sizeLoc !== -1) gl.disableVertexAttribArray(sizeLoc); if (ampLoc !== -1) gl.disableVertexAttribArray(ampLoc); if (idxLoc !== -1) gl.disableVertexAttribArray(idxLoc)
    },
    [getLoc, getAttribLoc, handleGradients, getBuffer, getTypedArray]
  )

  // Draw radial visualization
  const drawRadial3D = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const centerX = width / 2, centerY = height / 2, baseRadius = Math.min(width, height) / 4
      const bufferLength = data.length

      const posArr = getTypedArray('radial_pos_arr', bufferLength * 6 * 2)
      const ampArr = getTypedArray('radial_amp_arr', bufferLength * 6)
      const idxArr = getTypedArray('radial_idx_arr', bufferLength * 6)

      for (let i = 0; i < bufferLength; i++) {
        const amplitude = Math.min(data[i] * sensitivity * 0.5, 1)
        const angle = (i / bufferLength) * Math.PI * 2, nextAngle = ((i + 1) / bufferLength) * Math.PI * 2
        const innerRadius = baseRadius, outerRadius = baseRadius + amplitude * baseRadius
        const x1 = centerX + Math.cos(angle) * innerRadius, y1 = centerY + Math.sin(angle) * innerRadius
        const x2 = centerX + Math.cos(angle) * outerRadius, y2 = centerY + Math.sin(angle) * outerRadius
        const x3 = centerX + Math.cos(nextAngle) * outerRadius, y3 = centerY + Math.sin(nextAngle) * outerRadius
        const x4 = centerX + Math.cos(nextAngle) * innerRadius, y4 = centerY + Math.sin(nextAngle) * innerRadius

        const vOffset = i * 12
        const aOffset = i * 6
        const iVal = i / bufferLength

        posArr[vOffset] = x1; posArr[vOffset+1] = y1
        posArr[vOffset+2] = x2; posArr[vOffset+3] = y2
        posArr[vOffset+4] = x3; posArr[vOffset+5] = y3
        posArr[vOffset+6] = x1; posArr[vOffset+7] = y1
        posArr[vOffset+8] = x3; posArr[vOffset+9] = y3
        posArr[vOffset+10] = x4; posArr[vOffset+11] = y4

        for (let j = 0; j < 6; j++) {
          ampArr[aOffset + j] = amplitude
          idxArr[aOffset + j] = iVal
        }
      }

      const posBuf = getBuffer(gl, 'radial_pos'); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, posArr, gl.DYNAMIC_DRAW)
      const posLoc = getAttribLoc('a_position'); if (posLoc !== -1) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0) }

      const ampBuf = getBuffer(gl, 'radial_amp'); gl.bindBuffer(gl.ARRAY_BUFFER, ampBuf);
      gl.bufferData(gl.ARRAY_BUFFER, ampArr, gl.DYNAMIC_DRAW)
      const ampLoc = getAttribLoc('a_amplitude'); if (ampLoc !== -1) { gl.enableVertexAttribArray(ampLoc); gl.vertexAttribPointer(ampLoc, 1, gl.FLOAT, false, 0, 0) }

      const idxBuf = getBuffer(gl, 'radial_idx'); gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf);
      gl.bufferData(gl.ARRAY_BUFFER, idxArr, gl.DYNAMIC_DRAW)
      const idxLoc = getAttribLoc('a_index'); if (idxLoc !== -1) { gl.enableVertexAttribArray(idxLoc); gl.vertexAttribPointer(idxLoc, 1, gl.FLOAT, false, 0, 0) }

      gl.uniform2f(getLoc('u_resolution'), width, height)
      gl.uniform1f(getLoc('u_time'), (performance.now() - startTimeRef.current) / 1000)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(getLoc('u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(getLoc('u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      handleGradients(gl, cfg)

      gl.drawArrays(gl.TRIANGLES, 0, bufferLength * 6)
      gl.disableVertexAttribArray(posLoc); if (ampLoc !== -1) gl.disableVertexAttribArray(ampLoc); if (idxLoc !== -1) gl.disableVertexAttribArray(idxLoc)
    },
    [getLoc, getAttribLoc, handleGradients, getBuffer, getTypedArray]
  )

  // Draw waveform with 3D effect
  const drawWaveform3D = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const bufferLength = data.length, sliceWidth = width / bufferLength, centerY = height / 2

      const posArr = getTypedArray('wave_pos_arr', (bufferLength - 1) * 6 * 2)
      const ampArr = getTypedArray('wave_amp_arr', (bufferLength - 1) * 6)
      const idxArr = getTypedArray('wave_idx_arr', (bufferLength - 1) * 6)

      for (let i = 0; i < bufferLength - 1; i++) {
        const amp1 = data[i] * sensitivity * 0.3, amp2 = data[i + 1] * sensitivity * 0.3
        const x1 = i * sliceWidth, x2 = (i + 1) * sliceWidth, y1 = centerY + (amp1 - 0.5) * height * 0.8

        const vOffset = i * 12
        const aOffset = i * 6
        const iVal = i / bufferLength
        const avgAmp = (amp1 + amp2) / 2

        posArr[vOffset] = x1; posArr[vOffset+1] = centerY
        posArr[vOffset+2] = x1; posArr[vOffset+3] = y1
        posArr[vOffset+4] = x2; posArr[vOffset+5] = y1
        posArr[vOffset+6] = x1; posArr[vOffset+7] = centerY
        posArr[vOffset+8] = x2; posArr[vOffset+9] = y1
        posArr[vOffset+10] = x2; posArr[vOffset+11] = centerY

        for (let j = 0; j < 6; j++) {
          ampArr[aOffset + j] = avgAmp
          idxArr[aOffset + j] = iVal
        }
      }

      const posBuf = getBuffer(gl, 'wave_pos'); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, posArr, gl.DYNAMIC_DRAW)
      const posLoc = getAttribLoc('a_position'); if (posLoc !== -1) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0) }

      const ampBuf = getBuffer(gl, 'wave_amp'); gl.bindBuffer(gl.ARRAY_BUFFER, ampBuf);
      gl.bufferData(gl.ARRAY_BUFFER, ampArr, gl.DYNAMIC_DRAW)
      const ampLoc = getAttribLoc('a_amplitude'); if (ampLoc !== -1) { gl.enableVertexAttribArray(ampLoc); gl.vertexAttribPointer(ampLoc, 1, gl.FLOAT, false, 0, 0) }

      const idxBuf = getBuffer(gl, 'wave_idx'); gl.bindBuffer(gl.ARRAY_BUFFER, idxBuf);
      gl.bufferData(gl.ARRAY_BUFFER, idxArr, gl.DYNAMIC_DRAW)
      const idxLoc = getAttribLoc('a_index'); if (idxLoc !== -1) { gl.enableVertexAttribArray(idxLoc); gl.vertexAttribPointer(idxLoc, 1, gl.FLOAT, false, 0, 0) }

      gl.uniform2f(getLoc('u_resolution'), width, height)
      gl.uniform1f(getLoc('u_time'), (performance.now() - startTimeRef.current) / 1000)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(getLoc('u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(getLoc('u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      handleGradients(gl, cfg)

      gl.drawArrays(gl.TRIANGLES, 0, (bufferLength - 1) * 6)
      gl.disableVertexAttribArray(posLoc); if (ampLoc !== -1) gl.disableVertexAttribArray(ampLoc); if (idxLoc !== -1) gl.disableVertexAttribArray(idxLoc)
    },
    [getLoc, getAttribLoc, handleGradients, getBuffer, getTypedArray]
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

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBufferRef.current)
      const posLoc = getAttribLoc('a_position'); if (posLoc !== -1) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0) }

      if (!historyTextureRef.current) historyTextureRef.current = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, historyTextureRef.current)
      const textureData = getTypedArray('bleep_hist_arr', historyRef.current.length, Uint8Array)
      for (let i = 0; i < historyRef.current.length; i++) textureData[i] = Math.min(255, Math.max(0, historyRef.current[i] * 255))
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, historyRef.current.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, textureData)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      gl.uniform2f(getLoc('u_resolution'), width, height)
      gl.uniform1f(getLoc('u_time'), ((performance.now() - startTimeRef.current) / 1000) * speed)
      gl.uniform1i(getLoc('u_history'), 0)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(getLoc('u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(getLoc('u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      handleGradients(gl, cfg)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.disableVertexAttribArray(posLoc)
    },
    [getLoc, getAttribLoc, handleGradients, getTypedArray]
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

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBufferRef.current)
      const posLoc = getAttribLoc('a_position'); if (posLoc !== -1) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0) }

      gl.uniform2f(getLoc('u_resolution'), width, height)
      gl.uniform1f(getLoc('u_time'), (performance.now() - startTimeRef.current) / 1000)
      gl.uniform1f(getLoc('u_beat'), beatRef.current)
      const scaleLoc = getLoc('u_scale'); if (scaleLoc) gl.uniform1f(scaleLoc, scale)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(getLoc('u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(getLoc('u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      handleGradients(gl, cfg)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.disableVertexAttribArray(posLoc)
    },
    [getLoc, getAttribLoc, handleGradients]
  )

  // Draw Custom / GIF / Matrix Effects
  const drawCustom = useCallback(
    (gl: WebGLRenderingContext, data: number[] | Float32Array, width: number, height: number) => {
      const program = programRef.current
      if (!program) return
      const cfg = configRef.current
      const currentVisualType = visualTypeRef.current

      const sensitivity = cfg.audioSensitivity ?? cfg.sensitivity ?? cfg.multiplier ?? 1.0
      const avg = (data as any).reduce((a: number, b: number) => a + b, 0) / data.length

      const rotation = cfg.rotate ? cfg.rotate * (Math.PI / 180) : 0
      const brightness = cfg.brightness ?? 1.0
      const fps = cfg.gif_fps ?? 30
      const speed = fps / 30.0

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBufferRef.current)
      const posLoc = getAttribLoc('a_position'); if (posLoc !== -1) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0) }

      gl.uniform2f(getLoc('u_resolution'), width, height)
      const timeLoc = getLoc('u_time'); if (timeLoc) {
        const actualSpeed = cfg.speed ?? speed
        gl.uniform1f(timeLoc, ((performance.now() - startTimeRef.current) / 1000) * actualSpeed)
      }
      gl.uniform1f(getLoc('u_energy'), avg * sensitivity)

      const fixMode = whiteCircleFixRef.current === 'original' ? 0 : (whiteCircleFixRef.current === 'energy' ? 1 : 2)
      const fixModeLoc = getLoc('u_fixMode'); if (fixModeLoc) gl.uniform1i(fixModeLoc, fixMode)

      const beatLoc = getLoc('u_beat'); if (beatLoc) {
        const currentBeatData = beatDataRef.current
        const beatIntensity = currentBeatData ? currentBeatData.beatIntensity : avg * sensitivity

        if (whiteCircleFixRef.current === 'clamp') {
          // Pass normalized instantaneous intensity for Alternative Fix
          gl.uniform1f(beatLoc, Math.min(1.0, beatIntensity))
        } else {
          // Pass cumulative beat for Original and Energy modes
          if (currentBeatData) beatRef.current += currentBeatData.beatIntensity * 0.2
          else beatRef.current += avg * sensitivity * 0.1
          gl.uniform1f(beatLoc, beatRef.current)
        }
      }
      // Rotate: 360 degrees to radians
      const rotateValue = cfg.rotate ?? 0
      const radians = rotateValue * Math.PI / 180
      gl.uniform1f(getLoc('u_rotate'), radians)

      gl.uniform1i(getLoc('u_flipH'), cfg.flip_horizontal ? 1 : 0)
      gl.uniform1i(getLoc('u_flipV'), cfg.flip_vertical ? 1 : 0)
      gl.uniform1f(getLoc('u_brightness'), brightness)

      const primaryColor = cfg.primaryColor ? hexToRgb(cfg.primaryColor) : themeColorsRef.current.primary
      const secondaryColor = cfg.secondaryColor ? hexToRgb(cfg.secondaryColor) : themeColorsRef.current.secondary
      gl.uniform3f(getLoc('u_primaryColor'), primaryColor[0], primaryColor[1], primaryColor[2])
      gl.uniform3f(getLoc('u_secondaryColor'), secondaryColor[0], secondaryColor[1], secondaryColor[2])

      const freqBands = frequencyBandsRef.current
      const bass = freqBands?.bass ?? avg, mid = freqBands?.mid ?? avg, high = freqBands?.high ?? avg
      gl.uniform1f(getLoc('u_bass'), bass * sensitivity)
      gl.uniform1f(getLoc('u_mid'), mid * sensitivity)
      gl.uniform1f(getLoc('u_high'), high * sensitivity)

      const glowMode = outerGlowModeRef.current === 'original' ? 0 : 1
      const glowLoc = getLoc('u_outerGlowMode'); if (glowLoc) gl.uniform1i(glowLoc, glowMode)

      // Game of Life
      gl.uniform1f(getLoc('u_cellSize'), cfg.cell_size ?? cfg.base_game_speed ?? 8.0)
      gl.uniform1f(getLoc('u_injectBeat'), beatDataRef.current?.isBeat && cfg.beat_inject !== false ? 1.0 : 0.0)

      // Digital Rain
      gl.uniform1f(getLoc('u_density'), cfg.count ?? cfg.density ?? 1.9)
      const spdLoc = getLoc('u_speed'); if (spdLoc) {
        const s = cfg.add_speed ? cfg.add_speed / 20.0 : (cfg.run_seconds ? 2.0 / cfg.run_seconds : 1.5)
        gl.uniform1f(spdLoc, s)
      }
      gl.uniform1f(getLoc('u_tailLength'), (cfg.tail ?? 67) / 100.0)
      gl.uniform1f(getLoc('u_glowIntensity'), cfg.multiplier ? cfg.multiplier / 10.0 : 1.0)

      // Flame
      const lcLoc = getLoc('u_lowColor'); if (lcLoc) { const c = hexToRgb(cfg.low_band ?? cfg.low_color ?? '#FF4400'); gl.uniform3f(lcLoc, c[0], c[1], c[2]) }
      const mcLoc = getLoc('u_midColor'); if (mcLoc) { const c = hexToRgb(cfg.mid_band ?? cfg.mid_color ?? '#FFAA00'); gl.uniform3f(mcLoc, c[0], c[1], c[2]) }
      const hcLoc = getLoc('u_highColor'); if (hcLoc) { const c = hexToRgb(cfg.high_band ?? cfg.high_color ?? '#FFFF00'); gl.uniform3f(hcLoc, c[0], c[1], c[2]) }
      gl.uniform1f(getLoc('u_intensity'), cfg.intensity ?? 1.0)
      gl.uniform1f(getLoc('u_wobble'), cfg.wobble ?? 0.1)

      // Plasma
      gl.uniform1f(getLoc('u_twist'), cfg.twist ?? 0.1)

      // Equalizer
      gl.uniform1f(getLoc('u_bands'), cfg.bands ?? 16.0)
      gl.uniform1f(getLoc('u_ringMode'), (cfg.ring || cfg.ring_mode) ? 1.0 : 0.0)
      gl.uniform1f(getLoc('u_centerMode'), (cfg.center || cfg.center_mode) ? 1.0 : 0.0)
      const sLoc = getLoc('u_spin'); if (sLoc) {
        if (cfg.spin || cfg.spin_enabled) beatRef.current += bass * (cfg.spin_multiplier ?? 1.0) * 0.05
        gl.uniform1f(sLoc, beatRef.current)
      }

      // Gradient support
      handleGradients(gl, cfg)

      const melBankLoc = getLoc('u_melbank')
      if (melBankLoc && data.length > 0) {
        if (!melbankTextureRef.current) melbankTextureRef.current = gl.createTexture()
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, melbankTextureRef.current)

        if (!melbankArrayRef.current || melbankArrayRef.current.length !== data.length) {
          melbankArrayRef.current = new Uint8Array(data.length);
        }
        const texData = melbankArrayRef.current;
        for (let i = 0; i < data.length; i++) texData[i] = Math.min(255, Math.max(0, data[i] * 255 * sensitivity))
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, data.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texData)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.uniform1i(melBankLoc, 0)
      }

      // Remaining uniforms
      gl.uniform1f(getLoc('u_zoom'), cfg.zoom ?? cfg.stretch ?? 3.0)
      gl.uniform1f(getLoc('u_audioZoom'), cfg.multiplier ?? cfg.audio_zoom ?? 1.0)
      gl.uniform1f(getLoc('u_blur'), cfg.mask_cutoff ?? cfg.blur ?? 0.5)
      gl.uniform1f(getLoc('u_mirrors'), cfg.screen ?? cfg.mirrors ?? 2.0)
      gl.uniform1f(getLoc('u_flip'), (cfg.align === 'invert' || cfg.flip) ? 1.0 : 0.0)
      gl.uniform1f(getLoc('u_blockSize'), cfg.block_count ?? cfg.block_size ?? 10.0)
      gl.uniform1f(getLoc('u_keys'), (cfg.stretch_horizontal / 6.25) || (cfg.keys ?? 16.0))
      if (currentVisualType === 'texter' || currentVisualType === 'bladeTexter') {
        // Native baseline: zoom, stretch_x, stretch_y, offset_x, offset_y are direct multipliers (1.0 = native, no inversion)
        const zoom = typeof cfg.zoom === 'number' ? cfg.zoom : 1.0;
        const stretchX = typeof cfg.stretch_x === 'number' ? cfg.stretch_x : 1.0;
        const stretchY = typeof cfg.stretch_y === 'number' ? cfg.stretch_y : 1.0;
        const offsetX = typeof cfg.offset_x === 'number' ? cfg.offset_x : 0.0;
        const offsetY = typeof cfg.offset_y === 'number' ? cfg.offset_y : 0.0;
        gl.uniform1f(getLoc('u_zoom'), zoom)
        gl.uniform1f(getLoc('u_squeezeX'), stretchX)
        gl.uniform1f(getLoc('u_squeezeY'), stretchY)
        gl.uniform1f(getLoc('u_offsetX'), offsetX)
        gl.uniform1f(getLoc('u_offsetY'), offsetY)

        const effectMap: Record<string, number> = { 'Side Scroll': 0, 'Spokes': 1, 'Carousel': 2, 'Wave': 3, 'Pulse': 4, 'Fade': 5 }
        gl.uniform1i(getLoc('u_textEffect'), effectMap[cfg.text_effect] ?? 0)
        gl.uniform1f(getLoc('u_speed'), cfg.speed_option_1 ?? 1.0)

        if (currentVisualType === 'bladeTexter') {
          gl.uniform1i(getLoc('u_textEffect2'), effectMap[cfg.text_effect2] ?? 0)
          gl.uniform1i(getLoc('u_flipH2'), cfg.flip_horizontal2 ? 1 : 0)
          gl.uniform1i(getLoc('u_flipV2'), cfg.flip_vertical2 ? 1 : 0)
          gl.uniform1f(getLoc('u_rotate2'), (cfg.rotate2 ?? 0) * Math.PI / 180)
          gl.uniform1f(getLoc('u_zoom2'), cfg.zoom2 ?? 1.0)
          gl.uniform1f(getLoc('u_squeezeX2'), cfg.stretch_x2 ?? 1.0)
          gl.uniform1f(getLoc('u_squeezeY2'), cfg.stretch_y2 ?? 1.0)
          gl.uniform1f(getLoc('u_offsetX2'), cfg.offset_x2 ?? 0.0)
          gl.uniform1f(getLoc('u_offsetY2'), cfg.offset_y2 ?? 0.0)
          gl.uniform1f(getLoc('u_speed2'), cfg.speed2 ?? 1.0)
        }

        handleTextTexture(gl, cfg)
      }
      if (currentVisualType === 'radial') gl.uniform1f(getLoc('u_bands'), cfg.edges || cfg.bands || 32.0)
      if (currentVisualType === 'bands' || currentVisualType === 'bandsmatrix') gl.uniform1f(getLoc('u_bands'), cfg.band_count || cfg.bands || 16.0)
      if (currentVisualType === 'waterfall') {
        gl.uniform1f(getLoc('u_bands'), cfg.bands || 16.0)
        gl.uniform1f(getLoc('u_speed'), (3.0 / cfg.drop_secs) || (cfg.speed ?? 1.0))
      }

      const bgcLoc = getLoc('u_bgColor'); if (bgcLoc) { const c = hexToRgb(cfg.bg_color ?? cfg.backgroundColor ?? '#000000'); gl.uniform3f(bgcLoc, c[0], c[1], c[2]) }
      gl.uniform1f(getLoc('u_backgroundBrightness'), cfg.background_brightness ?? 1.0)
      gl.uniform1f(getLoc('u_multiplier'), cfg.multiplier ?? 0.5)
      gl.uniform1f(getLoc('u_minSize'), cfg.min_size ?? 0.3)
      gl.uniform1f(getLoc('u_frequencyRange'), typeof cfg.frequency_range === 'number' ? cfg.frequency_range : 0.0)
      gl.uniform1f(getLoc('u_clip'), cfg.clip ? 1.0 : 0.0)
      if (currentVisualType === 'image') gl.uniform1f(getLoc('u_spin'), cfg.spin ? 1.0 : 0.0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.disableVertexAttribArray(posLoc)
    },
    [getLoc, getAttribLoc, handleGradients, handleTextTexture]
  )

  // Main draw function
  const draw = useCallback(() => {
    const gl = glRef.current; const canvas = canvasRef.current
    if (!gl || !canvas || !isDrawingRef.current) return
    const width = canvas.width, height = canvas.height

    // Always set viewport at the start of frame
    gl.viewport(0, 0, width, height)

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
    let smoothedData: number[] | Float32Array
    if (currentAudioData.length > 0) {
      smoothedData = getSmoothData(currentAudioData)
    } else {
      if (!zeroArrayRef.current) zeroArrayRef.current = new Float32Array(128).fill(0)
      smoothedData = zeroArrayRef.current
    }
    if (customShader) drawCustom(gl, smoothedData, width, height)
    else {
      switch (visualTypeRef.current) {
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
      const bd = beatDataRef.current; pp.updateTime(deltaTime, bd ? { isBeat: bd.isBeat, beatPhase: bd.beatPhase, beatIntensity: bd.beatIntensity } : undefined); pp.render(width, height)
    }
    animationRef.current = requestAnimationFrame(draw)
  }, [getSmoothData, drawBars3D, drawParticles, drawWaveform3D, drawRadial3D, drawBleep, drawConcentric, drawCustom, customShader])

  // Initialize and cleanup
  useEffect(() => {
    if (isPlaying) {
      const success = initWebGL()
      if (success) {
        startTimeRef.current = performance.now(); isDrawingRef.current = true
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
    }
  }, [isPlaying, initWebGL, draw])

  // Cleanup on unmount or visual type change
  useEffect(() => {
    const gl = glRef.current
    const buffers = buffersRef.current
    const typedArrays = typedArraysRef.current
    const gradTexRef = gradientTextureRef
    const gradTex2Ref = gradientTexture2Ref
    const melTexRef = melbankTextureRef
    const histTexRef = historyTextureRef
    const textTexRef = textTextureRef
    const textTex2Ref = textTexture2Ref
    const quadBufRef = quadBufferRef
    const progRef = programRef
    const gradStrRef = currentGradientStrRef
    const textKeyRef = currentTextKeyRef
    const locations = locationsRef
    const attribs = attribLocationsRef
    const zeros = zeroArrayRef
    const smooths = smoothedDataArrayRef
    const melbanks = melbankArrayRef
    const offscreen = offscreenCanvasRef

    return () => {
      if (gl) {
        const gradTex = gradTexRef.current
        const melTex = melTexRef.current
        const histTex = histTexRef.current
        const textTex = textTexRef.current
        const quadBuf = quadBufRef.current
        const program = progRef.current

        if (gradTex) gl.deleteTexture(gradTex)
        if (gradTex2Ref.current) gl.deleteTexture(gradTex2Ref.current)
        if (melTex) gl.deleteTexture(melTex)
        if (histTex) gl.deleteTexture(histTex)
        if (textTex) gl.deleteTexture(textTex)
        if (textTex2Ref.current) gl.deleteTexture(textTex2Ref.current)

        buffers.forEach(buffer => gl.deleteBuffer(buffer))
        buffers.clear()

        if (quadBuf) {
          gl.deleteBuffer(quadBuf)
        }

        if (program) {
          deleteProgramAndShaders(gl, program)
        }

        typedArrays.clear()

        gradTexRef.current = null
        gradTex2Ref.current = null
        melTexRef.current = null
        histTexRef.current = null
        textTexRef.current = null
        textTex2Ref.current = null
        quadBufRef.current = null
        progRef.current = null
        gradStrRef.current = null
        textKeyRef.current = null
        locations.current = {}
        attribs.current = {}
        zeros.current = null
        smooths.current = null
        melbanks.current = null
        offscreen.current = null
      }
    }
  }, [visualType])

  // Resize handler
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement
        if (container) {
          const w = container.clientWidth
          const h = container.clientHeight

          if (canvasRef.current.width !== w || canvasRef.current.height !== h) {
            canvasRef.current.width = w
            canvasRef.current.height = h

            if (glRef.current) {
              glRef.current.viewport(0, 0, w, h)
              // Notify parent about size change to update post-processing composer
              if (onContextCreatedRef.current) {
                onContextCreatedRef.current(glRef.current, canvasRef.current)
              }
            }
          }
        }
      }
    }
    updateCanvasSize(); window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', backgroundColor: '#000' }} />
}

export default WebGLVisualiser
