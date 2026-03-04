# Audio Visualizer Architecture

## 🏗️ Overview

The audio visualizer is a standalone React library that builds as a dynamic module, designed for runtime loading via [react-dynamic-module](https://github.com/YeonV/react-dynamic-module). It provides 55 auto-generated visualizers with full type safety and bidirectional communication.

## 📦 Integration Context

```
┌─────────────────────────────────────────────────────────────┐
│  Audio-Visualizer (_audio-visualiser)                       │
│  - Builds in library mode → yz-audio-visualiser.js          │
│  - Standalone module with full capabilities                 │
│  - Exports: AudioVisualiser component + useStore            │
└─────────────────────────────────────────────────────────────┘
                        ↓ (loaded via react-dynamic-module)
┌─────────────────────────────────────────────────────────────┐
│  Frontend (LedFx-Frontend-v2)                                │
│  - Uses react-dynamic-module for runtime loading            │
│  - Consumes audio-visualizer exports                        │
│  - Shares Zustand store (useVstore = visualizer's useStore) │
└─────────────────────────────────────────────────────────────┘
                        ↓ (embedded in)
┌─────────────────────────────────────────────────────────────┐
│  Backend (LedFx)                                             │
│  - Python audio processing engine                           │
│  - Serves frontend as web interface                         │
│  - Generates audio data for visualizers                     │
└─────────────────────────────────────────────────────────────┘
                        ↓ (packaged as)
┌─────────────────────────────────────────────────────────────┐
│  LedFxCC (Electron Binary)  — NOT a separate repo           │
│  - Entry: frontend/src/app/electron.ts                      │
│  - Electron main process lives inside the Frontend repo     │
│  - isCC() detects bundled backend binary at runtime         │
│  - Built by _pipeline/ (LedFx-Builds) via electron-builder  │
│  - Cross-platform: Win / Mac / Linux                        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── VisualiserIso.tsx (172 lines)     # Main orchestrator component
├── index.ts                          # Public API exports
│
├── _generated/                       # ⚡ AUTO-GENERATED (never edit!)
│   ├── registry.ts                   # Combined 55 visualizers
│   ├── schemas.ts                    # 10 schema-based configs
│   ├── backend-mapping.ts            # 17 backend effects
│   └── webgl/                        # 28 WebGL metadata
│
├── components/                       # UI Components
│   ├── Audio/                        # Audio context provider
│   ├── Handlers/                     # Side-effect handlers
│   ├── Layout/                       # Structural components
│   ├── Panels/                       # Configuration panels
│   └── Visualisers/                  # All visualizer components
│
├── engines/                          # Core Logic (UI-independent)
│   ├── audio/                        # Audio analysis engine
│   └── webgl/                        # WebGL registry & shaders
│
├── hooks/                            # Reusable React hooks
│
├── store/                            # Zustand State Management
│   ├── useStore.ts                   # Main store (5 slices)
│   ├── migrate.ts                    # Version migrations
│   └── visualizer/                   # Domain slices
│
├── types/                            # TypeScript definitions
├── utils/                            # Pure utilities
└── webgl/                            # Backward compatibility

External (Root):
├── schemas/                          # 10 .schema.ts files
├── scripts/                          # 3 generator scripts
├── webgl-metadata.json               # WebGL source of truth
└── docs/                             # Documentation
```

## 🎨 55 Visualizers (100% Auto-Generated)

### Source 1: WebGL Registry (28)
- **File**: `webgl-metadata.json`
- **Generator**: `scripts/generate-webgl-registry.ts`
- **Output**: `src/_generated/webgl/registry.ts`
- **Categories**: Original Effects (10), 2D Effects (4), Matrix Effects (14)

### Source 2: Schema-First (10)
- **Files**: `schemas/*.schema.ts`
- **Generator**: `scripts/generate-schemas.ts`
- **Output**: `src/_generated/schemas.ts`
- **Examples**: Butterchurn, Astrofox, Fluid, WaveMountain, etc.

### Source 3: Backend Effects (17)
- **Source**: GitHub API (LedFx backend repo)
- **Generator**: `scripts/extract-backend-schemas.ts`
- **Output**: `src/_generated/backend-mapping.ts`
- **Examples**: Blade, Scroll, Strobe, Plasma2d, etc.

## 🗄️ State Management (Zustand)

### 5 Domain Slices

```typescript
useStore (Main Store)
├── storeVisualizer     → Visual type, audio source, playback
├── storeUI             → Overlays, fullscreen, panels
├── storePostProcessing → FX pipeline, WebGL context
├── storeConfigs        → Visualizer configurations
└── storeShaderEditor   → Custom shader editing

Middleware:
├── persist    → localStorage ('visualiser-storage')
├── devtools   → Redux DevTools (dev only)
└── migrations → Version-based state upgrades
```

### Frontend Access

```typescript
// Frontend directly accesses visualizer's store
const { useStore } = window.YzAudioVisualiser
const useVstore = useStore

// Direct reactive access (no polling!)
const visualType = useVstore(state => state.visualType)
const setVisual = useVstore(state => state.setVisualType)
```

## 🔄 Communication Evolution

See [COMMUNICATION.md](COMMUNICATION.md) for detailed evolution from props → window.api → direct store sharing.

**Current State**: Frontend shares the Zustand store directly via `useVstore`, enabling:
- Zero polling (reactive updates)
- Zero desync (single source of truth)
- Full type safety (TypeScript across modules)
- Bidirectional control (frontend ↔ visualizer)

## 🎯 Key Principles

1. **Single Responsibility** - Every file < 700 lines, focused purpose
2. **Auto-Generation** - Zero manual type/config duplication
3. **Type Safety** - Full TypeScript coverage with strict mode
4. **Separation of Concerns** - UI/Logic/State clearly separated
5. **Dual Mode** - Works standalone AND integrated
6. **Performance** - Selective re-renders, throttled updates

## 📚 Related Docs

- [COMMUNICATION.md](COMMUNICATION.md) - Frontend↔Visualizer communication
- [ZUSTAND_STORE.md](ZUSTAND_STORE.md) - State management guide
- [GENERATORS.md](GENERATORS.md) - Auto-generation systems
- [WEBGL_GENERATION.md](WEBGL_GENERATION.md) - WebGL metadata system
- [BACKEND-SCHEMA-GENERATION.md](BACKEND-SCHEMA-GENERATION.md) - Backend integration
