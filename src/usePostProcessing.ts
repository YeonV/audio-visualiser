/**
 * usePostProcessing - Hook for managing post-processing effects
 *
 * Provides an easy way to add, configure, and chain post-processing
 * effects on the visualiser output.
 */

import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { Composer } from './postprocessing/Composer'
import {
  BloomPass,
  KaleidoscopePass,
  GlitchPass,
  RGBShiftPass,
  LEDPass,
  VignettePass,
  FilmGrainPass,
  GodRaysPass,
  PixelatePass,
  MirrorPass,
  DotScreenPass,
  BadTVPass
} from './postprocessing/passes'
import type {
  BloomConfig,
  KaleidoscopeConfig,
  GlitchConfig,
  RGBShiftConfig,
  LEDConfig,
  VignetteConfig,
  FilmGrainConfig,
  GodRaysConfig,
  PixelateConfig,
  MirrorConfig,
  DotScreenConfig,
  BadTVConfig
} from './postprocessing/passes'

export interface PostProcessingConfig {
  bloom?: BloomConfig & { enabled?: boolean }
  kaleidoscope?: KaleidoscopeConfig & { enabled?: boolean }
  glitch?: GlitchConfig & { enabled?: boolean }
  rgbShift?: RGBShiftConfig & { enabled?: boolean }
  led?: LEDConfig & { enabled?: boolean }
  vignette?: VignetteConfig & { enabled?: boolean }
  filmGrain?: FilmGrainConfig & { enabled?: boolean }
  godRays?: GodRaysConfig & { enabled?: boolean }
  pixelate?: PixelateConfig & { enabled?: boolean }
  mirror?: MirrorConfig & { enabled?: boolean }
  dotScreen?: DotScreenConfig & { enabled?: boolean }
  badTV?: BadTVConfig & { enabled?: boolean }
}

export interface PostProcessingState {
  isInitialized: boolean
  enabledEffects: string[]
}

export interface BeatData {
  isBeat: boolean
  beatPhase: number
  beatIntensity: number
}

export interface PostProcessingControls {
  composer: Composer | null
  getInputFramebuffer: () => WebGLFramebuffer | null
  render: () => void
  setConfig: (config: Partial<PostProcessingConfig>) => void
  toggleEffect: (effect: keyof PostProcessingConfig, enabled: boolean) => void
  triggerGlitch: (intensity?: number, duration?: number) => void
  updateTime: (deltaTime: number, beatData?: BeatData) => void
  dispose: () => void
}

export function usePostProcessing(
  gl: WebGLRenderingContext | null,
  width: number,
  height: number
): [PostProcessingState, PostProcessingControls] {
  const composerRef = useRef<Composer | null>(null)
  const passesRef = useRef<{
    bloom: BloomPass | null
    kaleidoscope: KaleidoscopePass | null
    glitch: GlitchPass | null
    rgbShift: RGBShiftPass | null
    led: LEDPass | null
    vignette: VignettePass | null
    filmGrain: FilmGrainPass | null
    godRays: GodRaysPass | null
    pixelate: PixelatePass | null
    mirror: MirrorPass | null
    dotScreen: DotScreenPass | null
    badTV: BadTVPass | null
  }>({
    bloom: null,
    kaleidoscope: null,
    glitch: null,
    rgbShift: null,
    led: null,
    vignette: null,
    filmGrain: null,
    godRays: null,
    pixelate: null,
    mirror: null,
    dotScreen: null,
    badTV: null
  })

  const configRef = useRef<PostProcessingConfig>({})
  const [state, setState] = useState<PostProcessingState>({
    isInitialized: false,
    enabledEffects: []
  })

  // Store size in a ref to avoid re-running initialization effect
  const sizeRef = useRef({ width, height })
  sizeRef.current = { width, height }

  // Initialize composer and passes - only depends on gl
  useEffect(() => {
    if (!gl) return

    // Create composer with current size
    const { width: w, height: h } = sizeRef.current
    const initialWidth = w > 0 ? w : 100 // Use fallback if not set
    const initialHeight = h > 0 ? h : 100

    const composer = new Composer(gl, initialWidth, initialHeight)
    composerRef.current = composer

    // Create all passes (but don't add them yet)
    passesRef.current = {
      bloom: new BloomPass(),
      kaleidoscope: new KaleidoscopePass(),
      glitch: new GlitchPass(),
      rgbShift: new RGBShiftPass(),
      led: new LEDPass(),
      vignette: new VignettePass(),
      filmGrain: new FilmGrainPass(),
      godRays: new GodRaysPass(),
      pixelate: new PixelatePass(),
      mirror: new MirrorPass(),
      dotScreen: new DotScreenPass(),
      badTV: new BadTVPass()
    }

    setState((prev) => {
      if (prev.isInitialized) return prev // Already initialized
      return { ...prev, isInitialized: true }
    })

    return () => {
      composer.dispose()
      Object.values(passesRef.current).forEach((pass) => pass?.dispose())
      passesRef.current = {
        bloom: null,
        kaleidoscope: null,
        glitch: null,
        rgbShift: null,
        led: null,
        vignette: null,
        filmGrain: null,
        godRays: null,
        pixelate: null,
        mirror: null,
        dotScreen: null,
        badTV: null
      }
      composerRef.current = null
      setState({ isInitialized: false, enabledEffects: [] })
    }
  }, [gl]) // Only depend on gl, not size

  // Update size when dimensions change - separate from initialization
  useEffect(() => {
    if (composerRef.current && width > 0 && height > 0) {
      composerRef.current.setSize(width, height)
    }
  }, [width, height])

  // Rebuild effect chain when config changes
  const rebuildChain = useCallback(() => {
    const composer = composerRef.current
    const passes = passesRef.current
    const config = configRef.current

    if (!composer) return

    // Clear existing passes
    composer.clearPasses()

    const enabledEffects: string[] = []

    // Add passes in a specific order for best visual results
    // Order: Mirror -> Kaleidoscope -> Bloom -> RGBShift -> Glitch -> LED -> Vignette -> etc.

    if (config.mirror?.enabled && passes.mirror) {
      passes.mirror.updateConfig(config.mirror)
      composer.addPass(passes.mirror)
      enabledEffects.push('mirror')
    }

    if (config.kaleidoscope?.enabled && passes.kaleidoscope) {
      passes.kaleidoscope.updateConfig(config.kaleidoscope)
      composer.addPass(passes.kaleidoscope)
      enabledEffects.push('kaleidoscope')
    }

    if (config.bloom?.enabled && passes.bloom) {
      passes.bloom.updateConfig(config.bloom)
      composer.addPass(passes.bloom)
      enabledEffects.push('bloom')
    }

    if (config.godRays?.enabled && passes.godRays) {
      passes.godRays.updateConfig(config.godRays)
      composer.addPass(passes.godRays)
      enabledEffects.push('godRays')
    }

    if (config.rgbShift?.enabled && passes.rgbShift) {
      passes.rgbShift.updateConfig(config.rgbShift)
      composer.addPass(passes.rgbShift)
      enabledEffects.push('rgbShift')
    }

    if (config.glitch?.enabled && passes.glitch) {
      passes.glitch.updateConfig(config.glitch)
      composer.addPass(passes.glitch)
      enabledEffects.push('glitch')
    }

    if (config.badTV?.enabled && passes.badTV) {
      passes.badTV.updateConfig(config.badTV)
      composer.addPass(passes.badTV)
      enabledEffects.push('badTV')
    }

    if (config.pixelate?.enabled && passes.pixelate) {
      passes.pixelate.updateConfig(config.pixelate)
      composer.addPass(passes.pixelate)
      enabledEffects.push('pixelate')
    }

    if (config.led?.enabled && passes.led) {
      passes.led.updateConfig(config.led)
      composer.addPass(passes.led)
      enabledEffects.push('led')
    }

    if (config.dotScreen?.enabled && passes.dotScreen) {
      passes.dotScreen.updateConfig(config.dotScreen)
      composer.addPass(passes.dotScreen)
      enabledEffects.push('dotScreen')
    }

    if (config.filmGrain?.enabled && passes.filmGrain) {
      passes.filmGrain.updateConfig(config.filmGrain)
      composer.addPass(passes.filmGrain)
      enabledEffects.push('filmGrain')
    }

    if (config.vignette?.enabled && passes.vignette) {
      passes.vignette.updateConfig(config.vignette)
      composer.addPass(passes.vignette)
      enabledEffects.push('vignette')
    }

    // Only update state if enabledEffects actually changed
    setState((prev) => {
      const prevEffects = prev.enabledEffects
      // Check if arrays are the same
      if (
        prevEffects.length === enabledEffects.length &&
        prevEffects.every((e, i) => e === enabledEffects[i])
      ) {
        return prev // No change, return same reference to prevent re-render
      }
      return { ...prev, enabledEffects }
    })
  }, [])

  // Get input framebuffer for rendering base scene
  const getInputFramebuffer = useCallback((): WebGLFramebuffer | null => {
    return composerRef.current?.getInputFramebuffer() ?? null
  }, [])

  // Render post-processing chain
  const render = useCallback((): void => {
    if (composerRef.current) {
      composerRef.current.render()
    }
  }, [])

  // Set configuration
  const setConfig = useCallback(
    (config: Partial<PostProcessingConfig>): void => {
      configRef.current = { ...configRef.current, ...config }
      rebuildChain()
    },
    [rebuildChain]
  )

  // Toggle a specific effect
  const toggleEffect = useCallback(
    (effect: keyof PostProcessingConfig, enabled: boolean): void => {
      configRef.current = {
        ...configRef.current,
        [effect]: { ...configRef.current[effect], enabled }
      }
      rebuildChain()
    },
    [rebuildChain]
  )

  // Trigger glitch effect
  const triggerGlitch = useCallback((intensity: number = 1, duration: number = 0.1): void => {
    if (passesRef.current.glitch) {
      passesRef.current.glitch.trigger(intensity, duration)
    }
  }, [])

  // Update time-based effects
  const updateTime = useCallback((deltaTime: number, beatData?: BeatData): void => {
    const passes = passesRef.current
    // Update passes that have time-based animations
    if (passes.glitch) passes.glitch.update()
    if (passes.filmGrain) passes.filmGrain.update(deltaTime)
    if (passes.badTV) passes.badTV.update(deltaTime)
    if (passes.kaleidoscope) passes.kaleidoscope.update(deltaTime, beatData)
  }, [])

  // Dispose
  const dispose = useCallback((): void => {
    composerRef.current?.dispose()
    composerRef.current = null
  }, [])

  const controls = useMemo(
    () => ({
      composer: composerRef.current,
      getInputFramebuffer,
      render,
      setConfig,
      toggleEffect,
      triggerGlitch,
      updateTime,
      dispose
    }),
    [getInputFramebuffer, render, setConfig, toggleEffect, triggerGlitch, updateTime, dispose]
  )

  return [state, controls]
}

export default usePostProcessing
