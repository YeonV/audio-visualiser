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
  useMemo,
  ChangeEvent
} from 'react'
import {
  Box,
  IconButton,
  Typography,
  Slider,
  Tooltip,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
  Collapse,
  Button,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material'
import {
  Add,
  Delete,
  Visibility,
  VisibilityOff,
  KeyboardArrowUp,
  KeyboardArrowDown,
  ExpandMore,
  ExpandLess,
  TextFields,
  Image as ImageIcon,
  BarChart,
  GraphicEq,
  Layers,
  Tune,
  ContentCopy,
  ViewInAr,
  Folder,
  Timeline
} from '@mui/icons-material'

// Audio processing utilities (based on Astrofox audio engine)
import { FFTParser, WaveParser } from './audioanalyzer/FFTParser'

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

// --- Blend Modes ---
const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion'
] as const

// Map blend mode names to canvas globalCompositeOperation values
const getCompositeOperation = (blendMode: string): GlobalCompositeOperation => {
  if (blendMode === 'normal') return 'source-over'
  return blendMode as GlobalCompositeOperation
}

// --- 3D Geometry Shapes ---
const GEOMETRY_SHAPES = [
  'Box',
  'Sphere',
  'Dodecahedron',
  'Icosahedron',
  'Octahedron',
  'Tetrahedron',
  'Torus',
  'Torus Knot'
] as const

// --- 3D Materials ---
const GEOMETRY_MATERIALS = ['Standard', 'Basic', 'Lambert', 'Phong', 'Normal'] as const

// --- Shading Types ---
const SHADING_TYPES = ['Smooth', 'Flat'] as const

// --- Types ---

export type AstrofoxLayerType =
  | 'barSpectrum'
  | 'waveSpectrum'
  | 'soundWave'
  | 'soundWave2'
  | 'text'
  | 'image'
  | 'geometry3d'
  | 'group'

export interface AstrofoxLayerBase {
  id: string
  type: AstrofoxLayerType
  name: string
  visible: boolean
  opacity: number
  blendMode: (typeof BLEND_MODES)[number]
  x: number
  y: number
  rotation: number
  scale: number
}

export interface BarSpectrumLayer extends AstrofoxLayerBase {
  type: 'barSpectrum'
  width: number
  height: number
  barWidth: number
  barSpacing: number
  barColor: string
  barColorEnd: string
  shadowHeight: number
  shadowColor: string
  minFrequency: number
  maxFrequency: number
  maxDecibels: number
  smoothing: number
  mirror: boolean
}

export interface WaveSpectrumLayer extends AstrofoxLayerBase {
  type: 'waveSpectrum'
  width: number
  height: number
  lineWidth: number
  lineColor: string
  fill: boolean
  fillColor: string
  minFrequency: number
  maxFrequency: number
  smoothing: number
}

// NEW: SoundWave - horizontal waveform like Astrofox
export interface SoundWaveLayer extends AstrofoxLayerBase {
  type: 'soundWave'
  width: number
  height: number
  lineWidth: number
  color: string
  fillColor: string
  useFill: boolean
  wavelength: number
  smooth: number
}

// Renamed from old SoundWave - circular/line mode
export interface SoundWave2Layer extends AstrofoxLayerBase {
  type: 'soundWave2'
  radius: number
  lineWidth: number
  lineColor: string
  mode: 'circle' | 'line'
  sensitivity: number
}

export interface TextLayer extends AstrofoxLayerBase {
  type: 'text'
  text: string
  font: string
  fontSize: number
  bold: boolean
  italic: boolean
  color: string
  textAlign: 'left' | 'center' | 'right'
  audioReactive: boolean
  reactiveScale: number
}

export interface ImageLayer extends AstrofoxLayerBase {
  type: 'image'
  imageUrl: string
  imageData: string // Base64 data URL
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
  fixed: boolean // Maintain aspect ratio
}

// NEW: 3D Geometry Layer
export interface Geometry3DLayer extends AstrofoxLayerBase {
  type: 'geometry3d'
  shape: (typeof GEOMETRY_SHAPES)[number]
  material: (typeof GEOMETRY_MATERIALS)[number]
  shading: (typeof SHADING_TYPES)[number]
  color: string
  wireframe: boolean
  edges: boolean
  edgeColor: string
  rotationX: number
  rotationY: number
  rotationZ: number
  size: number
  audioReactive: boolean
}

// NEW: Group Layer (Scene in Astrofox)
export interface GroupLayer extends AstrofoxLayerBase {
  type: 'group'
  mask: boolean
  childIds: string[]
}

export type AstrofoxLayer =
  | BarSpectrumLayer
  | WaveSpectrumLayer
  | SoundWaveLayer
  | SoundWave2Layer
  | TextLayer
  | ImageLayer
  | Geometry3DLayer
  | GroupLayer

export interface AstrofoxConfig {
  layers: AstrofoxLayer[]
  backgroundColor: string
  width: number
  height: number
}

export interface AstrofoxVisualiserRef {
  getCanvas: () => HTMLCanvasElement | null
  addLayer: (type: AstrofoxLayerType) => void
  removeLayer: (id: string) => void
  duplicateLayer: (id: string) => void
  moveLayer: (id: string, direction: 'up' | 'down') => void
  renderControls: () => React.ReactNode
}

/** Audio data array type - supports both number[] and Float32Array */
type AudioDataArray = number[] | Float32Array

interface AstrofoxVisualiserProps {
  audioData: AudioDataArray
  isPlaying: boolean
  config: AstrofoxConfig
  onConfigChange?: (config: Partial<AstrofoxConfig>) => void
  frequencyBands?: { bass: number; mid: number; high: number }
  beatData?: { isBeat: boolean; beatIntensity: number; bpm: number }
}

// --- Default Configurations ---

const DEFAULT_BAR_SPECTRUM: Omit<BarSpectrumLayer, 'id' | 'name'> = {
  type: 'barSpectrum',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  width: 800,
  height: 200,
  barWidth: 8,
  barSpacing: 2,
  barColor: '#6366f1',
  barColorEnd: '#a855f7',
  shadowHeight: 50,
  shadowColor: '#1e1b4b',
  minFrequency: 20,
  maxFrequency: 20000,  // Full audible range (was 6000, cutting off highs)
  maxDecibels: -12,
  smoothing: 0.5,
  mirror: false
}

const DEFAULT_WAVE_SPECTRUM: Omit<WaveSpectrumLayer, 'id' | 'name'> = {
  type: 'waveSpectrum',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  width: 800,
  height: 150,
  lineWidth: 2,
  lineColor: '#22d3ee',
  fill: true,
  fillColor: 'rgba(34, 211, 238, 0.3)',
  minFrequency: 20,
  maxFrequency: 20000,  // Full audible range (was 6000, cutting off highs)
  smoothing: 0.6
}

// NEW: Horizontal waveform like Astrofox
const DEFAULT_SOUND_WAVE: Omit<SoundWaveLayer, 'id' | 'name'> = {
  type: 'soundWave',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  width: 854,
  height: 240,
  lineWidth: 2,
  color: '#00ffff',
  fillColor: 'rgba(0, 255, 255, 0.1)',
  useFill: false,
  wavelength: 0.1,
  smooth: 0.5
}

// Renamed: Circle/line mode waveform
const DEFAULT_SOUND_WAVE_2: Omit<SoundWave2Layer, 'id' | 'name'> = {
  type: 'soundWave2',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  radius: 150,
  lineWidth: 3,
  lineColor: '#f43f5e',
  mode: 'circle',
  sensitivity: 1.5
}

// Updated: Permanent Marker font, size 60
const DEFAULT_TEXT: Omit<TextLayer, 'id' | 'name'> = {
  type: 'text',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  text: 'LedFX',
  font: 'Permanent Marker',
  fontSize: 60,
  bold: false,
  italic: false,
  color: '#ffffff',
  textAlign: 'center',
  audioReactive: true,
  reactiveScale: 0.2
}

// Updated: Full visualizer dimensions default
const DEFAULT_IMAGE: Omit<ImageLayer, 'id' | 'name'> = {
  type: 'image',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  imageUrl: '',
  imageData: '',
  width: 0, // 0 = auto (will be set to canvas size on upload)
  height: 0,
  naturalWidth: 0,
  naturalHeight: 0,
  fixed: false
}

// NEW: 3D Geometry defaults
const DEFAULT_GEOMETRY_3D: Omit<Geometry3DLayer, 'id' | 'name'> = {
  type: 'geometry3d',
  visible: true,
  opacity: 0.5,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  shape: 'Box',
  material: 'Standard',
  shading: 'Smooth',
  color: '#6366f1',
  wireframe: false,
  edges: true,
  edgeColor: '#ffffff',
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  size: 150,
  audioReactive: true
}

// NEW: Group (Scene) defaults
const DEFAULT_GROUP: Omit<GroupLayer, 'id' | 'name'> = {
  type: 'group',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  mask: false,
  childIds: []
}

// --- Built-in Presets ---
const PRESET_LAYERS: Record<string, AstrofoxLayer[]> = {
  default: [
    {
      id: 'default_bars',
      name: 'Spectrum Bars',
      ...DEFAULT_BAR_SPECTRUM,
      y: 300,
      width: 1000,
      height: 250
    },
    {
      id: 'default_wave',
      name: 'Wave Overlay',
      ...DEFAULT_WAVE_SPECTRUM,
      y: 200,
      width: 1000,
      height: 200,
      blendMode: 'screen',
      opacity: 0.7
    },
    {
      id: 'default_text',
      name: 'Title',
      ...DEFAULT_TEXT,
      y: -250,
      fontSize: 72,
      text: 'LedFX'
    }
  ],
  minimal: [
    {
      id: 'minimal_wave',
      name: 'Sound Wave',
      ...DEFAULT_SOUND_WAVE,
      width: 1200,
      height: 300
    }
  ],
  neon: [
    {
      id: 'neon_bars',
      name: 'Neon Bars',
      ...DEFAULT_BAR_SPECTRUM,
      y: 200,
      width: 1000,
      height: 300,
      barColor: '#00ff88',
      barColorEnd: '#00ffff',
      shadowColor: '#003322',
      blendMode: 'screen'
    },
    {
      id: 'neon_circle',
      name: 'Neon Circle',
      ...DEFAULT_SOUND_WAVE_2,
      y: -100,
      radius: 180,
      lineColor: '#ff00ff',
      blendMode: 'screen'
    }
  ],
  '3d': [
    {
      id: '3d_cube',
      name: '3D Cube',
      ...DEFAULT_GEOMETRY_3D,
      shape: 'Box',
      size: 200,
      color: '#6366f1'
    },
    {
      id: '3d_bars',
      name: 'Bars Below',
      ...DEFAULT_BAR_SPECTRUM,
      y: 350,
      width: 800,
      height: 150
    }
  ]
}

export const DEFAULT_ASTROFOX_CONFIG: AstrofoxConfig = {
  layers: PRESET_LAYERS.default,
  backgroundColor: '#0f0f23',
  width: 1920,
  height: 1080
}

export const ASTROFOX_PRESETS = ['default', 'minimal', 'neon', '3d'] as const
export type AstrofoxPresetName = typeof ASTROFOX_PRESETS[number]

export function getAstrofoxPresetLayers(preset: AstrofoxPresetName): AstrofoxLayer[] {
  return JSON.parse(JSON.stringify(PRESET_LAYERS[preset] || PRESET_LAYERS.default))
}

// --- Layer Type Icons ---

const LAYER_ICONS: Record<AstrofoxLayerType, React.ReactNode> = {
  barSpectrum: <BarChart />,
  waveSpectrum: <GraphicEq />,
  soundWave: <Timeline />,
  soundWave2: <GraphicEq />,
  text: <TextFields />,
  image: <ImageIcon />,
  geometry3d: <ViewInAr />,
  group: <Folder />
}

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substring(2, 11)

const createDefaultLayer = (
  type: AstrofoxLayerType,
  index: number,
  canvasWidth?: number,
  canvasHeight?: number
): AstrofoxLayer => {
  const id = generateId()

  switch (type) {
    case 'barSpectrum':
      return { ...DEFAULT_BAR_SPECTRUM, id, name: `Bar Spectrum ${index}` }
    case 'waveSpectrum':
      return { ...DEFAULT_WAVE_SPECTRUM, id, name: `Wave Spectrum ${index}` }
    case 'soundWave':
      return {
        ...DEFAULT_SOUND_WAVE,
        id,
        name: `Soundwave ${index}`,
        width: canvasWidth || 854,
        height: canvasHeight ? Math.floor(canvasHeight * 0.3) : 240
      }
    case 'soundWave2':
      return { ...DEFAULT_SOUND_WAVE_2, id, name: `Sound Wave 2 ${index}` }
    case 'text':
      return { ...DEFAULT_TEXT, id, name: `Text ${index}` }
    case 'image':
      return {
        ...DEFAULT_IMAGE,
        id,
        name: `Image ${index}`,
        width: canvasWidth || 0,
        height: canvasHeight || 0
      }
    case 'geometry3d':
      return { ...DEFAULT_GEOMETRY_3D, id, name: `Geometry (3D) ${index}` }
    case 'group':
      return { ...DEFAULT_GROUP, id, name: `Group ${index}` }
  }
}

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = { _frequencyBands, _beatData }

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number>(0)
    const smoothedDataRef = useRef<number[]>([])
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())
    const canvasSizeRef = useRef({ width: 1920, height: 1080 })
    // Cache for 3D geometry to prevent creating arrays every frame
    const geometryCache = useRef<Map<string, { vertices: [number, number, number][], edges: [number, number][], faces: [number, number, number][] }>>(new Map())
    // Cache for FFT parsers per-layer (key: layerId, value: parser instance)
    const fftParserCache = useRef<Map<string, FFTParser>>(new Map())
    const waveParserCache = useRef<Map<string, WaveParser>>(new Map())

    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
    const [layersExpanded, setLayersExpanded] = useState(true)
    const [controlsExpanded, setControlsExpanded] = useState(true)
    const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null)
    const [dropTargetId, setDropTargetId] = useState<string | null>(null)
    const [dropPosition, setDropPosition] = useState<'above' | 'below' | 'inside' | null>(null)
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
      group: 1
    })

    // Get the currently selected layer
    const selectedLayer = useMemo(
      () => config.layers.find((l) => l.id === selectedLayerId) || null,
      [config.layers, selectedLayerId]
    )

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
          id: generateId(),
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

    // Toggle group expansion
    const toggleGroupExpanded = useCallback((groupId: string) => {
      setExpandedGroups((prev) => {
        const next = new Set(prev)
        if (next.has(groupId)) {
          next.delete(groupId)
        } else {
          next.add(groupId)
        }
        return next
      })
    }, [])

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

    // Get top-level layers (not inside any group)
    const topLevelLayers = useMemo(() => {
      const childIds = new Set<string>()
      config.layers.forEach((layer) => {
        if (layer.type === 'group') {
          ;(layer as GroupLayer).childIds.forEach((id) => childIds.add(id))
        }
      })
      return config.layers.filter((layer) => !childIds.has(layer.id))
    }, [config.layers])

    // Drag and drop handlers
    const handleDragStart = useCallback((e: React.DragEvent, layerId: string) => {
      e.dataTransfer.setData('text/plain', layerId)
      e.dataTransfer.effectAllowed = 'move'
      setDraggedLayerId(layerId)
    }, [])

    const handleDragEnd = useCallback(() => {
      setDraggedLayerId(null)
      setDropTargetId(null)
      setDropPosition(null)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent, targetId: string, isGroup: boolean) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'

      // Calculate position based on mouse Y within the element
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const mouseY = e.clientY - rect.top
      const height = rect.height

      if (isGroup && mouseY > height * 0.25 && mouseY < height * 0.75) {
        // Middle zone for groups - drop inside
        setDropPosition('inside')
      } else if (mouseY < height * 0.5) {
        setDropPosition('above')
      } else {
        setDropPosition('below')
      }

      setDropTargetId(targetId)
    }, [])

    const handleDragLeave = useCallback(() => {
      setDropTargetId(null)
      setDropPosition(null)
    }, [])

    const handleDrop = useCallback(
      (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        const draggedId = e.dataTransfer.getData('text/plain')

        if (!draggedId || draggedId === targetId) {
          setDraggedLayerId(null)
          setDropTargetId(null)
          setDropPosition(null)
          return
        }

        const draggedLayer = config.layers.find((l) => l.id === draggedId)
        const targetLayer = config.layers.find((l) => l.id === targetId)

        if (!draggedLayer || !targetLayer) {
          setDraggedLayerId(null)
          setDropTargetId(null)
          setDropPosition(null)
          return
        }

        // Don't allow dropping a group into itself or its children
        if (draggedLayer.type === 'group') {
          const checkIsChild = (parentId: string, childId: string): boolean => {
            const parent = config.layers.find((l) => l.id === parentId) as GroupLayer | undefined
            if (!parent || parent.type !== 'group') return false
            if (parent.childIds.includes(childId)) return true
            return parent.childIds.some((id) => checkIsChild(id, childId))
          }
          if (checkIsChild(draggedId, targetId)) {
            setDraggedLayerId(null)
            setDropTargetId(null)
            setDropPosition(null)
            return
          }
        }

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
        if (dropPosition === 'inside' && targetLayer.type === 'group') {
          // Drop inside a group
          updatedLayers = updatedLayers.map((l) =>
            l.id === targetId
              ? { ...l, childIds: [...(l as GroupLayer).childIds, draggedId] }
              : l
          )
          // Expand the group to show the new child
          setExpandedGroups((prev) => {
            const next = new Set(prev)
            next.add(targetId)
            return next
          })
        } else {
          // Reorder - insert above or below target
          // First, remove dragged item from its current position
          updatedLayers = updatedLayers.filter((l) => l.id !== draggedId)

          // Find the target index in the filtered array
          const targetIndex = updatedLayers.findIndex((l) => l.id === targetId)
          if (targetIndex !== -1) {
            // Insert at the correct position
            const insertIndex = dropPosition === 'above' ? targetIndex : targetIndex + 1
            updatedLayers.splice(insertIndex, 0, draggedLayer)
          }
        }

        onConfigChange?.({ layers: updatedLayers })
        setDraggedLayerId(null)
        setDropTargetId(null)
        setDropPosition(null)
      },
      [config.layers, findParentGroup, onConfigChange, dropPosition]
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

    // Handle image upload
    const handleImageUpload = useCallback(
      (layerId: string, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          const img = new Image()
          img.onload = () => {
            // Default to full canvas size
            updateLayer(layerId, {
              imageData: dataUrl,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              width: canvasSizeRef.current.width,
              height: canvasSizeRef.current.height
            })
            imageCache.current.set(dataUrl, img)
          }
          img.src = dataUrl
        }
        reader.readAsDataURL(file)
      },
      [updateLayer]
    )

    // --- Rendering Functions ---

    // Get or create FFTParser for a layer with frequency filtering
    const getFFTParser = useCallback(
      (layerId: string, minFrequency: number, maxFrequency: number, maxDecibels: number, smoothing: number): FFTParser => {
        const cacheKey = `${layerId}-${minFrequency}-${maxFrequency}-${maxDecibels}-${smoothing}`
        let parser = fftParserCache.current.get(cacheKey)

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
          fftParserCache.current.set(cacheKey, parser)
        }

        return parser
      },
      []
    )

    // Get or create WaveParser for a layer
    const getWaveParser = useCallback(
      (layerId: string, smoothing: number): WaveParser => {
        const cacheKey = `${layerId}-${smoothing}`
        let parser = waveParserCache.current.get(cacheKey)

        if (!parser) {
          parser = new WaveParser({ smoothingTimeConstant: smoothing })
          waveParserCache.current.set(cacheKey, parser)
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
        } else if (data instanceof Float32Array) {
          inputData = new Uint8Array(data.length)
          for (let i = 0; i < data.length; i++) inputData[i] = Math.round(data[i] * 255)
        } else {
          inputData = new Uint8Array(data.map(v => Math.round(v * 255)))
        }
        return parser.parseFFT(inputData, targetBins)
      },
      [getFFTParser]
    )

    const smoothData = useCallback((data: number[], smoothing: number): number[] => {
      if (smoothedDataRef.current.length !== data.length) {
        smoothedDataRef.current = [...data]
        return data
      }

      const smoothed = data.map((val, i) => {
        const prev = smoothedDataRef.current[i] || 0
        return prev * smoothing + val * (1 - smoothing)
      })
      smoothedDataRef.current = smoothed
      return smoothed
    }, [])

    const renderBarSpectrum = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        layer: BarSpectrumLayer,
        data: AudioDataArray,
        centerX: number,
        centerY: number
      ) => {
        // Calculate number of bars to display
        const numBars = Math.max(1, Math.floor(layer.width / (layer.barWidth + layer.barSpacing)))

        // Use FFTParser for per-layer frequency filtering and dB normalization
        // This applies minFrequency, maxFrequency, maxDecibels, and smoothing per-layer
        const parsedData = parseAudioData(
          data,
          layer.id,
          layer.minFrequency,
          layer.maxFrequency,
          layer.maxDecibels,
          layer.smoothing,
          numBars // Target number of output bins
        )

        ctx.save()
        ctx.translate(centerX + layer.x, centerY + layer.y)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.scale(layer.scale, layer.scale)
        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

        const startX = -layer.width / 2

        // Create single gradient for all bars (optimization)
        const gradient = ctx.createLinearGradient(0, 0, 0, -layer.height)
        gradient.addColorStop(0, layer.barColor)
        gradient.addColorStop(1, layer.barColorEnd)
        ctx.fillStyle = gradient

        for (let i = 0; i < numBars; i++) {
          const amplitude = parsedData[i] || 0
          const barHeight = amplitude * layer.height

          const x = startX + i * (layer.barWidth + layer.barSpacing)
          ctx.fillRect(x, 0, layer.barWidth, -barHeight)

          if (layer.mirror) {
            ctx.fillRect(x, 0, layer.barWidth, barHeight)
          }
        }

        // Draw shadow separately if needed
        if (layer.shadowHeight > 0) {
          ctx.fillStyle = layer.shadowColor
          ctx.globalAlpha = layer.opacity * 0.3
          for (let i = 0; i < numBars; i++) {
            const amplitude = parsedData[i] || 0
            const barHeight = amplitude * layer.height
            const x = startX + i * (layer.barWidth + layer.barSpacing)
            ctx.fillRect(x, 0, layer.barWidth, Math.min(barHeight * 0.5, layer.shadowHeight))
          }
        }

        ctx.restore()
      },
      [parseAudioData]
    )

    const renderWaveSpectrum = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        layer: WaveSpectrumLayer,
        data: AudioDataArray,
        centerX: number,
        centerY: number
      ) => {
        // Use FFTParser for per-layer frequency filtering
        const numPoints = Math.max(2, Math.floor(layer.width / 4)) // ~4px per point for smooth curve
        const parsedData = parseAudioData(
          data,
          layer.id,
          layer.minFrequency,
          layer.maxFrequency,
          -12, // Default maxDecibels for wave spectrum
          layer.smoothing,
          numPoints
        )

        ctx.save()
        ctx.translate(centerX + layer.x, centerY + layer.y)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.scale(layer.scale, layer.scale)
        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

        const startX = -layer.width / 2
        const pointSpacing = layer.width / (parsedData.length - 1)

        ctx.beginPath()
        ctx.moveTo(startX, 0)

        for (let i = 0; i < parsedData.length; i++) {
          const x = startX + i * pointSpacing
          const y = -parsedData[i] * layer.height
          if (i === 0) {
            ctx.lineTo(x, y)
          } else {
            const prevX = startX + (i - 1) * pointSpacing
            const prevY = -(parsedData[i - 1] || 0) * layer.height
            const cpX = (prevX + x) / 2
            ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2)
          }
        }

        if (layer.fill) {
          ctx.lineTo(startX + layer.width, 0)
          ctx.closePath()
          ctx.fillStyle = layer.fillColor
          ctx.fill()
        }

        ctx.strokeStyle = layer.lineColor
        ctx.lineWidth = layer.lineWidth
        ctx.stroke()

        ctx.restore()
      },
      [parseAudioData]
    )

    // NEW: Horizontal SoundWave like Astrofox
    const renderSoundWave = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        layer: SoundWaveLayer,
        data: AudioDataArray,
        centerX: number,
        centerY: number
      ) => {
        ctx.save()
        ctx.translate(centerX + layer.x, centerY + layer.y)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.scale(layer.scale, layer.scale)
        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

        const startX = -layer.width / 2
        const step = Math.max(1, Math.floor(data.length * layer.wavelength * 0.25))
        const sampledData: number[] = []
        for (let i = 0; i < data.length; i += step) {
          sampledData.push(data[i])
        }

        // Apply smoothing
        const smoothedData = sampledData.map((val, i) => {
          if (i === 0 || i === sampledData.length - 1) return val
          const prev = sampledData[i - 1]
          const next = sampledData[i + 1]
          return prev * layer.smooth * 0.25 + val * (1 - layer.smooth * 0.5) + next * layer.smooth * 0.25
        })

        const pointSpacing = layer.width / (smoothedData.length - 1 || 1)

        ctx.beginPath()

        for (let i = 0; i < smoothedData.length; i++) {
          const x = startX + i * pointSpacing
          const amplitude = (smoothedData[i] - 0.5) * 2 // Center around 0
          const y = amplitude * layer.height * 0.5

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        if (layer.useFill) {
          ctx.lineTo(startX + layer.width, 0)
          ctx.lineTo(startX, 0)
          ctx.closePath()
          ctx.fillStyle = layer.fillColor
          ctx.fill()
        }

        ctx.strokeStyle = layer.color
        ctx.lineWidth = layer.lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()

        ctx.restore()
      },
      []
    )

    // Renamed: Circle/line mode
    const renderSoundWave2 = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        layer: SoundWave2Layer,
        data: AudioDataArray,
        centerX: number,
        centerY: number
      ) => {
        ctx.save()
        ctx.translate(centerX + layer.x, centerY + layer.y)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.scale(layer.scale, layer.scale)
        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

        if (layer.mode === 'circle') {
          ctx.beginPath()
          for (let i = 0; i < data.length; i++) {
            const angle = (i / data.length) * Math.PI * 2
            const r = layer.radius + data[i] * layer.radius * layer.sensitivity
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.closePath()
        } else {
          ctx.beginPath()
          const lineWidth = layer.radius * 2
          const startX = -lineWidth / 2
          const pointSpacing = lineWidth / (data.length - 1)

          for (let i = 0; i < data.length; i++) {
            const x = startX + i * pointSpacing
            const y = -data[i] * layer.radius * layer.sensitivity
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
        }

        ctx.strokeStyle = layer.lineColor
        ctx.lineWidth = layer.lineWidth
        ctx.stroke()

        ctx.restore()
      },
      []
    )

    const renderText = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        layer: TextLayer,
        data: AudioDataArray,
        centerX: number,
        centerY: number
      ) => {
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        const avgAmplitude = data.length > 0 ? sum / data.length : 0
        const reactiveScale = layer.audioReactive ? 1 + avgAmplitude * layer.reactiveScale : 1

        ctx.save()
        ctx.translate(centerX + layer.x, centerY + layer.y)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.scale(layer.scale * reactiveScale, layer.scale * reactiveScale)
        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

        const fontStyle = layer.italic ? 'italic ' : ''
        const fontWeight = layer.bold ? 'bold ' : ''
        ctx.font = `${fontStyle}${fontWeight}${layer.fontSize}px "${layer.font}"`
        ctx.fillStyle = layer.color
        ctx.textAlign = layer.textAlign
        ctx.textBaseline = 'middle'

        ctx.fillText(layer.text, 0, 0)

        ctx.restore()
      },
      []
    )

    const renderImage = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        layer: ImageLayer,
        _data: AudioDataArray,
        centerX: number,
        centerY: number
      ) => {
        const source = layer.imageData || layer.imageUrl
        if (!source) return

        let img = imageCache.current.get(source)
        if (!img) {
          img = new Image()
          img.src = source
          // Handle cross-origin images for canvas
          if (source.startsWith('http')) {
            img.crossOrigin = 'Anonymous'
          }
          imageCache.current.set(source, img)
          return // Wait for load
        }

        if (!img.complete) return

        ctx.save()
        ctx.translate(centerX + layer.x, centerY + layer.y)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.scale(layer.scale, layer.scale)
        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

        const drawWidth = layer.width || img.naturalWidth
        const drawHeight = layer.height || img.naturalHeight

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

        ctx.restore()
      },
      []
    )

    // Helper to get cached geometry data
    const getGeometryData = useCallback((shape: string, size: number) => {
      const cacheKey = `${shape}-${size}`
      const cached = geometryCache.current.get(cacheKey)
      if (cached) return cached

      let vertices: [number, number, number][] = []
      let edges: [number, number][] = []
      let faces: [number, number, number][] = [] // Triangle indices for solid rendering
      const s = size / 2

      switch (shape) {
        case 'Box':
          vertices = [
            [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
            [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
          ]
          edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
          ]
          // Box faces (2 triangles per face, 6 faces)
          faces = [
            [0, 1, 2], [0, 2, 3], // Front
            [4, 6, 5], [4, 7, 6], // Back
            [0, 4, 5], [0, 5, 1], // Bottom
            [2, 6, 7], [2, 7, 3], // Top
            [0, 3, 7], [0, 7, 4], // Left
            [1, 5, 6], [1, 6, 2]  // Right
          ]
          break
        case 'Sphere': {
          const t = (1 + Math.sqrt(5)) / 2
          const r = s * 0.7
          vertices = [
            [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
            [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
            [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
          ].map(([x, y, z]) => [x * r / t, y * r / t, z * r / t] as [number, number, number])
          edges = [
            [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
            [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
            [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
            [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
            [4, 5], [2, 11], [6, 10], [8, 7], [9, 1]
          ]
          // Icosahedron faces (20 triangles)
          faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
          ]
          break
        }
        case 'Dodecahedron': {
          const phi = (1 + Math.sqrt(5)) / 2
          const r = s * 0.5
          vertices = [
            [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
            [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
            [0, phi, 1/phi], [0, phi, -1/phi], [0, -phi, 1/phi], [0, -phi, -1/phi],
            [1/phi, 0, phi], [1/phi, 0, -phi], [-1/phi, 0, phi], [-1/phi, 0, -phi],
            [phi, 1/phi, 0], [phi, -1/phi, 0], [-phi, 1/phi, 0], [-phi, -1/phi, 0]
          ].map(([x, y, z]) => [x * r, y * r, z * r] as [number, number, number])
          edges = [
            [0, 16], [0, 8], [0, 12], [16, 17], [16, 1],
            [8, 4], [8, 9], [12, 2], [12, 14], [17, 2],
            [1, 9], [4, 14], [9, 5], [5, 18], [18, 4],
            [14, 6], [6, 19], [19, 18], [2, 10], [10, 6],
            [17, 3], [3, 11], [11, 10], [1, 13], [13, 3],
            [5, 15], [15, 13], [15, 7], [7, 19], [7, 11]
          ]
          // Dodecahedron faces (12 pentagons triangulated = 36 triangles)
          // Each pentagon split into 3 triangles
          faces = [
            [0, 8, 4], [0, 4, 14], [0, 14, 12], // Pentagon 1
            [0, 12, 2], [0, 2, 17], [0, 17, 16], // Pentagon 2
            [0, 16, 1], [0, 1, 9], [0, 9, 8], // Pentagon 3
            [8, 9, 5], [8, 5, 18], [8, 18, 4], // Pentagon 4
            [4, 18, 19], [4, 19, 6], [4, 6, 14], // Pentagon 5
            [14, 6, 10], [14, 10, 2], [14, 2, 12], // Pentagon 6
            [2, 10, 11], [2, 11, 3], [2, 3, 17], // Pentagon 7
            [17, 3, 13], [17, 13, 1], [17, 1, 16], // Pentagon 8
            [1, 13, 15], [1, 15, 5], [1, 5, 9], // Pentagon 9
            [5, 15, 7], [5, 7, 19], [5, 19, 18], // Pentagon 10
            [19, 7, 11], [19, 11, 10], [19, 10, 6], // Pentagon 11
            [7, 15, 13], [7, 13, 3], [7, 3, 11] // Pentagon 12
          ]
          break
        }
        case 'Icosahedron': {
          const phi = (1 + Math.sqrt(5)) / 2
          const r = s * 0.6
          vertices = [
            [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
            [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
            [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
          ].map(([x, y, z]) => [x * r, y * r, z * r] as [number, number, number])
          edges = [
            [0, 1], [0, 4], [0, 5], [0, 8], [0, 9],
            [1, 6], [1, 7], [1, 8], [1, 9],
            [2, 3], [2, 4], [2, 5], [2, 10], [2, 11],
            [3, 6], [3, 7], [3, 10], [3, 11],
            [4, 5], [4, 8], [4, 10], [5, 9], [5, 11],
            [6, 7], [6, 8], [6, 10], [7, 9], [7, 11],
            [8, 10], [9, 11]
          ]
          // Icosahedron faces (20 triangles)
          faces = [
            [0, 8, 1], [0, 4, 8], [0, 5, 4], [0, 9, 5], [0, 1, 9],
            [1, 8, 6], [8, 4, 10], [4, 5, 2], [5, 9, 11], [9, 1, 7],
            [6, 8, 10], [10, 4, 2], [2, 5, 11], [11, 9, 7], [7, 1, 6],
            [3, 6, 10], [3, 10, 2], [3, 2, 11], [3, 11, 7], [3, 7, 6]
          ]
          break
        }
        case 'Octahedron':
          vertices = [
            [s, 0, 0], [-s, 0, 0],
            [0, s, 0], [0, -s, 0],
            [0, 0, s], [0, 0, -s]
          ]
          edges = [
            [0, 2], [0, 3], [0, 4], [0, 5],
            [1, 2], [1, 3], [1, 4], [1, 5],
            [2, 4], [2, 5], [3, 4], [3, 5]
          ]
          // Octahedron faces (8 triangles)
          faces = [
            [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
            [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]
          ]
          break
        case 'Tetrahedron':
          vertices = [
            [s, s, s], [s, -s, -s], [-s, s, -s], [-s, -s, s]
          ]
          edges = [
            [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
          ]
          // Tetrahedron faces (4 triangles)
          faces = [
            [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]
          ]
          break
        case 'Torus': {
          const segments = 16
          const rings = 12
          const outerR = s * 0.6
          const innerR = s * 0.25
          vertices = []
          for (let i = 0; i < segments; i++) {
            const theta = (i / segments) * Math.PI * 2
            for (let j = 0; j < rings; j++) {
              const phi = (j / rings) * Math.PI * 2
              const x = (outerR + innerR * Math.cos(phi)) * Math.cos(theta)
              const y = innerR * Math.sin(phi)
              const z = (outerR + innerR * Math.cos(phi)) * Math.sin(theta)
              vertices.push([x, y, z])
            }
          }
          edges = []
          faces = []
          for (let i = 0; i < segments; i++) {
            for (let j = 0; j < rings; j++) {
              const current = i * rings + j
              const nextJ = i * rings + ((j + 1) % rings)
              const nextI = ((i + 1) % segments) * rings + j
              const nextIJ = ((i + 1) % segments) * rings + ((j + 1) % rings)
              edges.push([current, nextJ])
              edges.push([current, nextI])
              // Add faces (2 triangles per quad)
              faces.push([current, nextI, nextIJ])
              faces.push([current, nextIJ, nextJ])
            }
          }
          break
        }
        case 'Torus Knot': {
          // Torus knot is a curve, not a surface - wireframe only
          const segments = 64
          const p = 2, q = 3
          const radius = s * 0.5
          vertices = []
          for (let i = 0; i < segments; i++) {
            const t = (i / segments) * Math.PI * 2
            const r = radius * (2 + Math.cos(q * t))
            const x = r * Math.cos(p * t)
            const y = radius * Math.sin(q * t) * 1.5
            const z = r * Math.sin(p * t)
            vertices.push([x, y, z])
          }
          edges = []
          for (let i = 0; i < segments; i++) {
            edges.push([i, (i + 1) % segments])
          }
          // No faces for torus knot (it's a curve, not a surface)
          faces = []
          break
        }
        default:
          vertices = [
            [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
            [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
          ]
          edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
          ]
          faces = [
            [0, 1, 2], [0, 2, 3], // Front
            [4, 6, 5], [4, 7, 6], // Back
            [0, 4, 5], [0, 5, 1], // Bottom
            [2, 6, 7], [2, 7, 3], // Top
            [0, 3, 7], [0, 7, 4], // Left
            [1, 5, 6], [1, 6, 2]  // Right
          ]
      }

      const result = { vertices, edges, faces }
      geometryCache.current.set(cacheKey, result)
      return result
    }, [])

    // Helper to parse hex color to RGB
    const hexToRgb = useCallback((hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [255, 255, 255]
    }, [])

    // NEW: 3D Geometry rendering with solid faces and shading
    const renderGeometry3D = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        layer: Geometry3DLayer,
        data: AudioDataArray,
        centerX: number,
        centerY: number
      ) => {
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        const avgAmplitude = data.length > 0 ? sum / data.length : 0
        const audioRotation = layer.audioReactive ? avgAmplitude * 2 : 0

        ctx.save()
        ctx.translate(centerX + layer.x, centerY + layer.y)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.scale(layer.scale, layer.scale)
        ctx.globalAlpha = layer.opacity
        ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

        // Get cached geometry
        const { vertices, edges, faces } = getGeometryData(layer.shape, layer.size)

        // Precompute rotation values
        const rotX = ((layer.rotationX + audioRotation * 50) * Math.PI) / 180
        const rotY = ((layer.rotationY + audioRotation * 30) * Math.PI) / 180
        const rotZ = ((layer.rotationZ + audioRotation * 20) * Math.PI) / 180
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
        const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ)

        // Transform and project all vertices
        const transformed: [number, number, number][] = []
        const projected: [number, number][] = []
        for (let i = 0; i < vertices.length; i++) {
          const [vx, vy, vz] = vertices[i]
          // Rotate around X
          const y1 = vy * cosX - vz * sinX
          const z1 = vy * sinX + vz * cosX
          // Rotate around Y
          const x2 = vx * cosY + z1 * sinY
          const z2 = -vx * sinY + z1 * cosY
          // Rotate around Z
          const x3 = x2 * cosZ - y1 * sinZ
          const y3 = x2 * sinZ + y1 * cosZ
          transformed[i] = [x3, y3, z2]
          // Perspective projection
          const scale = 400 / (400 + z2)
          projected[i] = [x3 * scale, y3 * scale]
        }

        // Light direction (from top-right-front)
        const lightDir: [number, number, number] = [0.5, -0.7, 0.5]
        const lightLen = Math.sqrt(lightDir[0] * lightDir[0] + lightDir[1] * lightDir[1] + lightDir[2] * lightDir[2])
        lightDir[0] /= lightLen
        lightDir[1] /= lightLen
        lightDir[2] /= lightLen

        // Parse base color
        const [baseR, baseG, baseB] = hexToRgb(layer.color)

        // Solid rendering with faces
        if (!layer.wireframe && faces.length > 0) {
          // Calculate face data for sorting
          const faceData: { idx: number; depth: number; normal: [number, number, number] }[] = []

          for (let i = 0; i < faces.length; i++) {
            const [i0, i1, i2] = faces[i]
            const v0 = transformed[i0]
            const v1 = transformed[i1]
            const v2 = transformed[i2]
            if (!v0 || !v1 || !v2) continue

            // Calculate face normal (cross product)
            const ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2]
            const bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2]
            const nx = ay * bz - az * by
            const ny = az * bx - ax * bz
            const nz = ax * by - ay * bx
            const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
            const normal: [number, number, number] = nLen > 0 ? [nx / nLen, ny / nLen, nz / nLen] : [0, 0, 1]

            // Backface culling - skip faces pointing away
            if (normal[2] < 0) continue

            // Average depth for sorting
            const depth = (v0[2] + v1[2] + v2[2]) / 3

            faceData.push({ idx: i, depth, normal })
          }

          // Sort faces by depth (far to near)
          faceData.sort((a, b) => a.depth - b.depth)

          // Render faces
          for (const face of faceData) {
            const [i0, i1, i2] = faces[face.idx]
            const p0 = projected[i0]
            const p1 = projected[i1]
            const p2 = projected[i2]
            if (!p0 || !p1 || !p2) continue

            // Calculate lighting based on material type
            let intensity = 0.3 // Ambient
            const [nx, ny, nz] = face.normal
            const diffuse = Math.max(0, nx * lightDir[0] + ny * lightDir[1] + nz * lightDir[2])

            switch (layer.material) {
              case 'Basic':
                intensity = 1
                break
              case 'Lambert':
                intensity = 0.3 + diffuse * 0.7
                break
              case 'Phong':
              case 'Standard': {
                const spec = Math.pow(Math.max(0, nz), 32)
                intensity = 0.3 + diffuse * 0.5 + spec * 0.4
                break
              }
              case 'Normal':
                ctx.fillStyle = `rgb(${Math.floor((nx + 1) * 127.5)}, ${Math.floor((ny + 1) * 127.5)}, ${Math.floor((nz + 1) * 127.5)})`
                break
              default:
                intensity = 0.3 + diffuse * 0.7
            }

            // Apply shading boost for smooth
            if (layer.shading === 'Smooth') {
              intensity = Math.min(1, intensity * 1.1)
            }

            // Set fill color
            if (layer.material !== 'Normal') {
              const r = Math.min(255, Math.floor(baseR * intensity))
              const g = Math.min(255, Math.floor(baseG * intensity))
              const b = Math.min(255, Math.floor(baseB * intensity))
              ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
            }

            // Draw filled triangle
            ctx.beginPath()
            ctx.moveTo(p0[0], p0[1])
            ctx.lineTo(p1[0], p1[1])
            ctx.lineTo(p2[0], p2[1])
            ctx.closePath()
            ctx.fill()

            // Draw edges if enabled
            if (layer.edges) {
              ctx.strokeStyle = layer.edgeColor
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        } else {
          // Wireframe mode
          ctx.strokeStyle = layer.color
          ctx.lineWidth = 2
          ctx.beginPath()
          for (let i = 0; i < edges.length; i++) {
            const [i1, i2] = edges[i]
            const p1 = projected[i1]
            const p2 = projected[i2]
            if (p1 && p2) {
              ctx.moveTo(p1[0], p1[1])
              ctx.lineTo(p2[0], p2[1])
            }
          }
          ctx.stroke()
        }

        ctx.restore()
      },
      [getGeometryData, hexToRgb]
    )

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
      for (const layer of config.layers) {
        if (!layer.visible) continue

        switch (layer.type) {
          case 'barSpectrum':
            renderBarSpectrum(ctx, layer as BarSpectrumLayer, audioData, centerX, centerY)
            break
          case 'waveSpectrum':
            renderWaveSpectrum(ctx, layer as WaveSpectrumLayer, audioData, centerX, centerY)
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
            renderImage(ctx, layer as ImageLayer, audioData, centerX, centerY)
            break
          case 'geometry3d':
            renderGeometry3D(ctx, layer as Geometry3DLayer, audioData, centerX, centerY)
            break
          case 'group':
            // Groups render their children - handled separately
            break
        }
      }
    }, [
      config.layers,
      config.backgroundColor,
      audioData,
      renderBarSpectrum,
      renderWaveSpectrum,
      renderSoundWave,
      renderSoundWave2,
      renderText,
      renderImage,
      renderGeometry3D
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

      return () => window.removeEventListener('resize', handleResize)
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

    // --- Render Controls Panel ---

    const renderLayerControls = () => {
      if (!selectedLayer) {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Select a layer to edit its properties
          </Typography>
        )
      }

      const commonControls = (
        <>
          <TextField
            fullWidth
            size="small"
            label="Name"
            value={selectedLayer.name}
            onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" color="text.secondary">
            Opacity: {selectedLayer.opacity.toFixed(2)}
          </Typography>
          <Slider
            value={selectedLayer.opacity}
            onChange={(_, v) => updateLayer(selectedLayer.id, { opacity: v as number })}
            min={0}
            max={1}
            step={0.01}
            size="small"
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                X: {selectedLayer.x}
              </Typography>
              <Slider
                value={selectedLayer.x}
                onChange={(_, v) => updateLayer(selectedLayer.id, { x: v as number })}
                min={-500}
                max={500}
                size="small"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Y: {selectedLayer.y}
              </Typography>
              <Slider
                value={selectedLayer.y}
                onChange={(_, v) => updateLayer(selectedLayer.id, { y: v as number })}
                min={-500}
                max={500}
                size="small"
              />
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Rotation: {selectedLayer.rotation}°
          </Typography>
          <Slider
            value={selectedLayer.rotation}
            onChange={(_, v) => updateLayer(selectedLayer.id, { rotation: v as number })}
            min={0}
            max={360}
            size="small"
          />

          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Blending</InputLabel>
            <Select
              value={selectedLayer.blendMode}
              label="Blending"
              onChange={(e: SelectChangeEvent) =>
                updateLayer(selectedLayer.id, { blendMode: e.target.value as (typeof BLEND_MODES)[number] })
              }
            >
              {BLEND_MODES.map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1).replace(/-/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />
        </>
      )

      // Type-specific controls
      const typeControls = (() => {
        switch (selectedLayer.type) {
          case 'barSpectrum': {
            const layer = selectedLayer as BarSpectrumLayer
            return (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  BAR SPECTRUM
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    size="small"
                    label="Bar Width"
                    type="number"
                    value={layer.barWidth}
                    onChange={(e) => updateLayer(layer.id, { barWidth: Number(e.target.value) })}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Spacing"
                    type="number"
                    value={layer.barSpacing}
                    onChange={(e) => updateLayer(layer.id, { barSpacing: Number(e.target.value) })}
                    sx={{ flex: 1 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    size="small"
                    label="Bar Color"
                    type="color"
                    value={layer.barColor}
                    onChange={(e) => updateLayer(layer.id, { barColor: e.target.value })}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="End Color"
                    type="color"
                    value={layer.barColorEnd}
                    onChange={(e) => updateLayer(layer.id, { barColorEnd: e.target.value })}
                    sx={{ flex: 1 }}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Max dB: {layer.maxDecibels}
                </Typography>
                <Slider
                  value={layer.maxDecibels}
                  onChange={(_, v) => updateLayer(layer.id, { maxDecibels: v as number })}
                  min={-40}
                  max={0}
                  size="small"
                />

                <Typography variant="caption" color="text.secondary">
                  Smoothing: {layer.smoothing.toFixed(2)}
                </Typography>
                <Slider
                  value={layer.smoothing}
                  onChange={(_, v) => updateLayer(layer.id, { smoothing: v as number })}
                  min={0}
                  max={0.99}
                  step={0.01}
                  size="small"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={layer.mirror}
                      onChange={(e) => updateLayer(layer.id, { mirror: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Mirror"
                />
              </>
            )
          }

          case 'text': {
            const layer = selectedLayer as TextLayer
            return (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  TEXT
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Text"
                  value={layer.text}
                  onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Font</InputLabel>
                  <Select
                    value={layer.font}
                    label="Font"
                    onChange={(e: SelectChangeEvent) => updateLayer(layer.id, { font: e.target.value })}
                  >
                    {AVAILABLE_FONTS.map((font) => (
                      <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
                        {font}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Size"
                  type="number"
                  value={layer.fontSize}
                  onChange={(e) => updateLayer(layer.id, { fontSize: Number(e.target.value) })}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layer.bold}
                        onChange={(e) => updateLayer(layer.id, { bold: e.target.checked })}
                        size="small"
                      />
                    }
                    label="Bold"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={layer.italic}
                        onChange={(e) => updateLayer(layer.id, { italic: e.target.checked })}
                        size="small"
                      />
                    }
                    label="Italic"
                  />
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  label="Color"
                  type="color"
                  value={layer.color}
                  onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={layer.audioReactive}
                      onChange={(e) => updateLayer(layer.id, { audioReactive: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Audio Reactive"
                />
              </>
            )
          }

          case 'image': {
            const layer = selectedLayer as ImageLayer
            return (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  IMAGE
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Image URL"
                  value={layer.imageUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value
                    // Create an image to get dimensions
                    const img = new Image()
                    img.onload = () => {
                      updateLayer(layer.id, {
                        imageUrl: url,
                        imageData: '', // Clear blob data if URL is used
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        width: layer.width || canvasSizeRef.current.width, // Set default width if 0
                        height: layer.height || canvasSizeRef.current.height
                      })
                      imageCache.current.set(url, img) // Cache it
                    }
                    img.src = url
                    // Update state immediately for UI responsiveness
                    updateLayer(layer.id, { imageUrl: url, imageData: '' })
                  }}
                  sx={{ mb: 2 }}
                  placeholder="https://example.com/image.png"
                />

                <Divider sx={{ my: 1, color: 'text.secondary', fontSize: '0.75rem' }}>OR</Divider>

                <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
                  {layer.imageData ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageUpload(layer.id, e)}
                  />
                </Button>

                {layer.imageData && (
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={layer.imageData}
                      alt="Preview"
                      style={{ width: '100%', maxHeight: 100, objectFit: 'contain' }}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    size="small"
                    label="Width"
                    type="number"
                    value={layer.width}
                    onChange={(e) => updateLayer(layer.id, { width: Number(e.target.value) })}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Height"
                    type="number"
                    value={layer.height}
                    onChange={(e) => updateLayer(layer.id, { height: Number(e.target.value) })}
                    sx={{ flex: 1 }}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={layer.fixed}
                      onChange={(e) => updateLayer(layer.id, { fixed: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Lock Aspect Ratio"
                />
              </>
            )
          }

          case 'soundWave': {
            const layer = selectedLayer as SoundWaveLayer
            return (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  SOUNDWAVE
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Color"
                  type="color"
                  value={layer.color}
                  onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                  sx={{ mb: 2 }}
                />

                <Typography variant="caption" color="text.secondary">
                  Line Width: {layer.lineWidth}
                </Typography>
                <Slider
                  value={layer.lineWidth}
                  onChange={(_, v) => updateLayer(layer.id, { lineWidth: v as number })}
                  min={1}
                  max={10}
                  size="small"
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    size="small"
                    label="Width"
                    type="number"
                    value={layer.width}
                    onChange={(e) => updateLayer(layer.id, { width: Number(e.target.value) })}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Height"
                    type="number"
                    value={layer.height}
                    onChange={(e) => updateLayer(layer.id, { height: Number(e.target.value) })}
                    sx={{ flex: 1 }}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Wavelength: {layer.wavelength.toFixed(2)}
                </Typography>
                <Slider
                  value={layer.wavelength}
                  onChange={(_, v) => updateLayer(layer.id, { wavelength: v as number })}
                  min={0}
                  max={1}
                  step={0.01}
                  size="small"
                />

                <Typography variant="caption" color="text.secondary">
                  Smooth: {layer.smooth.toFixed(2)}
                </Typography>
                <Slider
                  value={layer.smooth}
                  onChange={(_, v) => updateLayer(layer.id, { smooth: v as number })}
                  min={0}
                  max={0.99}
                  step={0.01}
                  size="small"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={layer.useFill}
                      onChange={(e) => updateLayer(layer.id, { useFill: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Fill"
                />
              </>
            )
          }

          case 'soundWave2': {
            const layer = selectedLayer as SoundWave2Layer
            return (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  SOUND WAVE 2
                </Typography>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Mode</InputLabel>
                  <Select
                    value={layer.mode}
                    label="Mode"
                    onChange={(e) =>
                      updateLayer(layer.id, { mode: e.target.value as 'circle' | 'line' })
                    }
                  >
                    <MenuItem value="circle">Circle</MenuItem>
                    <MenuItem value="line">Line</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="caption" color="text.secondary">
                  Radius: {layer.radius}
                </Typography>
                <Slider
                  value={layer.radius}
                  onChange={(_, v) => updateLayer(layer.id, { radius: v as number })}
                  min={50}
                  max={400}
                  size="small"
                />

                <Typography variant="caption" color="text.secondary">
                  Sensitivity: {layer.sensitivity.toFixed(2)}
                </Typography>
                <Slider
                  value={layer.sensitivity}
                  onChange={(_, v) => updateLayer(layer.id, { sensitivity: v as number })}
                  min={0.1}
                  max={3}
                  step={0.1}
                  size="small"
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Line Color"
                  type="color"
                  value={layer.lineColor}
                  onChange={(e) => updateLayer(layer.id, { lineColor: e.target.value })}
                />
              </>
            )
          }

          case 'geometry3d': {
            const layer = selectedLayer as Geometry3DLayer
            return (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  3D GEOMETRY
                </Typography>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Shape</InputLabel>
                  <Select
                    value={layer.shape}
                    label="Shape"
                    onChange={(e: SelectChangeEvent) =>
                      updateLayer(layer.id, { shape: e.target.value as (typeof GEOMETRY_SHAPES)[number] })
                    }
                  >
                    {GEOMETRY_SHAPES.map((shape) => (
                      <MenuItem key={shape} value={shape}>
                        {shape}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Material</InputLabel>
                  <Select
                    value={layer.material}
                    label="Material"
                    onChange={(e: SelectChangeEvent) =>
                      updateLayer(layer.id, {
                        material: e.target.value as (typeof GEOMETRY_MATERIALS)[number]
                      })
                    }
                  >
                    {GEOMETRY_MATERIALS.map((mat) => (
                      <MenuItem key={mat} value={mat}>
                        {mat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Shading</InputLabel>
                  <Select
                    value={layer.shading}
                    label="Shading"
                    onChange={(e: SelectChangeEvent) =>
                      updateLayer(layer.id, { shading: e.target.value as (typeof SHADING_TYPES)[number] })
                    }
                  >
                    {SHADING_TYPES.map((shade) => (
                      <MenuItem key={shade} value={shade}>
                        {shade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Color"
                  type="color"
                  value={layer.color}
                  onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={layer.wireframe}
                      onChange={(e) => updateLayer(layer.id, { wireframe: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Wireframe"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={layer.edges}
                      onChange={(e) => updateLayer(layer.id, { edges: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Edges"
                />

                {layer.edges && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Edge Color"
                    type="color"
                    value={layer.edgeColor}
                    onChange={(e) => updateLayer(layer.id, { edgeColor: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                )}

                <Typography variant="caption" color="text.secondary">
                  X: {layer.rotationX}
                </Typography>
                <Slider
                  value={layer.rotationX}
                  onChange={(_, v) => updateLayer(layer.id, { rotationX: v as number })}
                  min={0}
                  max={360}
                  size="small"
                />

                <Typography variant="caption" color="text.secondary">
                  Y: {layer.rotationY}
                </Typography>
                <Slider
                  value={layer.rotationY}
                  onChange={(_, v) => updateLayer(layer.id, { rotationY: v as number })}
                  min={0}
                  max={360}
                  size="small"
                />

                <Typography variant="caption" color="text.secondary">
                  Z: {layer.rotationZ}
                </Typography>
                <Slider
                  value={layer.rotationZ}
                  onChange={(_, v) => updateLayer(layer.id, { rotationZ: v as number })}
                  min={0}
                  max={360}
                  size="small"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={layer.audioReactive}
                      onChange={(e) => updateLayer(layer.id, { audioReactive: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Audio Reactive"
                />
              </>
            )
          }

          case 'group': {
            const layer = selectedLayer as GroupLayer
            return (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  GROUP
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={layer.mask}
                      onChange={(e) => updateLayer(layer.id, { mask: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Mask"
                />

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Groups are containers for organizing layers. Child layer support coming soon.
                </Typography>
              </>
            )
          }

          default:
            return null
        }
      })()

      return (
        <Box sx={{ p: 2 }}>
          {commonControls}
          {typeControls}
        </Box>
      )
    }

    // Render controls function - exposed via ref for external rendering
    const renderControls = useCallback((): React.ReactNode => {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'row', overflow: 'hidden', maxHeight: 500 }}>
          {/* Layers Section */}
          <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
            <ListItemButton onClick={() => setLayersExpanded(!layersExpanded)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Layers fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="LAYERS" primaryTypographyProps={{ variant: 'overline' }} />
              {layersExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={layersExpanded}>
              <List dense sx={{ maxHeight: 250, overflow: 'auto', py: 0 }}>
                {[...topLevelLayers].reverse().map((layer) => {
                  const isGroup = layer.type === 'group'
                  const groupLayer = isGroup ? (layer as GroupLayer) : null
                  const isExpanded = expandedGroups.has(layer.id)
                  const isDragging = draggedLayerId === layer.id
                  const isDropTarget = dropTargetId === layer.id
                  const showDropAbove = isDropTarget && dropPosition === 'above'
                  const showDropBelow = isDropTarget && dropPosition === 'below'
                  const showDropInside = isDropTarget && dropPosition === 'inside' && isGroup

                  return (
                    <Box key={layer.id}>
                      <ListItem
                        disablePadding
                        draggable
                        onDragStart={(e) => handleDragStart(e, layer.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, layer.id, isGroup)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, layer.id)}
                        sx={{
                          opacity: isDragging ? 0.5 : 1,
                          bgcolor: showDropInside ? 'action.hover' : 'transparent',
                          borderTop: showDropAbove ? '2px solid' : 'none',
                          borderBottom: showDropBelow ? '2px solid' : 'none',
                          borderLeft: showDropInside ? '3px solid' : 'none',
                          borderColor: 'primary.main',
                          cursor: 'grab',
                          transition: 'border 0.1s ease'
                        }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isGroup && groupLayer && groupLayer.childIds.length > 0 && (
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleGroupExpanded(layer.id)
                                }}
                              >
                                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                              </IconButton>
                            )}
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLayerVisibility(layer.id)
                              }}
                            >
                              {layer.visible ? (
                                <Visibility fontSize="small" />
                              ) : (
                                <VisibilityOff fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemButton
                          selected={selectedLayerId === layer.id}
                          onClick={() => setSelectedLayerId(layer.id)}
                          sx={{ py: 0.5 }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>{LAYER_ICONS[layer.type]}</ListItemIcon>
                          <ListItemText
                            primary={layer.name}
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: { opacity: layer.visible ? 1 : 0.5 }
                            }}
                          />
                        </ListItemButton>
                      </ListItem>

                      {/* Render children of groups */}
                      {isGroup && groupLayer && isExpanded && (
                        <Collapse in={isExpanded}>
                          <List dense sx={{ py: 0, pl: 2, borderLeft: '1px solid', borderColor: 'divider', ml: 2 }}>
                            {groupLayer.childIds.map((childId) => {
                              const childLayer = config.layers.find((l) => l.id === childId)
                              if (!childLayer) return null
                              const isChildDragging = draggedLayerId === childId
                              const isChildDropTarget = dropTargetId === childId
                              const showChildDropAbove = isChildDropTarget && dropPosition === 'above'
                              const showChildDropBelow = isChildDropTarget && dropPosition === 'below'

                              return (
                                <ListItem
                                  key={childId}
                                  disablePadding
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, childId)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => handleDragOver(e, childId, false)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, childId)}
                                  sx={{
                                    opacity: isChildDragging ? 0.5 : 1,
                                    cursor: 'grab',
                                    borderTop: showChildDropAbove ? '2px solid' : 'none',
                                    borderBottom: showChildDropBelow ? '2px solid' : 'none',
                                    borderColor: 'primary.main',
                                    transition: 'border 0.1s ease'
                                  }}
                                  secondaryAction={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Tooltip title="Remove from group">
                                        <IconButton
                                          edge="end"
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            removeFromGroup(childId)
                                          }}
                                        >
                                          <KeyboardArrowUp fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleLayerVisibility(childId)
                                        }}
                                      >
                                        {childLayer.visible ? (
                                          <Visibility fontSize="small" />
                                        ) : (
                                          <VisibilityOff fontSize="small" />
                                        )}
                                      </IconButton>
                                    </Box>
                                  }
                                >
                                  <ListItemButton
                                    selected={selectedLayerId === childId}
                                    onClick={() => setSelectedLayerId(childId)}
                                    sx={{ py: 0.5 }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 32 }}>{LAYER_ICONS[childLayer.type]}</ListItemIcon>
                                    <ListItemText
                                      primary={childLayer.name}
                                      primaryTypographyProps={{
                                        variant: 'body2',
                                        sx: { opacity: childLayer.visible ? 1 : 0.5 }
                                      }}
                                    />
                                  </ListItemButton>
                                </ListItem>
                              )
                            })}
                          </List>
                        </Collapse>
                      )}
                    </Box>
                  )
                })}
              </List>

              {/* Add Layer Buttons */}
              <Box sx={{ p: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Tooltip title="Bar Spectrum">
                  <IconButton size="small" onClick={() => addLayer('barSpectrum')}>
                    <BarChart fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Geometry (3D)">
                  <IconButton size="small" onClick={() => addLayer('geometry3d')}>
                    <ViewInAr fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Image">
                  <IconButton size="small" onClick={() => addLayer('image')}>
                    <ImageIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Soundwave">
                  <IconButton size="small" onClick={() => addLayer('soundWave')}>
                    <Timeline fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Text">
                  <IconButton size="small" onClick={() => addLayer('text')}>
                    <TextFields fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Wave Spectrum">
                  <IconButton size="small" onClick={() => addLayer('waveSpectrum')}>
                    <GraphicEq fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sound Wave 2">
                  <IconButton size="small" onClick={() => addLayer('soundWave2')}>
                    <GraphicEq fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Group">
                  <IconButton size="small" onClick={() => addLayer('group')}>
                    <Folder fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Collapse>
          </Box>

          {/* Controls Section */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <ListItemButton onClick={() => setControlsExpanded(!controlsExpanded)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Tune fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="CONTROLS" primaryTypographyProps={{ variant: 'overline' }} />
              {controlsExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={controlsExpanded}>
              {selectedLayer && (
                <Box sx={{ p: 1, display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Move Up">
                    <IconButton size="small" onClick={() => moveLayer(selectedLayer.id, 'up')}>
                      <KeyboardArrowUp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move Down">
                    <IconButton size="small" onClick={() => moveLayer(selectedLayer.id, 'down')}>
                      <KeyboardArrowDown fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Duplicate">
                    <IconButton size="small" onClick={() => duplicateLayer(selectedLayer.id)}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => removeLayer(selectedLayer.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {renderLayerControls()}
            </Collapse>
          </Box>
        </Box>
      )
    }, [
      layersExpanded,
      controlsExpanded,
      topLevelLayers,
      expandedGroups,
      draggedLayerId,
      dropTargetId,
      selectedLayerId,
      selectedLayer,
      config.layers,
      addLayer,
      removeLayer,
      duplicateLayer,
      moveLayer,
      toggleLayerVisibility,
      toggleGroupExpanded,
      removeFromGroup,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      renderLayerControls
    ])

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => canvasRef.current,
        addLayer,
        removeLayer,
        duplicateLayer,
        moveLayer,
        renderControls
      }),
      [addLayer, removeLayer, duplicateLayer, moveLayer, renderControls]
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
