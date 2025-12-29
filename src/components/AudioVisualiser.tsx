// src/components/AudioVisualiser.tsx

import { useState, useEffect, useCallback, useRef from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  ThemeProvider,
  CssBaseline,
  createTheme
} from '@mui/material'
import {
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  Code,
  Mic,
  Cloud,
  AutoAwesome,
  MusicNote
} from '@mui/icons-material'
import { FullScreen, useFullScreenHandle from 'react-full-screen'
import WebGLVisualiser, { type WebGLVisualisationType from './WebGLVisualiser'
import { gifFragmentShader from './shaders'
import useAudioAnalyser from './useAudioAnalyser'
import { SimpleSchemaForm from './SimpleSchemaForm'
import type { AudioVisualiserProps from './AudioVisualiser.types'
import {
  VISUALISER_SCHEMAS,
  DEFAULT_CONFIGS,
  VISUAL_TO_BACKEND_EFFECT,
  orderEffectProperties
} from './constants'

const internalDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00bcd4',
    secondary: { main: '#999999',
    background: { default: '#121212', paper: '#1e1e1e'
 
})

export const AudioVisualiser = ({
  audioSource: initialAudioSource = 'microphone',
  audioData: externalAudioData = [],
  defaultVisualType = 'gif',
  showControls = true,
  fullscreenEnabled = true,
  autoChange: initialAutoChange = false,
  effects,
  isConnected = true,
  onSubscribe,
  onUnsubscribe,
  onVisualTypeChange,
  onConfigChange,
  theme,
  standalone = false
}: AudioVisualiserProps) => {
  const fullscreenHandle = useFullScreenHandle()
  const finalTheme = theme || internalDarkTheme

  // Audio Analyser (Mic)
  const {
    data: micData,
    startListening,
    stopListening,
    isListening,
    error: micError
  = useAudioAnalyser()

  // Local state
  const [isPlaying, setIsPlaying] = useState(true)
  const [fullScreen, setFullScreen] = useState(false)
  const [visualType, setVisualType] = useState<WebGLVisualisationType>(defaultVisualType)
  const [config, setConfig] = useState<Record<string, any>>(DEFAULT_CONFIGS[defaultVisualType] || {})
  const [audioData, setAudioData] = useState<number[]>([])

  const [audioSource, setAudioSource] = useState<'backend' | 'mic'>(initialAudioSource === 'backend' ? 'backend' : 'mic')
  const [autoChange, setAutoChange] = useState(initialAutoChange)

  // Shader Editor State
  const [showCode, setShowCode] = useState(false)
  const [shaderCode, setShaderCode] = useState(gifFragmentShader)
  const [activeCustomShader, setActiveCustomShader] = useState<string | undefined>(undefined)

  const subscribedRef = useRef(false)
  const lastAutoChangeRef = useRef(0)

  // Handle external audio data updates
  useEffect(() => {
    if (audioSource === 'backend' && externalAudioData.length > 0) {
      setAudioData(externalAudioData)
   
 , [externalAudioData, audioSource])

  // Audio Data Subscription (Backend)
  useEffect(() => {
    if (audioSource === 'backend' && isConnected && !subscribedRef.current && onSubscribe) {
      onSubscribe('graph_update', 9100)
      subscribedRef.current = true
    else if (audioSource !== 'backend' && subscribedRef.current && onUnsubscribe) {
      onUnsubscribe('graph_update', 9100)
      subscribedRef.current = false
   

    return () => {
      if (subscribedRef.current && onUnsubscribe) {
        onUnsubscribe('graph_update', 9100)
        subscribedRef.current = false
     
   
 , [isConnected, audioSource, onSubscribe, onUnsubscribe])

  // Handle Source Switching
  const handleSourceChange = (
    event: React.MouseEvent<HTMLElement>,
    newSource: 'backend' | 'mic' | null
  ) => {
    if (newSource !== null) {
      setAudioSource(newSource)
      if (newSource === 'mic') {
        startListening()
      else {
        stopListening()
     
   
 

  const handleEffectConfig = (newConfig: any) => {
    const updatedConfig = { ...config, ...newConfig
    setConfig(updatedConfig)
    if (onConfigChange) {
      onConfigChange(updatedConfig)
   
 

  const handleTypeChange = useCallback(
    (type: WebGLVisualisationType) => {
      setVisualType(type)

      // Try to get defaults from backend schema if available
      const backendEffectType = VISUAL_TO_BACKEND_EFFECT[type]
      const backendSchema = effects && backendEffectType && effects[backendEffectType]?.schema

      if (backendSchema?.properties) {
        // Build config from backend schema defaults
        const backendDefaults: Record<string, any> = {}
        Object.keys(backendSchema.properties).forEach((key) => {
          const prop = backendSchema.properties[key]
          if (prop.default !== undefined) {
            backendDefaults[key] = prop.default
         
       )
        // Merge with our local defaults (local takes precedence for visualiser-specific settings)
        setConfig({ ...backendDefaults, ...(DEFAULT_CONFIGS[type] || {}), developer_mode: false)
      else {
        setConfig(DEFAULT_CONFIGS[type] || {})
     

      setActiveCustomShader(undefined)
      setShowCode(false)

      if (onVisualTypeChange) {
        onVisualTypeChange(type)
     
   ,
    [effects, onVisualTypeChange]
  )

  const handleApplyShader = () => {
    setActiveCustomShader(shaderCode)
 

  const activeAudioData = audioSource === 'mic' ? micData.normalizedFrequency : audioData
  const beatData =
    audioSource === 'mic'
      ? { isBeat: micData.isBeat, beatIntensity: micData.beatIntensity, bpm: micData.bpm
      : undefined

  // Calculate frequency bands from backend audio data
  const calculateFrequencyBands = useCallback(
    (data: number[]): { bass: number; mid: number; high: number => {
      if (data.length === 0) return { bass: 0, mid: 0, high: 0

      const len = data.length
      const bassEnd = Math.floor(len * 0.1) // ~0-10% = bass
      const midEnd = Math.floor(len * 0.5) // ~10-50% = mids
      // ~50-100% = highs

      let bassSum = 0
      let midSum = 0
      let highSum = 0
      for (let i = 0; i < len; i++) {
        if (i < bassEnd) {
          bassSum += data[i]
        else if (i < midEnd) {
          midSum += data[i]
        else {
          highSum += data[i]
       
     

      return {
        bass: bassEnd > 0 ? bassSum / bassEnd : 0,
        mid: midEnd - bassEnd > 0 ? midSum / (midEnd - bassEnd) : 0,
        high: len - midEnd > 0 ? highSum / (len - midEnd) : 0
     
   ,
    []
  )

  const frequencyBands =
    audioSource === 'mic'
      ? { bass: micData.bass, mid: micData.mid, high: micData.high
      : calculateFrequencyBands(audioData)

  const triggerRandomVisual = useCallback(() => {
    const types: WebGLVisualisationType[] = [
      // Original Effects
      'gif',
      'matrix',
      'terrain',
      'geometric',
      'concentric',
      'particles',
      'bars3d',
      'radial3d',
      'waveform3d',
      'bleep',
      // 2D Effects
      'bands',
      'bandsmatrix',
      'blocks',
      'equalizer2d',
      // Matrix Effects
      'blender',
      'clone',
      'digitalrain',
      'flame',
      'gameoflife',
      'image',
      'keybeat2d',
      'noise2d',
      'plasma2d',
      'plasmawled2d',
      'radial',
      'soap',
      'texter',
      'waterfall'
    ]
    const nextType = types[Math.floor(Math.random() * types.length)]
    if (nextType !== visualType) {
      handleTypeChange(nextType)
      lastAutoChangeRef.current = Date.now()
   
 , [visualType, handleTypeChange])

  // Auto Change Logic - Beat Detection for Mic
  const lastBeatChangeRef = useRef(0)
  const prevBeatRef = useRef(false)

  useEffect(() => {
    if (!autoChange || !isPlaying || audioSource !== 'mic') {
      prevBeatRef.current = false
      return
   

    // Only trigger on beat edge (false -> true transition)
    if (micData.isBeat && !prevBeatRef.current && micData.beatIntensity > 0.8) {
      const now = Date.now()
      if (now - lastAutoChangeRef.current >= 5000 && now - lastBeatChangeRef.current > 300) {
        lastBeatChangeRef.current = now
        setTimeout(() => triggerRandomVisual(), 0)
     
   

    prevBeatRef.current = micData.isBeat
 )

  // Auto Change Logic - Random Timer for Backend
  useEffect(() => {
    if (!autoChange || !isPlaying || audioSource !== 'backend') return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastAutoChangeRef.current >= 15000) {
        // Change every 15 seconds for backend
        triggerRandomVisual()
     
   , 1000)

    return () => clearInterval(interval)
 , [autoChange, isPlaying, audioSource, triggerRandomVisual])

  // Get schema properties for current visual type
  const getSchemaProperties = useCallback(() => {
    const backendEffectType = VISUAL_TO_BACKEND_EFFECT[visualType]
    
    if (effects && backendEffectType && effects[backendEffectType]) {
      return orderEffectProperties(
        effects[backendEffectType].schema,
        effects[backendEffectType].hidden_keys,
        effects[backendEffectType].advanced_keys,
        config.advanced
      )
   
    
    return VISUALISER_SCHEMAS[visualType] || []
 , [visualType, effects, config.advanced])

  return (
    <ThemeProvider theme={finalTheme}>
      <CssBaseline />
      <Grid
        container
        spacing={2}
        sx={{
          justifyContent: 'center',
          paddingTop: '1rem',
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto'
       }
      >
        {/* Top Row: Visualiser (Full Width) */}
        <Grid xs=12}>
          <Card variant="outlined" sx={{ '& > .MuiCardContent-root': { pb: '0.25rem'}>
            <CardContent>
              {/* Header / Controls */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  gap: 2
               }
              >
                <Box>
                  <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1}>
                    <MusicNote /> Audio Visualiser
                  </Typography>
                  <Typography variant="body2" color={micError ? 'error' : 'textSecondary'}>
                    {audioSource === 'mic'
                      ? micError
                        ? `Error: ${micError}`
                        : isListening
                          ? `Listening (BPM: ${micData.bpm})`
                          : 'Microphone Inactive'
                      : isConnected
                        ? 'Connected to Backend'
                        : 'Backend Disconnected'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}>
                  <FormControl size="small" sx={{ minWidth: 200}>
                    <InputLabel>Visualization</InputLabel>
                    <Select
                      value={visualType}
                      label="Visualization"
                      onChange={(e) => handleTypeChange(e.target.value as WebGLVisualisationType)}
                    >
                      <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem'}>
                        Original Effects
                      </MenuItem>
                      <MenuItem value="gif">Kaleidoscope</MenuItem>
                      <MenuItem value="matrix">Matrix Rain</MenuItem>
                      <MenuItem value="terrain">Synthwave Terrain</MenuItem>
                      <MenuItem value="geometric">Geometric Pulse</MenuItem>
                      <MenuItem value="concentric">Concentric Rings</MenuItem>
                      <MenuItem value="particles">Particles</MenuItem>
                      <MenuItem value="bars3d">Spectrum Bars</MenuItem>
                      <MenuItem value="radial3d">Radial Spectrum</MenuItem>
                      <MenuItem value="waveform3d">Waveform</MenuItem>
                      <MenuItem value="bleep">Oscilloscope</MenuItem>
                      <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem', mt: 1}>
                        2D Effects
                      </MenuItem>
                      <MenuItem value="bands">Bands</MenuItem>
                      <MenuItem value="bandsmatrix">Bands Matrix</MenuItem>
                      <MenuItem value="blocks">Blocks</MenuItem>
                      <MenuItem value="equalizer2d">Equalizer 2D</MenuItem>
                      <MenuItem disabled sx={{ opacity: 0.5, fontSize: '0.75rem', mt: 1}>
                        Matrix Effects
                      </MenuItem>
                      <MenuItem value="blender">Blender</MenuItem>
                      <MenuItem value="clone">Clone</MenuItem>
                      <MenuItem value="digitalrain">Digital Rain</MenuItem>
                      <MenuItem value="flame">Flame</MenuItem>
                      <MenuItem value="gameoflife">Game of Life</MenuItem>
                      <MenuItem value="image">Image</MenuItem>
                      <MenuItem value="keybeat2d">Keybeat 2D</MenuItem>
                      <MenuItem value="noise2d">Noise</MenuItem>
                      <MenuItem value="plasma2d">Plasma 2D</MenuItem>
                      <MenuItem value="plasmawled2d">Plasma WLED</MenuItem>
                      <MenuItem value="radial">Radial</MenuItem>
                      <MenuItem value="soap">Soap</MenuItem>
                      <MenuItem value="texter">Texter</MenuItem>
                      <MenuItem value="waterfall">Waterfall</MenuItem>
                    </Select>
                  </FormControl>

                  <ToggleButtonGroup
                    value={audioSource}
                    exclusive
                    onChange={handleSourceChange}
                    size="small"
                  >
                    <ToggleButton value="backend">
                      <Cloud sx={{ mr: 1} /> Backend
                    </ToggleButton>
                    <ToggleButton value="mic">
                      <Mic sx={{ mr: 1} /> Mic
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <Tooltip title="Auto-change visuals on beat">
                    <ToggleButton
                      value="auto"
                      selected={autoChange}
                      onChange={() => setAutoChange(!autoChange)}
                      size="small"
                      color="primary"
                    >
                      <AutoAwesome sx={{ mr: 1} /> Auto
                    </ToggleButton>
                  </Tooltip>

                  <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
                    <Button
                      onClick={() => setIsPlaying(!isPlaying)}
                      variant="outlined"
                      color="inherit"
                      sx={{ minWidth: '40px'}
                    >
                      {isPlaying ? <Pause /> : <PlayArrow />}
                    </Button>
                  </Tooltip>
                  {fullscreenEnabled && (
                    <Tooltip title="Fullscreen">
                      <Button
                        onClick={fullscreenHandle.enter}
                        variant="outlined"
                        color="inherit"
                        sx={{ minWidth: '40px'}
                      >
                        <Fullscreen />
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Canvas Area */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '60vh',
                  minHeight: '400px',
                  bgcolor: 'black',
                  borderRadius: 1,
                  overflow: 'hidden',
                  '& .fullscreen-wrapper': { width: '100%', height: '100%'
               }
              >
                <FullScreen
                  handle={fullscreenHandle}
                  onChange={setFullScreen}
                  className="fullscreen-wrapper"
                >
                  <Box
                    sx={{
                      width: fullScreen ? '100vw' : '100%',
                      height: fullScreen ? '100vh' : '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'black'
                   }
                    onDoubleClick={fullScreen ? fullscreenHandle.exit : fullscreenHandle.enter}
                  >
                    <WebGLVisualiser
                      audioData={activeAudioData}
                      isPlaying={isPlaying}
                      visualType={visualType}
                      config={config}
                      customShader={activeCustomShader}
                      beatData={beatData}
                      frequencyBands={frequencyBands}
                    />

                    {/* Debug Overlay */}
                    {config.developer_mode && audioSource === 'mic' && (
                      <Paper
                        sx={{
                          position: 'absolute',
                          top: 20,
                          right: 20,
                          p: 2,
                          width: 250,
                          bgcolor: 'rgba(0,0,0,0.8)',
                          color: 'white',
                          zIndex: 10
                       }
                      >
                        <Typography variant="subtitle2" gutterBottom sx={{ color: '#4fc3f7'}>
                          Audio Debug
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333'}>
                                  BPM
                                </TableCell>
                                <TableCell sx={{ color: 'white', borderBottom: '1px solid #333'}>
                                  {micData.bpm}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333'}>
                                  Confidence
                                </TableCell>
                                <TableCell sx={{ color: 'white', borderBottom: '1px solid #333'}>
                                  {(micData.confidence * 100).toFixed(0)}%
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333'}>
                                  Vol (RMS)
                                </TableCell>
                                <TableCell sx={{ color: 'white', borderBottom: '1px solid #333'}>
                                  {micData.overall.toFixed(3)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333'}>
                                  Bass
                                </TableCell>
                                <TableCell sx={{ color: 'white', borderBottom: '1px solid #333'}>
                                  {micData.bass.toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333'}>
                                  Mid
                                </TableCell>
                                <TableCell sx={{ color: 'white', borderBottom: '1px solid #333'}>
                                  {micData.mid.toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333'}>
                                  High
                                </TableCell>
                                <TableCell sx={{ color: 'white', borderBottom: '1px solid #333'}>
                                  {micData.high.toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333'}>
                                  Brightness
                                </TableCell>
                                <TableCell sx={{ color: 'white', borderBottom: '1px solid #333'}>
                                  {micData.spectralCentroid.toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ color: '#aaa', borderBottom: 'none'}>
                                  Noisiness
                                </TableCell>
                                <TableCell sx={{ color: 'white', borderBottom: 'none'}>
                                  {micData.spectralFlatness.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {micData.isBeat && (
                          <Box
                            sx={{
                              mt: 1,
                              height: 4,
                              width: '100%',
                              bgcolor: '#4fc3f7',
                              boxShadow: '0 0 10px #4fc3f7'
                           }
                          />
                        )}
                      </Paper>
                    )}

                    {fullScreen && (
                      <Box sx={{ position: 'absolute', bottom: 20, left: 20}>
                        <IconButton
                          onClick={fullscreenHandle.exit}
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)'
                         }
                        >
                          <FullscreenExit />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </FullScreen>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bottom Row - Only show if showControls is true */}
        {showControls && (
          <>
            <Grid xs=12, md: 8}>
              {/* Effect Configuration OR Shader Editor */}
              <Card variant="outlined" sx={{ height: '100%'}>
                <CardContent>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}
                  >
                    <Typography variant="h6">Configuration</Typography>
                    <Tooltip title="Edit Shader">
                      <IconButton
                        onClick={() => setShowCode(!showCode)}
                        color={showCode ? 'primary' : 'default'}
                      >
                        <Code />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {showCode ? (
                    <Box sx={{ p: 0}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={10}
                        maxRows={15}
                        value={shaderCode}
                        onChange={(e) => setShaderCode(e.target.value)}
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', mb: 2}
                        slotProps={{ 
                          htmlInput: { style: { fontFamily: 'monospace', fontSize: '12px'
                       }
                      />
                      <Button variant="contained" onClick={handleApplyShader} fullWidth>
                        Apply Shader
                      </Button>
                    </Box>
                  ) : (
                    <SimpleSchemaForm
                      schemaProperties={getSchemaProperties()}
                      values={config}
                      onChange={handleEffectConfig}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid xs=12, md: 4}>
              {/* Presets */}
              <Card variant="outlined" sx={{ height: '100%'}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Presets
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2}>
                    Quickly switch between different moods.
                  </Typography>

                  <Stack spacing={2}>
                    <Button onClick={() => handleTypeChange(visualType)} variant="outlined" fullWidth>
                      DEFAULT
                    </Button>
                    <Button
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          sensitivity: 2.5,
                          brightness: 1.2,
                          smoothing: 0.2
                       ))
                     
                      variant="outlined"
                      fullWidth
                      color="secondary"
                    >
                      HIGH ENERGY
                    </Button>
                    <Button
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, sensitivity: 0.8, smoothing: 0.9, speed: 0.5))
                     
                      variant="outlined"
                      fullWidth
                      color="info"
                    >
                      CHILL
                    </Button>
                  </Stack>

                  {audioSource === 'mic' && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1}>
                      <Typography variant="caption" display="block" gutterBottom>
                        AUDIO STATS
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5}>
                        <Typography variant="caption">BPM</Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {micData.bpm}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5}>
                        <Typography variant="caption">Confidence</Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {Math.round(micData.confidence * 100)}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between'}>
                        <Typography variant="caption">Beat Intensity</Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {micData.beatIntensity.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </ThemeProvider>
  )
}
