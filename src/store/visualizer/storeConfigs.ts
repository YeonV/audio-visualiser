import type { ButterchurnConfig } from '../../components/Visualisers/ButterchurnVisualiser'
import type { AstrofoxConfig, AstrofoxLayer } from '../../components/Visualisers/AstrofoxVisualiser'
import { DEFAULT_ASTROFOX_CONFIG } from '../../components/Visualisers/AstrofoxVisualiser'
import { getVisualizerConfig, getVisualizerIds } from '../../_generated/registry'

export interface CustomAstrofoxPreset {
  name: string
  layers: AstrofoxLayer[]
  backgroundColor: string
}

export interface StoreConfigsState {
  butterchurnConfig: ButterchurnConfig
  butterchurnPresetNames: string[]
  astrofoxConfig: AstrofoxConfig
  customAstrofoxPresets: CustomAstrofoxPreset[]
  visualizerConfigs: Record<string, any>
  astrofoxReady: boolean
}

export interface StoreConfigsActions {
  setButterchurnConfig: (config: ButterchurnConfig | ((prev: ButterchurnConfig) => ButterchurnConfig)) => void
  updateButterchurnConfig: (partial: Partial<ButterchurnConfig>) => void
  setButterchurnPresetNames: (names: string[]) => void
  setAstrofoxConfig: (config: AstrofoxConfig | ((prev: AstrofoxConfig) => AstrofoxConfig)) => void
  updateAstrofoxConfig: (partial: Partial<AstrofoxConfig>) => void
  saveCustomAstrofoxPreset: (name: string, layers: AstrofoxLayer[], backgroundColor: string) => void
  deleteCustomAstrofoxPreset: (name: string) => void
  loadCustomAstrofoxPresets: () => void
  setVisualizerConfig: (id: string, config: any) => void
  updateVisualizerConfig: (id: string, partial: any) => void
  setAstrofoxReady: (ready: boolean) => void
  initializeConfigs: () => void
}

const storeConfigs = (set: any, get: any) => {
  // Initialize visualizer configs with default values immediately
  const initialConfigs: Record<string, any> = {}
  const visualizerIds = getVisualizerIds()
  
  visualizerIds.forEach(id => {
    initialConfigs[id] = getVisualizerConfig(id)
  })

  // Get Butterchurn default config from registry
  const butterchurnDefaultConfig = getVisualizerConfig('butterchurn') as ButterchurnConfig || {
    currentPresetName: '',
    cycleInterval: 25,
    blendTime: 2.7,
    shufflePresets: false,
    currentPresetIndex: 0,
    initialPresetIndex: 0  // Signal to load preset 0 on mount
  }

  // Load custom presets from localStorage
  const loadedCustomPresets = (() => {
    try {
      const stored = localStorage.getItem('customAstrofoxPresets')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })()

  return {
    // State
    butterchurnConfig: butterchurnDefaultConfig,
    butterchurnPresetNames: [],

    astrofoxConfig: DEFAULT_ASTROFOX_CONFIG,
    customAstrofoxPresets: loadedCustomPresets,

    visualizerConfigs: initialConfigs,

    astrofoxReady: false,

  // Actions
  setButterchurnConfig: (config: ButterchurnConfig | ((prev: ButterchurnConfig) => ButterchurnConfig)) => 
    set((state: any) => ({
      butterchurnConfig: typeof config === 'function' ? config(state.butterchurnConfig) : config
    })),

  updateButterchurnConfig: (partial: Partial<ButterchurnConfig>) =>
    set((state: any) => ({
      butterchurnConfig: { ...state.butterchurnConfig, ...partial }
    })),

  setButterchurnPresetNames: (names: string[]) =>
    set({ butterchurnPresetNames: names }),

  setAstrofoxConfig: (config: AstrofoxConfig | ((prev: AstrofoxConfig) => AstrofoxConfig)) =>
    set((state: any) => ({
      astrofoxConfig: typeof config === 'function' ? config(state.astrofoxConfig) : config
    })),

  updateAstrofoxConfig: (partial: Partial<AstrofoxConfig>) =>
    set((state: any) => ({
      astrofoxConfig: { ...state.astrofoxConfig, ...partial }
    })),

  saveCustomAstrofoxPreset: (name: string, layers: AstrofoxLayer[], backgroundColor: string) => {
    const newPreset: CustomAstrofoxPreset = { name, layers: JSON.parse(JSON.stringify(layers)), backgroundColor }
    set((state: any) => {
      const updatedPresets = [...state.customAstrofoxPresets.filter((p: CustomAstrofoxPreset) => p.name !== name), newPreset]
      localStorage.setItem('customAstrofoxPresets', JSON.stringify(updatedPresets))
      return { customAstrofoxPresets: updatedPresets }
    })
  },

  deleteCustomAstrofoxPreset: (name: string) => {
    set((state: any) => {
      const updatedPresets = state.customAstrofoxPresets.filter((p: CustomAstrofoxPreset) => p.name !== name)
      localStorage.setItem('customAstrofoxPresets', JSON.stringify(updatedPresets))
      return { customAstrofoxPresets: updatedPresets }
    })
  },

  loadCustomAstrofoxPresets: () => {
    try {
      const stored = localStorage.getItem('customAstrofoxPresets')
      const presets = stored ? JSON.parse(stored) : []
      set({ customAstrofoxPresets: presets })
    } catch {
      set({ customAstrofoxPresets: [] })
    }
  },

  setVisualizerConfig: (id: string, config: any) =>
    set((state: any) => ({
      visualizerConfigs: { ...state.visualizerConfigs, [id]: config }
    })),

  updateVisualizerConfig: (id: string, partial: any) =>
    set((state: any) => ({
      visualizerConfigs: {
        ...state.visualizerConfigs,
        [id]: { ...state.visualizerConfigs[id], ...partial }
      }
    })),

  setAstrofoxReady: (ready: boolean) => set({ astrofoxReady: ready }),

  initializeConfigs: () => {
    const configs: Record<string, any> = {}
    const visualizerIds = getVisualizerIds()
    
    visualizerIds.forEach(id => {
      configs[id] = getVisualizerConfig(id)
    })
    
    set({ visualizerConfigs: configs })
  }
}
}

export default storeConfigs
