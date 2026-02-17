#!/usr/bin/env tsx
/**
 * Backend Schema Auto-Discovery
 * 
 * Automatically discovers all Twod-based 2D matrix effects from the LedFx backend
 * by fetching Python files from GitHub and parsing class definitions.
 * 
 * This eliminates hardcoded effect lists and automatically adapts when new Twod
 * effects are added to the backend. Effect names match backend filenames exactly.
 * 
 * Run: pnpm generate:backend
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTPUT_DIR = path.join(__dirname, '../src/_generated/webgl')
const CACHE_FILE = path.join(OUTPUT_DIR, '.backend-cache.json')
const GITHUB_API_BASE = 'https://api.github.com/repos/LedFx/LedFx/contents/ledfx/effects'

interface CacheEntry {
  sha: string
  content: string
  schema: EffectSchema
  lastFetched: string
}

interface CacheData {
  etag: string | null
  files: Record<string, CacheEntry>
}

/**
 * Frontend-only shaders that don't exist in backend
 * These are pure GLSL shaders without backend equivalents
 */
const FRONTEND_ONLY_SHADERS = [
  'bars3d',
  'particles',
  'waveform3d',
  'radial3d',
  'matrix',
  'terrain',
  'geometric',
  'image',
]

interface SchemaField {
  id: string
  title: string
  type: 'string' | 'number' | 'integer' | 'boolean' | 'color'
  description?: string
  default?: any
  min?: number
  max?: number
  step?: number
  enum?: string[]
  gradient?: boolean
}

interface EffectSchema {
  name: string
  fields: SchemaField[]
  hiddenKeys: string[]
  advancedKeys: string[]
  defaults: Record<string, any>
}

interface GitHubFile {
  name: string
  path: string
  download_url: string
  type: string
}

/**
 * Load cache from disk
 */
async function loadCache(): Promise<CacheData> {
  try {
    if (await fs.pathExists(CACHE_FILE)) {
      return await fs.readJson(CACHE_FILE)
    }
  } catch (error) {
    console.log('⚠️  Cache file invalid, will rebuild')
  }
  return { etag: null, files: {} }
}

/**
 * Save cache to disk
 */
async function saveCache(cache: CacheData): Promise<void> {
  await fs.writeJson(CACHE_FILE, cache, { spaces: 2 })
}

/**
 * Fetch directory listing from GitHub API with ETag caching
 */
async function fetchGitHubDirectory(etag: string | null = null): Promise<{ files: GitHubFile[], etag: string | null, modified: boolean }> {
  console.log('📂 Checking effects directory on GitHub...')
  const headers: Record<string, string> = {}
  if (etag) {
    headers['If-None-Match'] = etag
  }
  
  const response = await fetch(GITHUB_API_BASE, { headers })
  
  // 304 Not Modified - nothing changed!
  if (response.status === 304) {
    console.log('✅ Directory unchanged (ETag match), using cache\n')
    return { files: [], etag, modified: false }
  }
  
  // Rate limit or other error - if we have an ETag, assume cache is valid
  if (!response.ok) {
    if ((response.status === 403 || response.status === 429) && etag) {
      console.log('⚠️  GitHub rate limit reached, using cached data\n')
      return { files: [], etag, modified: false }
    }
    throw new Error(`Failed to fetch directory: ${response.statusText}`)
  }
  
  const newEtag = response.headers.get('etag')
  const files = await response.json() as any[]
  
  const filteredFiles = files.filter((file: any) => 
    file.type === 'file' && 
    file.name.endsWith('.py') &&
    file.name !== '__init__.py' &&
    !file.name.startsWith('template')
  )
  
  console.log(`   Found ${filteredFiles.length} Python files\n`)
  return { files: filteredFiles, etag: newEtag, modified: true }
}

/**
 * Fetch Python file content from GitHub
 */
async function fetchGitHubFile(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }
  return response.text()
}

/**
 * Check if Python file defines a Twod-based or 2D/Matrix effect
 */
function isWebGLEffect(content: string): boolean {
  // Matches: class XYZ(Twod) or CATEGORY = "2D" or CATEGORY = "Matrix"
  const classRegex = /class\s+\w+\([^)]*\bTwod\b[^)]*\):/
  const categoryRegex = /CATEGORY\s*=\s*["'](2D|Matrix)["']/i
  return classRegex.test(content) || categoryRegex.test(content)
}

/**
 * Mapping of backend filenames to frontend visualizer IDs
 */
const BACKEND_TO_FRONTEND_MAP: Record<string, string> = {
  'digitalrain2d': 'digitalrain',
  'flame2d': 'flame',
  'game_of_life': 'gameoflife',
  'gifplayer': 'gif',
  'imagespin': 'gif',
  'plasmawled': 'plasmawled2d',
  'soap2d': 'soap',
  'texter2d': 'texter',
  'waterfall2d': 'waterfall',
  'bands_matrix': 'bandsmatrix',
  'equalizer2d': 'equalizer2d',
  'noise2d': 'noise2d',
  'plasma2d': 'plasma2d',
  'radial': 'radial',
  'bleep': 'bleep',
  'clone': 'clone',
  'concentric': 'concentric',
  'bands': 'bands',
  'blender': 'blender',
  'blocks': 'blocks',
  'keybeat2d': 'keybeat2d'
}

/**
 * Extract effect name from Python filename and map to frontend ID
 */
function filenameToEffectName(filename: string): string {
  const baseName = filename.replace('.py', '')
  return BACKEND_TO_FRONTEND_MAP[baseName] || baseName.replace(/2d$/, '')
}

/**
 * Parse Python effect file and extract schema information
 */
function parsePythonEffect(content: string, effectName: string): EffectSchema {
  const fields: SchemaField[] = []
  const defaults: Record<string, any> = { developer_mode: false }
  let hiddenKeys: string[] = []
  let advancedKeys: string[] = []

  // Helper to extract keys from assignments like HIDDEN_KEYS = ... + ["a", "b"]
  const extractKeys = (pattern: RegExp): string[] => {
    const match = content.match(pattern)
    if (!match) return []
    const bracketsContent = match[1]
    return bracketsContent
      .split(',')
      .map(k => k.trim().replace(/['"]/g, ''))
      .filter(k => k && k !== '...')
  }

  hiddenKeys = extractKeys(/HIDDEN_KEYS\s*=\s*[^[\]]*\[([\s\S]*?)\]/)
  advancedKeys = extractKeys(/ADVANCED_KEYS\s*=\s*[^[\]]*\[([\s\S]*?)\]/)

  // Add base class keys if referenced
  if (content.includes('Twod.HIDDEN_KEYS')) {
    hiddenKeys.push('mirror', 'flip', 'blur', 'dump')
  }
  if (content.includes('AudioReactiveEffect.ADVANCED_KEYS')) {
    advancedKeys.push('frequency_range')
  }
  if (content.includes('Twod.ADVANCED_KEYS')) {
    advancedKeys.push('dump', 'test', 'flip_horizontal', 'flip_vertical', 'background_mode')
  }

  // Extract CONFIG_SCHEMA fields
  // Support both vol.Optional and vol.Required
  const fieldRegex = /vol\.(Optional|Required)\s*\(\s*["']([^"']+)["']\s*(?:,\s*description\s*=\s*["']([^"']*)["'])?\s*(?:,\s*default\s*=\s*([\s\S]*?))?\s*\)\s*:\s*([\s\S]*?)(?=,\s*vol\.(?:Optional|Required)|(?:\s*\n\s*\})|$)/gs

  let match
  while ((match = fieldRegex.exec(content)) !== null) {
    // eslint-disable-next-line prefer-const
    let [ , , id, description, defaultValue, validator ] = match
    
    // Clean up trailing commas from defaultValue and validator
    if (defaultValue) defaultValue = defaultValue.trim().replace(/,$/, '').trim()
    if (validator) validator = validator.trim().replace(/,$/, '').trim()

    // Parse validator to determine type and constraints
    const field = parseValidator(id, description || '', defaultValue, validator)
    if (field) {
      fields.push(field)
      defaults[id] = field.default
    }
  }

  // Inject inherited fields from base classes if they are not redefined
  const inheritedFields: SchemaField[] = []

  if (content.includes('GradientEffect') || effectName === 'radial') {
    inheritedFields.push(
      {
        id: 'gradient',
        title: 'Gradient',
        type: 'color',
        gradient: true,
        default: 'linear-gradient(90deg, rgb(255, 0, 0) 0%, rgb(255, 120, 0) 14%, rgb(255, 200, 0) 28%, rgb(0, 255, 0) 42%, rgb(0, 199, 140) 56%, rgb(0, 0, 255) 70%, rgb(128, 0, 128) 84%, rgb(255, 0, 178) 98%)',
        description: 'Color gradient to display'
      },
      {
        id: 'gradient_roll',
        title: 'Gradient Roll',
        type: 'number',
        default: 0,
        min: 0,
        max: 10,
        step: 0.1,
        description: 'Amount to shift the gradient'
      }
    )
  }

  if (content.includes('Twod')) {
    inheritedFields.push(
      { id: 'flip_horizontal', title: 'Flip Horizontal', type: 'boolean', default: false, description: 'Flip image horizontally' },
      { id: 'flip_vertical', title: 'Flip Vertical', type: 'boolean', default: false, description: 'Flip image vertically' },
      { id: 'rotate', title: 'Rotate', type: 'integer', default: 0, min: 0, max: 360, step: 1, description: 'Rotation in degrees' },
      { id: 'background_mode', title: 'Background Mode', type: 'string', default: 'additive', description: 'Background blending mode' }
    )
  }

  // Common Effect fields often desired in UI
  inheritedFields.push(
    { id: 'brightness', title: 'Brightness', type: 'number', default: 1.0, min: 0, max: 1.0, step: 0.01 },
    { id: 'blur', title: 'Blur', type: 'number', default: 0.0, min: 0, max: 10, step: 0.1 }
  )

  for (const f of inheritedFields) {
    if (!fields.find(existing => existing.id === f.id)) {
      fields.push(f)
      defaults[f.id] = f.default
    }
  }


  return {
    name: effectName,
    fields,
    hiddenKeys,
    advancedKeys,
    defaults
  }
}

/**
 * Parse voluptuous validator to determine field type and constraints
 */
function parseValidator(id: string, description: string, defaultValue: string | undefined, validator: string): SchemaField | null {
  const field: SchemaField = {
    id,
    title: id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    type: 'string',
    description
  }

  // Parse default value - clean up trailing commas and whitespace
  if (defaultValue) {
    defaultValue = defaultValue.trim().replace(/,$/, '').trim()
    
    if (defaultValue === 'True') {
      field.default = true
    } else if (defaultValue === 'False') {
      field.default = false
    } else if (defaultValue.startsWith('"') || defaultValue.startsWith("'")) {
      field.default = defaultValue.slice(1, -1)
    } else if (!isNaN(Number(defaultValue)) && defaultValue !== '') {
      field.default = Number(defaultValue)
    } else if (defaultValue.startsWith('#')) {
      // Color hex value
      field.default = defaultValue
    } else if (defaultValue.includes('.value')) {
      // Enum reference like HealthOptions.ALL.value - extract the enum name
      const enumMatch = defaultValue.match(/\.([A-Z]+)\.value/)
      field.default = enumMatch ? enumMatch[1].toLowerCase() : defaultValue
    } else {
      // Keep as string, strip quotes if present
      field.default = defaultValue.replace(/^["']|["']$/g, '')
    }
  }

  // Parse validator type
  if (validator === 'bool') {
    field.type = 'boolean'
    field.default = field.default ?? false
  } else if (validator.includes('validate_color')) {
    field.type = 'color'
    field.gradient = false
    field.default = field.default ?? '#000000'
  } else if (validator.includes('validate_gradient')) {
    field.type = 'color'
    field.gradient = true
  } else if (validator.includes('vol.In')) {
    // Enum type
    field.type = 'string'
    // Try to extract enum values
    const inMatch = validator.match(/vol\.In\s*\(\s*\[([\s\S]*?)\]\s*\)/)
    if (inMatch) {
      field.enum = inMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''))
    } else if (validator.includes('TEXT_EFFECT_MAPPING')) {
      field.enum = ["Side Scroll", "Spokes", "Carousel", "Wave", "Pulse", "Fade"]
    } else if (validator.includes('FONT_MAPPINGS')) {
      field.enum = ["Press Start 2P", "Blade-5x8", "8bitOperatorPlus8-Regular", "Roboto-Black", "Roboto-Bold", "Roboto-Regular", "Stop", "technique"]
    } else if (validator.includes('ResizeMethods')) {
      field.enum = ["Fastest", "Fast", "Slow"]
    }
  } else if (validator.includes('vol.Coerce(float)') || validator.includes('vol.Coerce(int)')) {
    // Number type with range
    field.type = validator.includes('vol.Coerce(int)') ? 'integer' : 'number'
    
    // Improved regex to handle vol.Range(min=0, max=1) as well as vol.Range(0, 1)
    const rangeMatch = validator.match(/vol\.Range\s*\(\s*(?:min\s*=\s*)?([^,\s)]+)(?:\s*,\s*(?:max\s*=\s*)?([^,\s)]+))?\s*\)/)
    if (rangeMatch) {
      field.min = Number(rangeMatch[1])
      if (rangeMatch[2]) {
        field.max = Number(rangeMatch[2])
      }
      
      // Calculate step based on range and type
      if (field.type === 'integer') {
        field.step = 1
      } else {
        const min = field.min ?? 0
        const max = field.max ?? 1
        const range = max - min
        field.step = range > 10 ? 1 : range > 1 ? 0.1 : 0.01
      }
    }
    
    // Ensure default is a number
    if (typeof field.default === 'string') {
      field.default = Number(field.default) || (field.min ?? 0)
    }
    field.default = field.default ?? (field.min ?? 0)
  }

  return field
}

/**
 * Generate TypeScript schema definitions file
 */
function generateSchemasFile(schemas: Record<string, EffectSchema>): string {
  let output = `/**
 * WebGL Visualizer UI Schemas (Auto-Generated from Backend)
 * 
 * ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: https://github.com/LedFx/LedFx/tree/main/ledfx/effects
 * 
 * Run \`pnpm generate:backend\` to regenerate.
 */

import { VisualizerSchema } from '../../../schemas/base.schema'

export const VISUALISER_SCHEMAS: Record<string, VisualizerSchema> = {\n`

  for (const [key, schema] of Object.entries(schemas)) {
    const displayName = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

    // UI Tweaks for specific effects
    if (key === 'texter') {
      schema.hiddenKeys.push('alpha', 'text_color', 'use_gradient', 'option_1', 'option_2', 'value_option_1', 'resize_method', 'deep_diag', 'background_mode', 'blur', 'height_percent')
      schema.advancedKeys.push('impulse_decay', 'multiplier', 'speed_option_1', 'gradient_roll')

      // Add zoom, squeeze_x, squeeze_y, offset_x, offset_y fields for new shader controls (no height_percent)
      schema.fields = schema.fields.filter(f => f.id !== 'height_percent')
      schema.fields.push(
        {
          id: 'zoom',
          title: 'Zoom',
          type: 'number',
          default: 1.0,
          min: 0.1,
          max: 5.0,
          step: 0.01
        },
        {
          id: 'stretch_x',
          title: 'Stretch X',
          type: 'number',
          default: 1.0,
          min: 0.1,
          max: 5.0,
          step: 0.01
        },
        {
          id: 'stretch_y',
          title: 'Stretch Y',
          type: 'number',
          default: 1.0,
          min: 0.1,
          max: 5.0,
          step: 0.01
        },
        {
          id: 'offset_x',
          title: 'Offset X',
          type: 'number',
          default: 0.0,
          min: -2.0,
          max: 2.0,
          step: 0.01
        },
        {
          id: 'offset_y',
          title: 'Offset Y',
          type: 'number',
          default: 0.0,
          min: -2.0,
          max: 2.0,
          step: 0.01
        }
      )
      schema.defaults.font_size = 240
      schema.defaults.zoom = 1.0
      schema.defaults.stretch_x = 1.0
      schema.defaults.stretch_y = 1.0
      schema.defaults.offset_x = 0.0
      schema.defaults.offset_y = 0.0
    }

    output += `  "${key}": {\n`
    output += `    $id: '${key}',\n`
    output += `    displayName: '${displayName}',\n`
    output += `    type: 'object',\n`
    output += `    properties: {\n`
    
    for (const field of schema.fields) {
      const isHidden = schema.hiddenKeys.includes(field.id)
      
      output += `      "${field.id}": {\n`
      output += `        type: '${field.type === 'color' ? 'string' : field.type}',\n`
      output += `        title: '${field.title}',\n`
      if (field.description) {
        output += `        description: '${field.description.replace(/'/g, "\\'")}',\n`
      }
      if (field.default !== undefined) {
        output += `        default: ${JSON.stringify(field.default)},\n`
      }
      if (field.min !== undefined) output += `        minimum: ${field.min},\n`
      if (field.max !== undefined) output += `        maximum: ${field.max},\n`
      if (field.step !== undefined) output += `        step: ${field.step},\n`
      if (field.enum !== undefined) output += `        enum: ${JSON.stringify(field.enum)},\n`

      if (field.type === 'color') {
        output += `        format: 'color',\n`
        if (field.gradient) output += `        isGradient: true,\n`
      }
      
      output += `        ui: {\n`
      if (isHidden) output += `          hidden: true,\n`
      output += `        }\n`
      output += `      },\n`
    }
    
    output += `    },\n`
    output += `    required: ${JSON.stringify(schema.fields.map(f => f.id))},\n`
    output += `    metadata: {\n`
    output += `      category: 'Matrix Effects'\n`
    output += `    }\n`
    output += `  },\n`
  }

  output += `}\n`
  return output
}

/**
 * Generate TypeScript defaults file
 */
function generateDefaultsFile(schemas: Record<string, EffectSchema>): string {
  let output = `/**
 * WebGL Visualizer Default Configurations (Auto-Generated from Backend)
 * 
 * ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: https://github.com/LedFx/LedFx/tree/main/ledfx/effects
 * 
 * Run \`pnpm generate:backend\` to regenerate.
 */

export const DEFAULT_CONFIGS: Record<string, any> = {\n`

  for (const [key, schema] of Object.entries(schemas)) {
    output += `  "${key}": ${JSON.stringify(schema.defaults, null, 2).replace(/\n/g, '\n  ')},\n`
  }

  output += `}\n`
  return output
}

/**
 * Generate backend mapping file
 */
function generateBackendMappingFile(schemas: Record<string, EffectSchema>, originalNames: Record<string, string>): string {
  const backendMapping: Record<string, string> = {}
  
  for (const [frontendId, backendFilename] of Object.entries(originalNames)) {
    if (schemas[frontendId]) {
      backendMapping[frontendId] = backendFilename
    }
  }

  const output = `/**
 * WebGL to Backend Effect Mapping (Auto-Generated)
 * 
 * ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: https://github.com/LedFx/LedFx/tree/main/ledfx/effects
 * 
 * Run \`pnpm generate:backend\` to regenerate.
 */

export const VISUAL_TO_BACKEND_EFFECT: Record<string, string> = ${JSON.stringify(backendMapping, null, 2)}
`

  return output
}

/**
 * Main execution - Auto-discover and generate
 */
async function main() {
  console.log('🔄 Auto-discovering 2D/Matrix effects from LedFx backend...\n')

  fs.ensureDirSync(OUTPUT_DIR)
  
  // Invalidate cache to ensure all schemas are regenerated with new logic
  if (fs.existsSync(CACHE_FILE)) {
    console.log('🧹 Invalidating cache to apply new generation logic...\n')
    fs.removeSync(CACHE_FILE)
  }

  const schemas: Record<string, EffectSchema> = {}
  const originalNames: Record<string, string> = {}
  let processed = 0
  let cached = 0
  let skipped = 0

  try {
    // Load cache
    const cache = await loadCache()
    
    // Fetch directory listing with ETag
    const { files, etag, modified } = await fetchGitHubDirectory(cache.etag)
    
    // If directory hasn't changed and we have cache, use it entirely
    if (!modified && Object.keys(cache.files).length > 0) {
      console.log('📦 Using cached schemas (no changes detected)\n')
      for (const [effectName, entry] of Object.entries(cache.files)) {
        schemas[effectName] = entry.schema
        // Try to reconstruct original backend name for mapping
        const originalName = Object.keys(BACKEND_TO_FRONTEND_MAP).find(k => BACKEND_TO_FRONTEND_MAP[k] === effectName) || effectName
        originalNames[effectName] = originalName
        cached++
      }
    } else {
      // Directory changed or cache empty - process files
      const newCache: CacheData = { etag: etag || cache.etag, files: {} }
      
      for (const file of files) {
        const backendFilename = file.name.replace('.py', '')
        const effectName = filenameToEffectName(file.name)
        
        try {
          // Check if file unchanged in cache (by SHA)
          const cachedEntry = cache.files[effectName]
          if (cachedEntry && cachedEntry.sha === (file as any).sha) {
            console.log(`📦 ${effectName} (cached)`)
            schemas[effectName] = cachedEntry.schema
            originalNames[effectName] = backendFilename
            newCache.files[effectName] = cachedEntry
            cached++
            continue
          }
          
          // File changed or new - fetch it
          console.log(`Fetching: ${file.download_url}`)
          const content = await fetchGitHubFile(file.download_url)
          
          // Check if this is a WebGL-relevant effect
          if (!isWebGLEffect(content)) {
            console.log(`⏭️  Skipping ${file.name} (not a 2D/Matrix effect)`)
            skipped++
            continue
          }
          
          // Parse the effect schema
          const schema = parsePythonEffect(content, effectName)
          schemas[effectName] = schema
          originalNames[effectName] = backendFilename
          
          // Cache it
          newCache.files[effectName] = {
            sha: (file as any).sha,
            content,
            schema,
            lastFetched: new Date().toISOString()
          }
          
          processed++
          console.log(`✅ Discovered ${effectName}`)
          
        } catch (error) {
          console.error(`❌ Failed to process ${file.name}:`, error)
          skipped++
        }
      }
      
      // Save updated cache
      await saveCache(newCache)
    }

    // Report statistics
    console.log(`\n📊 Discovery Summary:`)
    console.log(`   ✅ Generated: ${processed} new`)
    console.log(`   📦 Cached: ${cached} unchanged`)
    console.log(`   ⏭️  Skipped: ${skipped} files`)
    console.log(`   📝 Frontend-only: ${FRONTEND_ONLY_SHADERS.length} shaders (${FRONTEND_ONLY_SHADERS.join(', ')})`)

    // Generate TypeScript files
    console.log('\n📝 Generating TypeScript files...')
    
    const schemasContent = generateSchemasFile(schemas)
    const defaultsContent = generateDefaultsFile(schemas)
    const mappingContent = generateBackendMappingFile(schemas, originalNames)

    await fs.writeFile(path.join(OUTPUT_DIR, 'schemas.ts'), schemasContent)
    await fs.writeFile(path.join(OUTPUT_DIR, 'defaults.ts'), defaultsContent)
    await fs.writeFile(path.join(OUTPUT_DIR, 'backend-mapping.ts'), mappingContent)

    console.log(`✅ Generated ${Object.keys(schemas).length} effect schemas`)
    console.log(`   Output: ${path.relative(process.cwd(), OUTPUT_DIR)}`)

    console.log('\n🎉 Auto-discovery complete!')
    if (cached > 0) {
      console.log(`   ⚡ Cached ${cached} effects (no GitHub requests!)`)
    }
    console.log('   New 2D/Matrix effects in backend will be automatically discovered!')
    
  } catch (error) {
    console.error('\n❌ Fatal error during auto-discovery:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
