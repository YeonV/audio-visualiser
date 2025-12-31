/**
 * Type declarations for butterchurn and butterchurn-presets
 */

declare module 'butterchurn' {
  interface ButterchurnVisualizer {
    setRendererSize(width: number, height: number): void
    loadPreset(preset: unknown, blendTime?: number): void
    connectAudio(audioNode: AudioNode): void
    render(): void
    launchSongTitleAnim(title: string): void
  }

  interface ButterchurnStatic {
    createVisualizer(
      audioContext: AudioContext,
      canvas: HTMLCanvasElement,
      options?: {
        width?: number
        height?: number
        pixelRatio?: number
        textureRatio?: number
      }
    ): ButterchurnVisualizer
  }

  const butterchurn: ButterchurnStatic
  export default butterchurn
}

declare module 'butterchurn-presets' {
  type PresetMap = Record<string, unknown>
  const presets: PresetMap
  export default presets
}

declare module 'butterchurn-presets/lib/butterchurnPresetsExtra.min' {
  type PresetMap = Record<string, unknown>
  const presets: PresetMap
  export default presets
}

declare module 'butterchurn-presets/lib/butterchurnPresetsExtra2.min' {
  type PresetMap = Record<string, unknown>
  const presets: PresetMap
  export default presets
}

declare module 'butterchurn-presets/lib/butterchurnPresetsMD1.min' {
  type PresetMap = Record<string, unknown>
  const presets: PresetMap
  export default presets
}

declare module 'butterchurn-presets/lib/butterchurnPresetsNonMinimal.min' {
  type PresetMap = Record<string, unknown>
  const presets: PresetMap
  export default presets
}
