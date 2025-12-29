import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import VisualiserIso from './VisualiserIso'

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  }
})

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <VisualiserIso theme={darkTheme} />
    </ThemeProvider>
  )
}

export default App
