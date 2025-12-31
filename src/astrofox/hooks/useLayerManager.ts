/**
 * useLayerManager Hook
 *
 * Provides layer management functions for adding, removing, updating,
 * and reordering layers in the Astrofox visualizer.
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import type { AstrofoxLayer, AstrofoxLayerType, AstrofoxConfig, GroupLayer } from '../types'
import { createDefaultLayer, generateId } from '../presets/defaults'

export interface UseLayerManagerOptions {
  config: AstrofoxConfig
  onConfigChange?: (config: Partial<AstrofoxConfig>) => void
  canvasSize?: { width: number; height: number }
}

export interface UseLayerManagerResult {
  // State
  selectedLayerId: string | null
  selectedLayer: AstrofoxLayer | null
  expandedGroups: Set<string>
  topLevelLayers: AstrofoxLayer[]

  // Layer CRUD operations
  addLayer: (type: AstrofoxLayerType) => void
  removeLayer: (id: string) => void
  duplicateLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<AstrofoxLayer>) => void

  // Layer ordering
  moveLayer: (id: string, direction: 'up' | 'down') => void
  reorderLayers: (sourceId: string, targetId: string, position: 'above' | 'below' | 'inside') => void

  // Visibility
  toggleLayerVisibility: (id: string) => void

  // Selection
  selectLayer: (id: string | null) => void

  // Groups
  toggleGroupExpanded: (groupId: string) => void
  findParentGroup: (layerId: string) => GroupLayer | null

  // Drag and drop state
  dragState: {
    draggedLayerId: string | null
    dropTargetId: string | null
    dropPosition: 'above' | 'below' | 'inside' | null
  }
  setDraggedLayerId: (id: string | null) => void
  setDropTarget: (id: string | null, position: 'above' | 'below' | 'inside' | null) => void
}

export function useLayerManager({
  config,
  onConfigChange,
  canvasSize = { width: 1920, height: 1080 }
}: UseLayerManagerOptions): UseLayerManagerResult {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | 'inside' | null>(null)

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

  // Selected layer object
  const selectedLayer = useMemo(
    () => config.layers.find((l) => l.id === selectedLayerId) || null,
    [config.layers, selectedLayerId]
  )

  // Top-level layers (not inside any group)
  const topLevelLayers = useMemo(() => {
    const childIds = new Set<string>()
    config.layers.forEach((layer) => {
      if (layer.type === 'group') {
        (layer as GroupLayer).childIds.forEach((id) => childIds.add(id))
      }
    })
    return config.layers.filter((layer) => !childIds.has(layer.id))
  }, [config.layers])

  // Add a new layer
  const addLayer = useCallback(
    (type: AstrofoxLayerType) => {
      const newLayer = createDefaultLayer(
        type,
        layerCountersRef.current[type]++,
        canvasSize.width,
        canvasSize.height
      )
      const updatedLayers = [...config.layers, newLayer]
      onConfigChange?.({ layers: updatedLayers })
      setSelectedLayerId(newLayer.id)
    },
    [config.layers, onConfigChange, canvasSize]
  )

  // Remove a layer
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

  // Duplicate a layer
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

  // Update a layer's properties
  const updateLayer = useCallback(
    (id: string, updates: Partial<AstrofoxLayer>) => {
      const updatedLayers = config.layers.map((l) =>
        l.id === id ? ({ ...l, ...updates } as AstrofoxLayer) : l
      )
      onConfigChange?.({ layers: updatedLayers })
    },
    [config.layers, onConfigChange]
  )

  // Move layer up or down in the stack
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

  // Reorder layers (for drag and drop)
  const reorderLayers = useCallback(
    (sourceId: string, targetId: string, position: 'above' | 'below' | 'inside') => {
      if (sourceId === targetId) return

      const sourceIndex = config.layers.findIndex((l) => l.id === sourceId)
      const targetIndex = config.layers.findIndex((l) => l.id === targetId)

      if (sourceIndex === -1 || targetIndex === -1) return

      const updatedLayers = [...config.layers]
      const [removed] = updatedLayers.splice(sourceIndex, 1)

      if (position === 'inside') {
        // Add to group
        const targetLayer = updatedLayers[targetIndex > sourceIndex ? targetIndex - 1 : targetIndex]
        if (targetLayer?.type === 'group') {
          const group = targetLayer as GroupLayer
          group.childIds = [...group.childIds, sourceId]
        }
        updatedLayers.splice(targetIndex > sourceIndex ? targetIndex : targetIndex + 1, 0, removed)
      } else {
        // Reorder
        const insertIndex = position === 'above'
          ? (targetIndex > sourceIndex ? targetIndex - 1 : targetIndex)
          : (targetIndex > sourceIndex ? targetIndex : targetIndex + 1)
        updatedLayers.splice(insertIndex, 0, removed)
      }

      onConfigChange?.({ layers: updatedLayers })
    },
    [config.layers, onConfigChange]
  )

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback(
    (id: string) => {
      const layer = config.layers.find((l) => l.id === id)
      if (layer) {
        updateLayer(id, { visible: !layer.visible })
      }
    },
    [config.layers, updateLayer]
  )

  // Select a layer
  const selectLayer = useCallback((id: string | null) => {
    setSelectedLayerId(id)
  }, [])

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

  // Set drop target
  const setDropTarget = useCallback((id: string | null, position: 'above' | 'below' | 'inside' | null) => {
    setDropTargetId(id)
    setDropPosition(position)
  }, [])

  return {
    // State
    selectedLayerId,
    selectedLayer,
    expandedGroups,
    topLevelLayers,

    // Layer CRUD
    addLayer,
    removeLayer,
    duplicateLayer,
    updateLayer,

    // Ordering
    moveLayer,
    reorderLayers,

    // Visibility
    toggleLayerVisibility,

    // Selection
    selectLayer,

    // Groups
    toggleGroupExpanded,
    findParentGroup,

    // Drag state
    dragState: {
      draggedLayerId,
      dropTargetId,
      dropPosition
    },
    setDraggedLayerId,
    setDropTarget
  }
}

export default useLayerManager
