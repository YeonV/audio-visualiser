/**
 * Visualizer Registry Utilities
 * 
 * Provides helpers for working with the schema-based visualizer registry
 * and combining it with WebGL visualizers.
 */

import { 
  VISUALIZER_REGISTRY, 
  getVisualizerIds,
  ALL_VISUALIZERS,
  type VisualizerOption
} from '../../_generated'

import {
  WEBGL_VISUALIZERS,
  ALL_WEBGL_VISUALIZERS,
  type WebGLVisualiserId,
  type WebGLVisualizerOption
} from '../../_generated/webgl'

import { type WebGLVisualisationType } from '../../components/Visualisers'

export type VisualisationType = WebGLVisualisationType | Extract<keyof typeof VISUALIZER_REGISTRY, string>

/**
 * All visualizers as flat array with category metadata
 * Combines WebGL and schema-based visualizers
 * Static const array - computed at module load time
 * Use with Autocomplete's groupBy prop: groupBy={(option) => option.category}
 */
export const ALL_VISUALIZERS_WITH_CATEGORIES: Array<VisualizerOption | WebGLVisualizerOption> = [
  // Filter out WebGL visualizers that are already in the schema-based registry
  // to avoid duplication in the UI.
  ...ALL_WEBGL_VISUALIZERS.filter(v =>
    !VISUALIZER_REGISTRY[v.id]
  ),
  ...ALL_VISUALIZERS
]

/**
 * Get all visualizer IDs in display order (WebGL + Schema-based)
 */
export function getAllVisualizerTypes(): VisualisationType[] {
  return [
    ...Object.keys(WEBGL_VISUALIZERS),
    ...getVisualizerIds()
  ] as VisualisationType[]
}

/**
 * Get display name for any visualizer
 */
export function getVisualizerDisplayName(id: string): string {
  // Check schema registry first
  if (VISUALIZER_REGISTRY[id]) {
    return VISUALIZER_REGISTRY[id].displayName
  }
  
  // Check WebGL registry
  if (id in WEBGL_VISUALIZERS) {
    return WEBGL_VISUALIZERS[id as WebGLVisualiserId].displayName
  }
  
  // Fallback to ID
  return id
}

/**
 * Get category for any visualizer
 */
export function getVisualizerCategory(id: string): string {
  // Check schema registry first
  if (VISUALIZER_REGISTRY[id]?.metadata?.category) {
    return VISUALIZER_REGISTRY[id].metadata.category!
  }
  
  // Check WebGL registry
  if (id in WEBGL_VISUALIZERS) {
    return WEBGL_VISUALIZERS[id as WebGLVisualiserId].category
  }
  
  return 'Other'
}

/**
 * Create display name to ID mapping (for voice/text search)
 */
export function createDisplayNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  
  // WebGL visualizers
  Object.entries(WEBGL_VISUALIZERS).forEach(([id, meta]) => {
    map[meta.displayName.toLowerCase()] = id
    // Add aliases if present
    if (meta.aliases) {
      meta.aliases.forEach(alias => {
        map[alias.toLowerCase()] = id
      })
    }
  })
  
  // Schema-based visualizers
  getVisualizerIds().forEach(id => {
    const displayName = VISUALIZER_REGISTRY[id].displayName
    map[displayName.toLowerCase()] = id
    
    // Add friendly aliases
    if (id === 'butterchurn') {
      map['milkdrop'] = id
      map['butterchurn (milkdrop)'] = id
    }
    if (id === 'astrofox') {
      map['astrofox (layers)'] = id
    }
  })
  
  return map
}
