// src/App.tsx

import { useState } from 'react'
import { Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { AudioVisualiser } from './components/AudioVisualiser'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00bcd4' },
    secondary: { main: '#999999' },
    background: { default: '#121212', paper: '#1e1e1e' }
  }
})

function App() {
  const [audioData] = useState<number[]>([])

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', width: '100vw', overflow: 'hidden', p: 2 }}>
        <AudioVisualiser
          audioSource="microphone"
          audioData={audioData}
          showControls={true}
          fullscreenEnabled={true}
          autoChange={false}
          standalone={true}
        />
      </Box>
    </ThemeProvider>
  )
}

export default App
