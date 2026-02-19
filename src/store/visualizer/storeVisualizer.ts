import type { VisualisationType } from '../../engines/webgl/registry'
import { ALL_VISUALIZERS_WITH_CATEGORIES } from '../../engines/webgl/registry'

export interface VisualizerOption {
  id: string
  displayName: string
  category: string
}

export interface StoreVisualizerState {
  visualizers: VisualizerOption[]  
  visualType: VisualisationType
  audioSource: 'backend' | 'mic' | 'system'
  autoChange: boolean
  isPlaying: boolean
  globalSmoothing: number
  whiteCircleFix: 'original' | 'energy' | 'clamp'
  outerGlowMode: 'original' | 'strengthened'
  textAutoFit: boolean
}

export interface StoreVisualizerActions {
  setVisualType: (type: VisualisationType) => void
  setAudioSource: (source: 'backend' | 'mic' | 'system') => void
  setAutoChange: (enabled: boolean) => void
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
  setGlobalSmoothing: (value: number) => void
  setWhiteCircleFix: (mode: 'original' | 'energy' | 'clamp') => void
  setOuterGlowMode: (mode: 'original' | 'strengthened') => void
  setTextAutoFit: (enabled: boolean) => void
}

const storeVisualizer = (set: any, get: any) => {
  return {
    visualizers: ALL_VISUALIZERS_WITH_CATEGORIES || [],
    
    // State
    visualType: 'butterchurn' as VisualisationType,
    audioSource: 'backend' as 'backend' | 'mic' | 'system',
    autoChange: false,
    isPlaying: true,
    globalSmoothing: 0.5,
    whiteCircleFix: 'energy' as 'original' | 'energy' | 'clamp',
    outerGlowMode: 'strengthened' as 'original' | 'strengthened',
    textAutoFit: true,

    // Actions
    setVisualType: (type: VisualisationType) => set({ visualType: type }),
    setAudioSource: (source: 'backend' | 'mic' | 'system') => set({ audioSource: source }),
    setAutoChange: (enabled: boolean) => set({ autoChange: enabled }),
    setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
    togglePlay: () => set((state: any) => ({ isPlaying: !state.isPlaying })),
    setGlobalSmoothing: (value: number) => set({ globalSmoothing: value }),
    setWhiteCircleFix: (mode: 'original' | 'energy' | 'clamp') => set({ whiteCircleFix: mode }),
    setOuterGlowMode: (mode: 'original' | 'strengthened') => set({ outerGlowMode: mode }),
    setTextAutoFit: (enabled: boolean) => set({ textAutoFit: enabled })
    }
}

export default storeVisualizer
