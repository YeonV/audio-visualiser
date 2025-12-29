import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import dts from 'vite-plugin-dts'

const sharedResolve = {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url))
  }
}

const libraryConfig: UserConfig = {
  plugins: [
    react(),
    dts({
      rollupTypes: true,
      tsconfigPath: './tsconfig.app.json'
    })
  ],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: sharedResolve,
  build: {
    outDir: 'dist',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'YzAudioVisualiser',
      formats: ['iife'],
      fileName: () => 'yz-audio-visualiser.js'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        exports: 'named'
      }
    }
  }
}

const pagesConfig: UserConfig = {
  plugins: [react()],
  resolve: sharedResolve,
  build: {
    outDir: 'dist'
  }
}

export default defineConfig(({ mode }) => {
  if (mode === 'pages') {
    console.log('Building in PAGES mode...')
    return pagesConfig
  }
  console.log('Building in LIBRARY mode...')
  return libraryConfig
})
