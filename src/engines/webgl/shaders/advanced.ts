/**
 * Advanced WebGL Shaders for Audio Visualiser
 *
 * Beat-reactive, BPM-synchronized visual effects
 */

import { fullscreenVertexShader } from './advanced/fullscreenVertexShader';
import { spectrumRingsShader } from './advanced/spectrumRingsShader';
import { waveformTunnelShader } from './advanced/waveformTunnelShader';
import { particleGalaxyShader } from './advanced/particleGalaxyShader';
import { neonGridShader } from './advanced/neonGridShader';
import { audioDNAShader } from './advanced/audioDNAShader';
import { frequencyBars3DShader } from './advanced/frequencyBars3DShader';
import { plasmaWaveShader } from './advanced/plasmaWaveShader';

export * from './advanced/index';

// Shader collection type
export interface ShaderInfo {
  name: string
  displayName: string
  fragment: string
  vertex: string
  description: string
  category: 'geometric' | 'organic' | 'retro' | 'spectrum'
}

export const advancedShaders: ShaderInfo[] = [
  {
    name: 'spectrumRings',
    displayName: 'Spectrum Rings',
    fragment: spectrumRingsShader,
    vertex: fullscreenVertexShader,
    description: 'Concentric rings pulsing with frequency bands',
    category: 'spectrum'
  },
  {
    name: 'waveformTunnel',
    displayName: 'Waveform Tunnel',
    fragment: waveformTunnelShader,
    vertex: fullscreenVertexShader,
    description: '3D tunnel morphing with audio',
    category: 'geometric'
  },
  {
    name: 'particleGalaxy',
    displayName: 'Particle Galaxy',
    fragment: particleGalaxyShader,
    vertex: fullscreenVertexShader,
    description: 'Swirling galaxy of audio-reactive particles',
    category: 'organic'
  },
  {
    name: 'neonGrid',
    displayName: 'Neon Grid',
    fragment: neonGridShader,
    vertex: fullscreenVertexShader,
    description: 'Retro synthwave grid with audio waves',
    category: 'retro'
  },
  {
    name: 'audioDNA',
    displayName: 'Audio DNA',
    fragment: audioDNAShader,
    vertex: fullscreenVertexShader,
    description: 'Double helix reacting to frequencies',
    category: 'organic'
  },
  {
    name: 'frequencyBars3D',
    displayName: 'Spectrum Bars',
    fragment: frequencyBars3DShader,
    vertex: fullscreenVertexShader,
    description: 'Modern 3D spectrum analyzer',
    category: 'spectrum'
  },
  {
    name: 'plasmaWave',
    displayName: 'Plasma Wave',
    fragment: plasmaWaveShader,
    vertex: fullscreenVertexShader,
    description: 'Organic flowing plasma patterns',
    category: 'organic'
  }
]

export default advancedShaders
