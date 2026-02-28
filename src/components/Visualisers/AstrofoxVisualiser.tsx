// Re-export config and preset helpers for external usage
// eslint-disable-next-line react-refresh/only-export-components
export { DEFAULT_ASTROFOX_CONFIG, ASTROFOX_PRESETS, getAstrofoxPresetLayers } from '../../engines/astrofox/presets/defaults'
/**
 * AstrofoxVisualiser - Layer-based audio visualizations inspired by Astrofox
 *
 * This component provides a layer-based composition system similar to Astrofox,
 * allowing users to stack multiple visual elements (text, spectrum bars, images, waveforms, 3D geometry)
 * with individual audio reactivity settings.
 *
 * Reference: https://github.com/astrofox-io/astrofox
 */

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useMemo
} from 'react'
import {
  Box,
  Typography,
} from '@mui/material'
import {
  BarChart,
  GraphicEq,
  Timeline,
  TextFields,
  Image as ImageIcon,
  ViewInAr,
  Folder,
  Layers
} from '@mui/icons-material'

// Audio processing utilities (based on Astrofox audio engine)
import { FFTParser } from '../../engines/audio/FFTParser'

// Three.js 3D renderers
import { NeonTunnelRenderer, ReactiveOrbRenderer, ParticleFieldRenderer } from '../../engines/astrofox/renderers/three'
import { AudioSmoother } from '../../engines/astrofox/utils/AudioSmoother'
import type { FrequencyBands } from '../../engines/astrofox/utils/AudioSmoother'

// --- Types (imported from canonical location) ---
import {
  getCompositeOperation
} from '../../engines/astrofox/types'

import type {
  AstrofoxLayerType,
  AstrofoxLayerBase,
  BarSpectrumLayer,
  WaveSpectrumLayer,
  SoundWaveLayer,
  SoundWave2Layer,
  TextLayer,
  ImageLayer,
  Geometry3DLayer,
  GroupLayer,
  NeonTunnelLayer,
  ReactiveOrbLayer,
  ParticleFieldLayer,
  AstrofoxLayer,
  AstrofoxConfig,
  AstrofoxVisualiserRef,
  AstrofoxVisualiserProps,
  FrequencyBand
} from '../../engines/astrofox/types'

import {
  renderBarSpectrum,
  renderWaveSpectrum,
  renderSoundWave,
  renderSoundWave2,
  renderText,
  renderImage,
  type ParseAudioDataFn
} from './Astrofox/renderers/canvasRenderers'
import {
  renderGeometry3D as renderGeometry3DFn
} from './Astrofox/renderers/geometry3d'

// Re-export types for backward compatibility
export type {
  AstrofoxLayerType,
  AstrofoxLayerBase,
  BarSpectrumLayer,
  WaveSpectrumLayer,
  SoundWaveLayer,
  SoundWave2Layer,
  TextLayer,
  ImageLayer,
  Geometry3DLayer,
  GroupLayer,
  NeonTunnelLayer,
  ReactiveOrbLayer,
  ParticleFieldLayer,
  AstrofoxLayer,
  AstrofoxConfig,
  AstrofoxVisualiserRef,
  AstrofoxVisualiserProps,
  FrequencyBand
}

// --- Presets and defaults (imported from canonical location) ---
import {
  ASTROFOX_PRESETS,
  getAstrofoxPresetLayers,
  createDefaultLayer,
  DEFAULT_ASTROFOX_CONFIG
} from '../../engines/astrofox/presets/defaults'

// Export moved to separate file to avoid Fast Refresh error
export type AstrofoxPresetName = (typeof ASTROFOX_PRESETS)[number]

// --- Font List (from Astrofox fonts.json) ---
const AVAILABLE_FONTS = [
  'Permanent Marker',
  'Abel',
  'Abril Fatface',
  'Bangers',
  'Cardo',
  'Caveat',
  'Merriweather',
  'Playfair Display',
  'Oswald',
  'Oxygen',
  'Racing Sans One',
  'Raleway',
  'Roboto',
  'Vast Shadow'
]

// Google Fonts URL for loading
const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?family=${AVAILABLE_FONTS.map((f) => f.replace(/ /g, '+')).join('&family=')}&display=swap`

// Load Google Fonts on module load
if (typeof document !== 'undefined') {
  const existingLink = document.querySelector(`link[href*="fonts.googleapis.com"]`)
  if (!existingLink) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_URL
    document.head.appendChild(link)
  }
}

// --- Layer Type Icons ---

// Moved to LAYER_ICONS.ts to avoid Fast Refresh error

export { AVAILABLE_FONTS }

/** Audio data array type - supports both number[] and Float32Array */
type AudioDataArray = number[] | Float32Array

// --- Main Component ---

const AstrofoxVisualiser = forwardRef<AstrofoxVisualiserRef, AstrofoxVisualiserProps>(
  (
    {
      audioData,
      isPlaying,
      config = DEFAULT_ASTROFOX_CONFIG,
      onConfigChange,
      frequencyBands: _frequencyBands,
      beatData: _beatData
    },
    ref
  ) => {
    // Inject global primary/secondary color into all relevant layers
    const globalPrimary = config.primaryColor || '#6366f1';
    const globalSecondary = config.secondaryColor || '#a855f7';
    const layersWithGlobalColors = config.layers.map((layer) => {
      switch (layer.type) {
        case 'barSpectrum':
          return {
            ...layer,
            barColor: globalPrimary,
            barColorEnd: globalSecondary
          };
        case 'waveSpectrum':
          return {
            ...layer,
            lineColor: globalPrimary,
            fillColor: globalSecondary
          };
        case 'soundWave':
          return {
            ...layer,
            color: globalPrimary,
            fillColor: globalSecondary
          };
        case 'soundWave2':
          return {
            ...layer,
            lineColor: globalPrimary
          };
        case 'text':
          return {
            ...layer,
            color: globalPrimary
          };
        case 'image': {
          // Use config.background_source for background image layers, else image_source
          const isBackground = typeof layer.name === 'string' && layer.name.trim().toLowerCase() === 'background';
          return {
            ...layer,
            imageUrl: isBackground
              ? config.background_source || layer.imageUrl || ''
              : config.image_source || layer.imageUrl || ''
          };
        }
        case 'geometry3d':
          return {
            ...layer,
            color: globalPrimary
          };
        case 'neonTunnel':
          return {
            ...layer,
            color: globalPrimary
          };
        case 'reactiveOrb':
          return {
            ...layer,
            color: globalPrimary
          };
        case 'particleField':
          return {
            ...layer,
            particleColor: globalPrimary
          };
        default:
          return layer;
      }
    });
    // Use layersWithGlobalColors instead of config.layers below
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number>(0)
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())
    // Track the last image_source to clear cache on change
    const lastImageSourceRef = useRef<string | null>(null)

    // Clear image cache if image_source changes (including cachebuster)
    useEffect(() => {
      // Find the first image layer (non-background) to get the current image_source
      const imageLayer = (config.layers || []).find(
        (layer: any) =>
          layer.type === 'image' &&
          (!layer.name || layer.name.trim().toLowerCase() !== 'background')
      );
      // Only access imageUrl if the layer is actually an ImageLayer
      let imageLayerUrl = '';
      if (imageLayer && 'imageUrl' in imageLayer) {
        imageLayerUrl = imageLayer.imageUrl;
      }
      const currentImageSource = config.image_source || imageLayerUrl || '';
      if (
        lastImageSourceRef.current !== null &&
        lastImageSourceRef.current !== currentImageSource
      ) {
        imageCache.current.clear();
      }
      lastImageSourceRef.current = currentImageSource;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.image_source]);
    const canvasSizeRef = useRef({ width: 1920, height: 1080 })
    // Cache for 3D geometry to prevent creating arrays every frame
    const geometryCache = useRef<Map<string, { vertices: [number, number, number][], edges: [number, number][], faces: [number, number, number][] }>>(new Map())
    // Cache for FFT parsers per-layer (key: layerId, value: parser instance)
    const fftParserCache = useRef<Map<string, FFTParser>>(new Map())
    // Cache for Three.js 3D renderers (key: layerId, value: renderer instance)
    const three3DRendererCache = useRef<Map<string, any>>(new Map())
    // Audio smoother for smoothing frequency bands
    const audioSmootherRef = useRef<any>(null)
    // Reusable typed array for audio input conversion (avoids GC pressure)
    const audioInputArrayRef = useRef<Uint8Array | null>(null)
    // Reusable geometry buffers for 3D rendering (avoids GC pressure)
    const geometryBufferRef = useRef<{ transformed: Float32Array; projected: Float32Array } | null>(null)

    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

    // Counter for layer naming
    const layerCountersRef = useRef<Record<AstrofoxLayerType, number>>({
      barSpectrum: 1,
      waveSpectrum: 1,
      soundWave: 1,
      soundWave2: 1,
      text: 1,
      image: 1,
      geometry3d: 1,
      group: 1,
      neonTunnel: 1,
      reactiveOrb: 1,
      particleField: 1
    })

    // --- Layer Management ---

    const addLayer = useCallback(
      (type: AstrofoxLayerType) => {
        const newLayer = createDefaultLayer(
          type,
          layerCountersRef.current[type]++,
          canvasSizeRef.current.width,
          canvasSizeRef.current.height
        )
        const updatedLayers = [...config.layers, newLayer]
        onConfigChange?.({ layers: updatedLayers })
        setSelectedLayerId(newLayer.id)
      },
      [config.layers, onConfigChange]
    )

    const removeLayer = useCallback(
      (id: string) => {
        const updatedLayers = config.layers.filter((l) => l.id !== id)
        onConfigChange?.({ layers: updatedLayers })
        if (selectedLayerId === id) {
          setSelectedLayerId(updatedLayers[0]?.id || null)
        }
      },
      [config.layers, onConfigChange, selectedLayerId]
    )

    const duplicateLayer = useCallback(
      (id: string) => {
        const layerToDuplicate = config.layers.find((l) => l.id === id)
        if (!layerToDuplicate) return

        const newLayer = {
          ...layerToDuplicate,
          id: Math.random().toString(36).substring(2, 11),
          name: `${layerToDuplicate.name} Copy`,
          x: layerToDuplicate.x + 20,
          y: layerToDuplicate.y + 20
        }
        const updatedLayers = [...config.layers, newLayer]
        onConfigChange?.({ layers: updatedLayers })
        setSelectedLayerId(newLayer.id)
      },
      [config.layers, onConfigChange]
    )

    const moveLayer = useCallback(
      (id: string, direction: 'up' | 'down') => {
        const index = config.layers.findIndex((l) => l.id === id)
        if (index === -1) return

        const newIndex = direction === 'up' ? index + 1 : index - 1
        if (newIndex < 0 || newIndex >= config.layers.length) return

        const updatedLayers = [...config.layers]
        ;[updatedLayers[index], updatedLayers[newIndex]] = [
          updatedLayers[newIndex],
          updatedLayers[index]
        ]
        onConfigChange?.({ layers: updatedLayers })
      },
      [config.layers, onConfigChange]
    )

    const updateLayer = useCallback(
      (id: string, updates: Partial<AstrofoxLayer>) => {
        const updatedLayers = config.layers.map((l) =>
          l.id === id ? ({ ...l, ...updates } as AstrofoxLayer) : l
        )
        onConfigChange?.({ layers: updatedLayers })
      },
      [config.layers, onConfigChange]
    )

    const toggleLayerVisibility = useCallback(
      (id: string) => {
        const layer = config.layers.find((l) => l.id === id)
        if (layer) {
          updateLayer(id, { visible: !layer.visible })
        }
      },
      [config.layers, updateLayer]
    )

    // Find parent group of a layer
    const findParentGroup = useCallback(
      (layerId: string): GroupLayer | null => {
        for (const layer of config.layers) {
          if (layer.type === 'group' && (layer as GroupLayer).childIds.includes(layerId)) {
            return layer as GroupLayer
          }
        }
        return null
      },
      [config.layers]
    )

    // Remove layer from group (move to top level)
    const removeFromGroup = useCallback(
      (layerId: string) => {
        const parent = findParentGroup(layerId)
        if (!parent) return

        const updatedLayers = config.layers.map((l) =>
          l.id === parent.id
            ? { ...l, childIds: (l as GroupLayer).childIds.filter((id) => id !== layerId) }
            : l
        )
        onConfigChange?.({ layers: updatedLayers })
      },
      [config.layers, findParentGroup, onConfigChange]
    )

    // --- Rendering Functions ---

    // Get or create FFTParser for a layer with frequency filtering
    const getFFTParser = useCallback(
      (layerId: string, minFrequency: number, maxFrequency: number, maxDecibels: number, smoothing: number): FFTParser => {
        let parser = fftParserCache.current.get(layerId)

        if (!parser) {
          parser = new FFTParser({
            fftSize: 2048,
            sampleRate: 44100,
            minFrequency,
            maxFrequency,
            maxDecibels,
            minDecibels: -100,
            smoothingTimeConstant: smoothing,
          })
          fftParserCache.current.set(layerId, parser)
        } else {
          parser.updateConfig({
            minFrequency,
            maxFrequency,
            maxDecibels,
            smoothingTimeConstant: smoothing
          })
        }

        return parser
      },
      []
    )

    // Parse raw audio data (0-255 Uint8Array) using FFTParser with per-layer frequency filtering
    const parseAudioData = useCallback(
      (
        data: AudioDataArray | Uint8Array,
        layerId: string,
        minFrequency: number,
        maxFrequency: number,
        maxDecibels: number,
        smoothing: number,
        targetBins?: number
      ): Float32Array => {
        const parser = getFFTParser(layerId, minFrequency, maxFrequency, maxDecibels, smoothing)
        // Convert to Uint8Array if needed (assuming data is already 0-255 frequency data)
        let inputData: Uint8Array
        if (data instanceof Uint8Array) {
          inputData = data
        } else {
          if (!audioInputArrayRef.current || audioInputArrayRef.current.length !== data.length) {
            audioInputArrayRef.current = new Uint8Array(data.length)
          }
          inputData = audioInputArrayRef.current
          for (let i = 0; i < data.length; i++) {
            inputData[i] = Math.round(data[i] * 255)
          }
        }
        return parser.parseFFT(inputData, targetBins)
      },
      [getFFTParser]
    )

    // Initialize AudioSmoother
    if (!audioSmootherRef.current) {
      audioSmootherRef.current = new AudioSmoother(0.15)
    }

    // Get smoothed frequency bands
    const smoothedBands: FrequencyBands = useMemo(() => {
      if (!_frequencyBands) {
        return { bass: 0, mid: 0, high: 0 }
      }
      return audioSmootherRef.current.update({
        bass: _frequencyBands.bass || 0,
        mid: _frequencyBands.mid || 0,
        high: _frequencyBands.high || 0
      })
    }, [_frequencyBands])

    // Get current time for animations
    const timeRef = useRef<number>(0)
    useEffect(() => {
      const startTime = performance.now()
      const updateTime = () => {
        timeRef.current = (performance.now() - startTime) / 1000
        if (isPlaying) {
          requestAnimationFrame(updateTime)
        }
      }
      if (isPlaying) {
        updateTime()
      }
      return () => {
        // Cleanup handled by animation loop
      }
    }, [isPlaying])

    // Render Neon Tunnel
    const renderNeonTunnel = useCallback((
      ctx: CanvasRenderingContext2D,
      layer: any,
      centerX: number,
      centerY: number
    ) => {
      const width = canvasSizeRef.current.width
      const height = canvasSizeRef.current.height

      // Get or create renderer
      let renderer = three3DRendererCache.current.get(layer.id)
      if (!renderer) {
        renderer = new NeonTunnelRenderer({
          width,
          height,
          color: layer.color,
          wireframeThickness: layer.wireframeThickness,
          glowIntensity: layer.glowIntensity,
          speed: layer.speed,
          segments: layer.segments,
          frequencyBands: layer.frequencyBands,
          audioSensitivity: layer.audioSensitivity,
          cameraShakeEnabled: layer.cameraShakeEnabled,
          cameraShakeIntensity: layer.cameraShakeIntensity,
          enableBloom: layer.enableBloom,
          bloomStrength: layer.bloomStrength,
          enableRGBShift: layer.enableRGBShift,
          rgbShiftAmount: layer.rgbShiftAmount
        })
        three3DRendererCache.current.set(layer.id, renderer)
      }

      // Render to off-screen canvas
      const offscreenCanvas = renderer.render(smoothedBands, timeRef.current)

      // Composite to main canvas
      ctx.save()
      ctx.translate(centerX + layer.x, centerY + layer.y)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.scale(layer.scale, layer.scale)
      ctx.globalAlpha = layer.opacity
      ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)
      ctx.drawImage(offscreenCanvas, -offscreenCanvas.width / 2, -offscreenCanvas.height / 2)
      ctx.restore()
    }, [smoothedBands])

    // Render Reactive Orb
    const renderReactiveOrb = useCallback((
      ctx: CanvasRenderingContext2D,
      layer: any,
      centerX: number,
      centerY: number
    ) => {
      const width = canvasSizeRef.current.width
      const height = canvasSizeRef.current.height

      // Get or create renderer
      let renderer = three3DRendererCache.current.get(layer.id)
      if (!renderer) {
        renderer = new ReactiveOrbRenderer({
          width,
          height,
          color: layer.color,
          displacementAmount: layer.displacementAmount,
          noiseScale: layer.noiseScale,
          subdivisions: layer.subdivisions,
          fresnelIntensity: layer.fresnelIntensity,
          frequencyBands: layer.frequencyBands,
          audioSensitivity: layer.audioSensitivity,
          enableBloom: layer.enableBloom,
          bloomStrength: layer.bloomStrength,
          enableRGBShift: layer.enableRGBShift,
          rgbShiftAmount: layer.rgbShiftAmount
        })
        three3DRendererCache.current.set(layer.id, renderer)
      }

      // Render to off-screen canvas
      const offscreenCanvas = renderer.render(smoothedBands, timeRef.current)

      // Composite to main canvas
      ctx.save()
      ctx.translate(centerX + layer.x, centerY + layer.y)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.scale(layer.scale, layer.scale)
      ctx.globalAlpha = layer.opacity
      ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)
      ctx.drawImage(offscreenCanvas, -offscreenCanvas.width / 2, -offscreenCanvas.height / 2)
      ctx.restore()
    }, [smoothedBands])

    // Render Particle Field
    const renderParticleField = useCallback((
      ctx: CanvasRenderingContext2D,
      layer: any,
      centerX: number,
      centerY: number
    ) => {
      const width = canvasSizeRef.current.width
      const height = canvasSizeRef.current.height

      // Get or create renderer
      let renderer = three3DRendererCache.current.get(layer.id)
      if (!renderer) {
        renderer = new ParticleFieldRenderer({
          width,
          height,
          particleCount: layer.particleCount,
          particleSize: layer.particleSize,
          particleColor: layer.particleColor,
          speed: layer.speed,
          depth: layer.depth,
          frequencyBands: layer.frequencyBands,
          audioSensitivity: layer.audioSensitivity,
          enableBloom: layer.enableBloom,
          bloomStrength: layer.bloomStrength,
          enableRGBShift: layer.enableRGBShift,
          rgbShiftAmount: layer.rgbShiftAmount
        })
        three3DRendererCache.current.set(layer.id, renderer)
      }

      // Render to off-screen canvas
      const offscreenCanvas = renderer.render(smoothedBands, timeRef.current)

      // Composite to main canvas
      ctx.save()
      ctx.translate(centerX + layer.x, centerY + layer.y)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.scale(layer.scale, layer.scale)
      ctx.globalAlpha = layer.opacity
      ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)
      ctx.drawImage(offscreenCanvas, -offscreenCanvas.width / 2, -offscreenCanvas.height / 2)
      ctx.restore()
    }, [smoothedBands])

    // Main render function
    const render = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2

      // Update canvas size ref
      canvasSizeRef.current = { width, height }

      // Clear and fill background
      ctx.fillStyle = config.backgroundColor
      ctx.fillRect(0, 0, width, height)

      // Render layers from bottom to top
      for (const layer of layersWithGlobalColors) {
        if (!layer.visible) continue

        switch (layer.type) {
          case 'barSpectrum':
            renderBarSpectrum(ctx, layer as BarSpectrumLayer, audioData, centerX, centerY, parseAudioData as ParseAudioDataFn)
            break
          case 'waveSpectrum':
            renderWaveSpectrum(ctx, layer as WaveSpectrumLayer, audioData, centerX, centerY, parseAudioData as ParseAudioDataFn)
            break
          case 'soundWave':
            renderSoundWave(ctx, layer as SoundWaveLayer, audioData, centerX, centerY)
            break
          case 'soundWave2':
            renderSoundWave2(ctx, layer as SoundWave2Layer, audioData, centerX, centerY)
            break
          case 'text':
            renderText(ctx, layer as TextLayer, audioData, centerX, centerY)
            break
          case 'image':
            renderImage(ctx, layer as ImageLayer, audioData, centerX, centerY, imageCache.current)
            break
          case 'geometry3d':
            renderGeometry3DFn(ctx, layer as Geometry3DLayer, audioData, centerX, centerY, geometryCache.current, geometryBufferRef)
            break
          case 'neonTunnel':
            renderNeonTunnel(ctx, layer, centerX, centerY)
            break
          case 'reactiveOrb':
            renderReactiveOrb(ctx, layer, centerX, centerY)
            break
          case 'particleField':
            renderParticleField(ctx, layer, centerX, centerY)
            break
          case 'group':
            // Groups render their children - handled separately
            break
        }
      }
    }, [
      layersWithGlobalColors,
      config.backgroundColor,
      audioData,
      parseAudioData,
      renderNeonTunnel,
      renderReactiveOrb,
      renderParticleField
    ])

    // Store render function in ref for animation loop
    const renderRef = useRef<() => void>(() => {})
    useEffect(() => {
      renderRef.current = render
    }, [render])

    // Handle resize - avoid devicePixelRatio to prevent memory issues
    useEffect(() => {
      const handleResize = () => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const parent = canvas.parentElement
        if (!parent) return

        const width = parent.clientWidth
        const height = parent.clientHeight

        // Only resize if dimensions actually changed
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width
          canvas.height = height
          canvasSizeRef.current = { width, height }
        }
      }

      window.addEventListener('resize', handleResize)
      handleResize()

      const fftCache = fftParserCache.current
      const geomCache = geometryCache.current
      const imgCache = imageCache.current

      return () => {
        window.removeEventListener('resize', handleResize)
        // Clear caches on unmount
        fftCache.clear()
        geomCache.clear()
        imgCache.clear()
        audioInputArrayRef.current = null
      }
    }, [])

    // Animation loop
    useEffect(() => {
      if (!isPlaying) return

      let cancelled = false
      const animate = () => {
        if (cancelled) return
        renderRef.current()
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animate()

      return () => {
        cancelled = true
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [isPlaying])

    // Cleanup Three.js renderers on unmount
    useEffect(() => {
      const cache = three3DRendererCache.current;
      return () => {
        cache.forEach((renderer) => {
          renderer.dispose();
        });
        cache.clear();
      }
    }, [])

    // Reorder layer function (for external use via ref)
    const reorderLayer = useCallback(
      (draggedId: string, targetId: string, position: 'above' | 'below' | 'inside') => {
        if (!draggedId || draggedId === targetId) return

        const draggedLayer = config.layers.find((l) => l.id === draggedId)
        const targetLayer = config.layers.find((l) => l.id === targetId)

        if (!draggedLayer || !targetLayer) return

        // Remove from current parent if any
        const currentParent = findParentGroup(draggedId)
        let updatedLayers = [...config.layers]

        if (currentParent) {
          updatedLayers = updatedLayers.map((l) =>
            l.id === currentParent.id
              ? { ...l, childIds: (l as GroupLayer).childIds.filter((id) => id !== draggedId) }
              : l
          )
        }

        // Handle different drop positions
        if (position === 'inside' && targetLayer.type === 'group') {
          // Drop inside a group
          updatedLayers = updatedLayers.map((l) =>
            l.id === targetId
              ? { ...l, childIds: [...(l as GroupLayer).childIds, draggedId] }
              : l
          )
          setExpandedGroups((prev) => {
            const next = new Set(prev)
            next.add(targetId)
            return next
          })
        } else {
          // Reorder - insert above or below target
          updatedLayers = updatedLayers.filter((l) => l.id !== draggedId)
          const targetIndex = updatedLayers.findIndex((l) => l.id === targetId)
          if (targetIndex !== -1) {
            const insertIndex = position === 'above' ? targetIndex : targetIndex + 1
            updatedLayers.splice(insertIndex, 0, draggedLayer)
          }
        }

        onConfigChange?.({ layers: updatedLayers })
      },
      [config.layers, findParentGroup, onConfigChange]
    )

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        layers: layersWithGlobalColors,
        selectedLayerId,
        setSelectedLayerId,
        addLayer,
        removeLayer,
        duplicateLayer,
        moveLayer,
        updateLayer,
        toggleLayerVisibility,
        removeFromGroup,
        reorderLayer
      }),
      [
        layersWithGlobalColors,
        selectedLayerId,
        setSelectedLayerId,
        addLayer,
        removeLayer,
        duplicateLayer,
        moveLayer,
        updateLayer,
        toggleLayerVisibility,
        removeFromGroup,
        reorderLayer
      ]
    )

    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          bgcolor: '#0f0f23'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />

        {/* Empty state */}
        {config.layers.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)'
            }}
          >
            <Layers sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">No layers yet</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Add a layer using the controls below
            </Typography>
          </Box>
        )}
      </Box>
    )
  }
)

AstrofoxVisualiser.displayName = 'AstrofoxVisualiser'

export default AstrofoxVisualiser
