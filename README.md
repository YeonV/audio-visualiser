# YZ Audio Visualiser

[![original author](https://img.shields.io/badge/ORIGINAL_AUTHOR-mattallmighty-purple.svg?logo=github&logoColor=white)](https://github.com/mattallmighty) [![refactored by](https://img.shields.io/badge/REFACTORED_BY-Blade-darkred.svg?logo=github&logoColor=white)](https://github.com/YeonV)

A powerful, dual-mode audio visualisation component with real-time WebGL effects. Built with React, TypeScript, and Web Audio API.

**Originally created by [mattallmighty](https://github.com/mattallmighty)** for the [LedFx](https://github.com/LedFx/LedFx) project as an integrated visualizer. **Refactored by [YeonV (Blade)](https://github.com/YeonV)** to support both standalone and dynamic module loading, enabling use as a standalone microphone visualizer or integrated with backend audio streams.

## 🎯 Dual-Mode Architecture

This visualizer supports two distinct modes:

### 🎤 Standalone Mode (Microphone)
- Use anywhere as a standalone component
- Real-time microphone input with Web Audio API
- No backend dependencies
- Perfect for demos, presentations, or standalone apps

### 🔗 Integrated Mode (Dynamic Module)
- Load dynamically at runtime via module system
- Receive audio data from backend (e.g., LedFx WebSocket)
- Seamless theme integration with host application
- Full configuration control from parent app

## ✨ Features

- **Real-time Audio Analysis:** Microphone input with FFT, beat detection, and BPM tracking
- **30+ WebGL Visualizations:** From classic spectrum bars to advanced shader effects
- **Dual Audio Sources:** Microphone or external audio data
- **Auto-change Mode:** Automatically switch visualizations on beat
- **Full Customization:** Extensive configuration for each visual type
- **Custom Shaders:** Write and apply your own GLSL shaders
- **Type-Safe:** Full TypeScript support with comprehensive type definitions

## 📦 Installation

```bash
# Using yarn
yarn add @yeonv/yz-audio-visualiser

# Using npm
npm install @yeonv/yz-audio-visualiser

# Using pnpm
pnpm add @yeonv/yz-audio-visualiser
```

## 🚀 Usage

### Mode 1: Standalone (Direct Import)

Use as a regular React component with microphone input:

```tsx
import { AudioVisualiser } from '@yeonv/yz-audio-visualiser'
import { createTheme } from '@mui/material'

function App() {
  const theme = createTheme({ palette: { mode: 'dark' } })
  
  return (
    <AudioVisualiser
      theme={theme}
      // No other props needed - uses microphone by default
    />
  )
}
```

### Mode 2: Dynamic Module (Runtime Loading)

Load as a dynamic module with backend audio integration:

```tsx
import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material'

function MyApp() {
  const [AudioVisualiser, setAudioVisualiser] = useState<any>(null)
  const [backendAudioData, setBackendAudioData] = useState<number[]>()
  const theme = useTheme()

  // Dynamically load the module
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '/modules/yz-audio-visualiser.js'
    script.onload = () => {
      setAudioVisualiser(() => (window as any).YzAudioVisualiser.AudioVisualiser)
    }
    document.body.appendChild(script)
  }, [])

  // Connect to backend audio stream
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8888/api/websocket')
    ws.onmessage = (event) => {
      const dataRequired | Description |
|------|------|----------|-------------|
| `theme` | `Theme` | ✅ | MUI theme (required for styling) |
| `effects` | `Record<string, any>` | ❌ | Backend effect schemas (integrated mode only) |
| `backendAudioData` | `number[]` | ❌ | Real-time audio data from backend (omit for standalone mic mode) |
| `ConfigFormComponent` | `React.ComponentType<any>` | ❌ | Custom config form component (integrated mode) |
| `onClose` | `() => void` | ❌ | Close handler for integrated dialog mode |

**Mode Detection:**
- If `backendAudioData` is provided → **Integrated Mode** (backend audio + mic toggle)
- If `backendAudioData` is omitted → **Standalone Mode** (mic only, no toggle)
      theme={theme}
      effects={myEffects}
      backendAudioData={backendAudioData}
      ConfigFormComponent={MyConfigForm}
      onClose={handleClose}
    />
  ) : (
    <div>Loading visualizer...</div>
  )
}
```

## 📖 API

### AudioVisualiserProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `audioSource` | `'microphone' \| 'backend'` | `'microphone'` | Audio input source |
| `audioData` | `number[]` | `[]` | External audio frequency data (when using backend) |
| `defaultVisualType` | `WebGLVisualisationType` | `'gif'` | Initial visualization type |
| `showControls` | `boolean` | `true` | Show configuration panel |
| `fullscreenEnabled` | `boolean` | `true` | Enable fullscreen mode |
| `autoChange` | `boolean` | `false` | Auto-change visuals on beat |
| `effects` | `Record<string, any>` | `undefined` | Effect schemas for advanced config |
| `isConnected` | `boolean` | `true` | Backend connection status |
| `onSubscribe` | `(event, id) => void` | `undefined` | Callback for backend subscription |
| `onUnsubscribe` | `(event, id) => void` | `undefined` | Callback for backend unsubscription |
| `theme` | `Theme` | `undefined` | MUI theme override |
| `standalone` | `boolean` | `false` | Standalone mode flag |

### Available Visualization Types

- **Original Effects:** `gif`, `matrix`, `terrain`, `geometric`, `concentric`, `particles`, `bars3d`, `radial3d`, `waveform3d`, `bleep`
- **2D Effects:** `bands`, `bandsmatrix`, `blocks`, `equalizer2d`
- **Matrix Effects:** `blender`, `clone`, `digitalrain`, `flame`, `gameoflife`, `image`, `keybeat2d`, `noise2d`, `plasma2d`, `plasmawled2d`, `radial`, `soap`, `texter`, `waterfall`

## 🛠️ Building

```bash
# Install dependencies
yarn install

# Build for production
yarn build

# Create distribution package
yarn dist

# Run in development
yarn dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Credits

Created by [YeonV (Blade)](https://github.com/YeonV) for the LedFx community.
**Original Author:** [mattallmighty](https://github.com/mattallmighty) - Created the original integrated audio visualizer for LedFx with 31 stunning WebGL effects

**Refactoring & Dual-Mode Architecture:** [YeonV (Blade)](https://github.com/YeonV) - Refactored to support standalone mode and dynamic module loading, enabling broader use cases while maintaining all original functionality

This project welcomes contributions from both original and community developers. Special thanks to the LedFx community for inspiration and support