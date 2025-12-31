# Audio Visualiser

[![original author](https://img.shields.io/badge/ORIGINAL_AUTHOR-mattallmighty-purple.svg?logo=github&logoColor=white)](https://github.com/mattallmighty) [![refactored by](https://img.shields.io/badge/REFACTORED_BY-Blade-darkred.svg?logo=github&logoColor=white)](https://github.com/mattallmighty) [![live demo](https://img.shields.io/badge/LIVE_DEMO-GitHub_Pages-00ADD8.svg?logo=react&logoColor=white)](https://mattallmighty.github.io/audio-visualiser/)

A powerful, dual-mode audio visualisation component with real-time WebGL effects. Built with React, TypeScript, and Web Audio API.

**Originally created by [mattallmighty](https://github.com/mattallmighty)** for the [LedFx](https://github.com/LedFx/LedFx) project as an integrated visualizer. **Refactored by [mattallmighty (Blade)](https://github.com/mattallmighty)** to support both standalone and dynamic module loading, enabling use as a standalone microphone visualizer or integrated with backend audio streams.

**This repository is a gift from Blade to mattallmighty** - creating an independent workspace where the visualizer can evolve without LedFx dependencies, while still serving as a dynamic module for the main LedFx application.

## 🎯 Dual-Mode Architecture

This visualizer supports two distinct modes:

### 🎤 Standalone Mode (Microphone)

- **[Try it live on GitHub Pages](https://mattallmighty.github.io/audio-visualiser/)**
- Real-time microphone input with Web Audio API
- No backend dependencies required
- Perfect for demos, presentations, or standalone exploration
- Independent development environment for mattallmighty

### 🔗 Integrated Mode (Dynamic Module)

- Load dynamically at runtime via module system
- Receive audio data from backend (e.g., LedFx WebSocket)
- Seamless theme integration with host application
- Full configuration control from parent app
- Users can opt-in/out without affecting core LedFx bundle

## 💡 Why This Refactoring?

### Dependency Isolation

The original visualizer required the **Meyda** audio analysis library as a direct dependency in LedFx's main bundle. By refactoring to a dynamic module:

- 🎯 **Opt-in architecture**: Users only load the visualizer module if they use it
- 📦 **Smaller main bundle**: Meyda (~100KB) stays out of core LedFx
- ⚡ **Faster load times**: Main app loads without visualizer overhead
- 🔧 **Easy updates**: Module can be updated independently

### Independent Workspace

This repo provides mattallmighty with:

- 🎨 **Standalone development**: Work on effects without running full LedFx backend
- 🧪 **Quick testing**: Instant microphone feedback for visual development
- 🚀 **Faster iteration**: No build/restart cycles of main application
- 🎁 **Full autonomy**: Complete control over the codebase evolution

## ✨ Features

- **31+ WebGL Visualizations:** From classic spectrum bars to advanced shader effects
- **Real-time Audio Analysis:** FFT, beat detection, BPM tracking, and frequency band analysis
- **Dual Audio Sources:** Microphone (Web Audio API) or external backend data
- **Auto-change Mode:** Automatically switch visualizations on beat detection
- **Full Customization:** Extensive configuration for each visual type
- **Custom Shaders:** Write and apply your own GLSL shaders in developer mode
- **Type-Safe:** Full TypeScript support with comprehensive type definitions
- **Theme Integration:** Seamless MUI theme support for integrated mode

## 🚀 Usage

### Mode 1: Standalone (GitHub Pages Demo)

Experience the visualizer with your microphone:
**[Launch Standalone Demo →](https://mattallmighty.github.io/audio-visualiser/)**

No installation needed - just grant microphone access and enjoy!

### Mode 2: Integrated (Dynamic Module in Your App)

Load as a dynamic module with backend audio integration:

```tsx
import { useEffect, useState } from "react";
import { useTheme } from "@mui/material";

function MyApp() {
  const [AudioVisualiser, setAudioVisualiser] = useState<any>(null);
  const [backendAudioData, setBackendAudioData] = useState<number[]>();
  const theme = useTheme();

  // Dynamically load the module
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/modules/audio-visualiser.js";
    script.onload = () => {
      setAudioVisualiser(() => (window as any).AudioVisualiser.AudioVisualiser);
    };
    document.body.appendChild(script);
  }, []);

  // Connect to backend audio stream
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8888/api/websocket");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event_type === "graph_update") {
        setBackendAudioData(data.payload);
      }
    };
    return () => ws.close();
  }, []);

  const handleClose = () => {
    // Handle dialog close
  };

  return AudioVisualiser ? (
    <AudioVisualiser
      theme={theme}
      effects={myEffects}
      backendAudioData={backendAudioData}
      ConfigFormComponent={MyConfigForm}
      onClose={handleClose}
    />
  ) : (
    <div>Loading visualizer...</div>
  );
}
```

## 📖 API

### AudioVisualiserProps

| Prop                  | Type                       | Required | Description                                                      |
| --------------------- | -------------------------- | -------- | ---------------------------------------------------------------- |
| `theme`               | `Theme`                    | ✅       | MUI theme (required for styling)                                 |
| `effects`             | `Record<string, any>`      | ❌       | Backend effect schemas (integrated mode only)                    |
| `backendAudioData`    | `number[]`                 | ❌       | Real-time audio data from backend (omit for standalone mic mode) |
| `ConfigFormComponent` | `React.ComponentType<any>` | ❌       | Custom config form component (integrated mode)                   |
| `onClose`             | `() => void`               | ❌       | Close handler for integrated dialog mode                         |

**Mode Detection:**

- If `backendAudioData` is provided → **Integrated Mode** (backend audio + mic toggle)
- If `backendAudioData` is omitted → **Standalone Mode** (mic only, no toggle)

### Available Visualization Types

- **Original Effects:** `gif`, `matrix`, `terrain`, `geometric`, `concentric`, `particles`, `bars3d`, `radial3d`, `waveform3d`, `bleep`
- **2D Effects:** `bands`, `bandsmatrix`, `blocks`, `equalizer2d`
- **Matrix Effects:** `blender`, `clone`, `digitalrain`, `flame`, `gameoflife`, `image`, `keybeat2d`, `noise2d`, `plasma2d`, `plasmawled2d`, `radial`, `soap`, `texter`, `waterfall`

## 🛠️ Building

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Run in development mode
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

This project is designed as a collaborative space for mattallmighty to continue developing the visualizer with full creative freedom.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Credits

**Original Author:** [mattallmighty](https://github.com/mattallmighty) - Created the original integrated audio visualizer for LedFx with 31 stunning WebGL effects

**Refactoring & Dual-Mode Architecture:** [YeonV (Blade)](https://github.com/YeonV) - Refactored to support standalone mode and dynamic module loading, enabling broader use cases while maintaining all original functionality

This project welcomes contributions from both original and community developers. Special thanks to the LedFx community for inspiration and support.
