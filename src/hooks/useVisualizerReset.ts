import { useCallback } from 'react'
import { useStore } from '../store'
import { getVisualizerIds, getVisualizerConfig } from '../_generated'
import { DEFAULT_ASTROFOX_CONFIG } from '../components/Visualisers'
import { VISUALISER_STORAGE_KEY } from '@/store/useStore'

/**
 * Custom hook for visualizer reset operations.
 * Provides handlers to reset current visualizer or all settings.
 */
export const useVisualizerReset = () => {
  const visualType = useStore(state => state.visualType)
  const setAstrofoxConfig = useStore(state => state.setAstrofoxConfig)
  const setVisualizerConfig = useStore(state => state.setVisualizerConfig)

  const handleReset = useCallback(() => {
    // Special cases with complex state
    if (visualType === 'astrofox') {
      setAstrofoxConfig(DEFAULT_ASTROFOX_CONFIG)
    }
    // Registry-driven visualizers (all 10 in schema system)
    else if (getVisualizerIds().includes(visualType as string)) {
      setVisualizerConfig(visualType as string, getVisualizerConfig(visualType as string))
    }
  }, [visualType, setAstrofoxConfig, setVisualizerConfig])

  const handleResetAll = useCallback(() => {
    if (window.confirm('Are you sure you want to reset ALL settings and visualisers to default? This cannot be undone.')) {
      // Clear Zustand persisted storage
      localStorage.removeItem(VISUALISER_STORAGE_KEY)
      window.location.reload()
    }
  }, [])

  return { handleReset, handleResetAll }
}
