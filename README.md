# YZ Audio Visualiser

[![creator](https://img.shields.io/badge/CREATOR-Yeon-blue.svg?logo=github&logoColor=white)](https://github.com/YeonV) [![creator](https://img.shields.io/badge/A.K.A-Blade-darkred.svg?logo=github&logoColor=white)](https://github.com/YeonV)

A powerful, standalone audio visualisation component with real-time WebGL effects. Built with React, TypeScript, and Web Audio API.

Originally created for the [LedFx](https://github.com/LedFx/LedFx) project, this component can be used standalone or integrated into larger applications.

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

### Basic Usage (Microphone)

```tsx
import { AudioVisualiser } from '@yeonv/yz-audio-visualiser';

function App() {
  return (
    <AudioVisualiser
      audioSource="microphone"
      showControls={true}
      defaultVisualType="bars3d"
    />
  );
}
```

### Advanced Usage (External Audio Data)

```tsx
import { AudioVisualiser } from '@yeonv/yz-audio-visualiser';
import { useState, useEffect } from 'react';

function App() {
  const [audioData, setAudioData] = useState<number[]>([]);
  
  // Your audio processing logic here
  useEffect(() => {
    // Example: Connect to backend audio stream
    const subscription = backendAudioStream.subscribe(setAudioData);
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AudioVisualiser
      audioSource="backend"
      audioData={audioData}
      showControls={true}
      fullscreenEnabled={true}
    />
  );
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
