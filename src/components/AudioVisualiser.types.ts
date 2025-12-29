// src/components/AudioVisualiser.types.ts

import type { Theme } from '@mui/material'
import type { WebGLVisualisationType } from './WebGLVisualiser'

/**
 * Props for the AudioVisualiser component
 */
export interface AudioVisualiserProps {
  /**
   * Audio input source
   * @default 'microphone'
   */
  audioSource?: 'microphone' | 'backend'

  /**
   * External audio frequency data (required when audioSource is 'backend')
   * Should be an array of normalized frequency values (0-1)
   */
  audioData?: number[]

  /**
   * Initial visualization type to display
   * @default 'gif'
   */
  defaultVisualType?: WebGLVisualisationType

  /**
   * Show the configuration panel for effect settings
   * @default true
   */
  showControls?: boolean

  /**
   * Enable fullscreen mode button
   * @default true
   */
  fullscreenEnabled?: boolean

  /**
   * Auto-change visualizations on beat detection
   * @default false
   */
  autoChange?: boolean

  /**
   * Effect schemas from backend (for advanced configuration)
   * Pass this from your store: useStore((state) => state.schemas.effects)
   */
  effects?: Record<string, any>

  /**
   * Backend connection status (for UI indication)
   * @default true
   */
  isConnected?: boolean

  /**
   * Callback to subscribe to backend events (optional)
   * Called when component needs backend audio data
   */
  onSubscribe?: (eventType: string, id: number) => void

  /**
   * Callback to unsubscribe from backend events (optional)
   */
  onUnsubscribe?: (eventType: string, id: number) => void

  /**
   * Callback fired when visualization type changes
   */
  onVisualTypeChange?: (visualType: WebGLVisualisationType) => void

  /**
   * Callback fired when configuration changes
   */
  onConfigChange?: (config: Record<string, any>) => void

  /**
   * Optional MUI theme override
   * If not provided, uses internal dark theme
   */
  theme?: Theme

  /**
   * Whether the component is running in standalone mode
   * @default false
   */
  standalone?: boolean
}

/**
 * Internal effect schema property structure
 */
export interface EffectSchemaProperty {
  id: string
  title: string
  type: 'number' | 'integer' | 'string' | 'boolean' | 'color'
  min?: number
  max?: number
  step?: number
  default?: any
  enum?: string[]
}

/**
 * Backend effect schema structure
 */
export interface BackendEffectSchema {
  schema: {
    properties: Record<string, any>
  }
  hidden_keys?: string[]
  advanced_keys?: string[]
}

export const isPremium = true
