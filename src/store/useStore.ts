import { create } from 'zustand'
import { devtools, combine, persist } from 'zustand/middleware'

import storeVisualizer from './visualizer/storeVisualizer'
import storeUI from './visualizer/storeUI'
import storePostProcessing from './visualizer/storePostProcessing'
import storeConfigs from './visualizer/storeConfigs'
import storeShaderEditor from './visualizer/storeShaderEditor'
import { VISUALISER_STORE_VERSION } from './migrate'
import { parseQueryParams } from './queryParamInit'

// Type declaration for Vite's define
declare const process: { env: { NODE_ENV: string } }

// Parse query params synchronously before store creation
const queryParamOverrides = parseQueryParams()

const useStore = create(
  devtools(
    persist(
      combine(
        {
          // Initial marker
          version: VISUALISER_STORE_VERSION,
        },
        (set, get) => ({
          // Combine all store slices
          ...storeVisualizer(set, get),
          ...storeUI(set),
          ...storePostProcessing(set),
          ...storeConfigs(set, get),
          ...storeShaderEditor(set)
        })
      ),
      {
        name: 'visualiser-storage-v5',
        version: VISUALISER_STORE_VERSION,
        partialize: (state: any) => {
          // Exclude non-serializable or static metadata from persistence
          const {
            glContext,
            visualizers,
            ...rest
          } = state
          return rest
        }
      }
    ),
    {
      name: 'Visualiser Store',
      enabled: process.env.NODE_ENV !== 'production' // Only enable devtools in development
    }
  )
)

// Export store state type for TypeScript
const state = useStore.getState()
export type IStore = typeof state

// Apply query param overrides after store creation
if (queryParamOverrides.visualType || queryParamOverrides.autoChange !== undefined || queryParamOverrides.fxEnabled !== undefined) {
  setTimeout(() => {
    const store = useStore.getState()
    
    // Set visual type
    if (queryParamOverrides.visualType) {
      store.setVisualType(queryParamOverrides.visualType)
    }
    
    // Apply global UI state
    if (queryParamOverrides.autoChange !== undefined) {
      store.setAutoChange(queryParamOverrides.autoChange)
    }
    
    if (queryParamOverrides.fxEnabled !== undefined) {
      store.setFxEnabled(queryParamOverrides.fxEnabled)
    }
    
    if (queryParamOverrides.showFxPanel !== undefined) {
      store.setShowFxPanel(queryParamOverrides.showFxPanel)
    }
    
    // Apply butterchurn config
    if (queryParamOverrides.butterchurnConfig) {
      store.updateButterchurnConfig(queryParamOverrides.butterchurnConfig)
    }
    
    // Apply other visualizer configs
    Object.keys(queryParamOverrides).forEach(key => {
      if (key.endsWith('Config') && key !== 'butterchurnConfig') {
        const visualType = key.replace('Config', '')
        store.updateVisualizerConfig(visualType as any, queryParamOverrides[key])
      }
    })
  }, 0)
}

export default useStore
