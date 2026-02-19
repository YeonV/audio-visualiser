#!/usr/bin/env tsx
/**
 * Schema Generator
 * 
 * Transforms JSON schemas into TypeScript types, defaults, and UI schemas.
 * This is the magic that makes schema-first development work.
 * 
 * Run: pnpm generate
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import type { VisualizerSchema, SchemaProperty } from '../schemas/base.schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCHEMAS_DIR = path.join(__dirname, '../schemas')
const OUTPUT_DIR = path.join(__dirname, '../src/_generated')

// Ensure output directory exists
fs.ensureDirSync(OUTPUT_DIR)

/**
 * Convert schema property type to TypeScript type
 */
function schemaTypeToTS(prop: SchemaProperty): string {
  switch (prop.type) {
    case 'string':
      return 'string'
    case 'number':
    case 'integer':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'array':
      return `Array<${schemaTypeToTS(prop.items)}>`
    case 'object':
      { const objProps = Object.entries(prop.properties)
        .map(([key, value]) => `${key}: ${schemaTypeToTS(value)}`)
        .join('; ')
      return `{ ${objProps} }` }
    default:
      return 'any'
  }
}

/**
 * Generate TypeScript interface from schema
 */
function generateInterface(schema: VisualizerSchema): string {
  const interfaceName = toPascalCase(schema.$id) + 'Config'
  
  const properties = Object.entries(schema.properties).map(([key, prop]) => {
    const isRequired = schema.required?.includes(key) ?? false
    const optionalMarker = isRequired ? '' : '?'
    return `  ${key}${optionalMarker}: ${schemaTypeToTS(prop)}`
  }).join('\n')
  
  return `export interface ${interfaceName} {\n${properties}\n}`
}

/**
 * Generate default configuration constant from schema
 */
function generateDefaults(schema: VisualizerSchema): string {
  const constName = 'DEFAULT_' + toUpperSnakeCase(schema.$id) + '_CONFIG'
  const interfaceName = toPascalCase(schema.$id) + 'Config'
  
 const defaults = Object.entries(schema.properties).map(([key, prop]) => {
    const value = JSON.stringify(prop.default)
    return `  ${key}: ${value}`
  }).join(',\n')
  
  return `export const ${constName}: ${interfaceName} = {\n${defaults}\n}`
}

/**
 * Generate UI schema for BladeSchemaForm
 */
function generateUISchema(schema: VisualizerSchema): string {
  const constName = toUpperSnakeCase(schema.$id) + '_UI_SCHEMA'
  
  // Filter out hidden properties
  const visibleProps = Object.entries(schema.properties)
    .filter(([_, prop]) => !prop.ui?.hidden)

  // Sort properties according to requirement
  visibleProps.sort((a, b) => {
    const getOrder = (p: SchemaProperty) => {
      if ((p as any).format === 'color' || (p as any).isGradient) return 1
      if (p.type === 'number' || p.type === 'integer') return 2
      if ((p as any).enum) return 3
      if (p.type === 'string') return 4
      if (p.type === 'boolean') return 5
      return 6
    }
    const orderA = getOrder(a[1])
    const orderB = getOrder(b[1])
    if (orderA === orderB) {
      return (a[1].title || a[0]).localeCompare(b[1].title || b[0])
    }
    return orderA - orderB
  })
  
  // Generate properties object
  const properties = visibleProps.map(([key, prop]) => {
    // Special case: Butterchurn preset name should be autocomplete from the start
    const isButterchurnPreset = schema.$id === 'butterchurn' && key === 'currentPresetName'
    
    const propObj: any = {
      type: isButterchurnPreset ? 'autocomplete' :
            (prop as any).enum ? 'string' : // Force string for enums to trigger BladeSelect
            prop.type === 'integer' ? 'integer' : 
            (prop as any).format === 'color' ? 'color' : 
            prop.type,
      title: prop.title,
      default: prop.default
    }
    
    if (prop.description) propObj.description = prop.description
    if ('minimum' in prop && prop.minimum !== undefined) propObj.minimum = prop.minimum
    if ('maximum' in prop && prop.maximum !== undefined) propObj.maximum = prop.maximum
    if ('step' in prop && (prop as any).step !== undefined) propObj.step = (prop as any).step
    if ('isGradient' in prop && prop.isGradient) propObj.isGradient = true
    
    // Add enum and freeSolo
    if (isButterchurnPreset) {
      propObj.enum = []
      propObj.freeSolo = true
    } else if ((prop as any).enum) {
      propObj.enum = (prop as any).enum
    }
    
    return `    ${key}: ${JSON.stringify(propObj, null, 6).replace(/\n/g, '\n    ')}`
  }).join(',\n')
  
  // Generate permitted_keys array
  const permittedKeys = visibleProps.map(([key]) => `'${key}'`).join(', ')
  
  return `export const ${constName} = {
  properties: {
${properties}
  },
  permitted_keys: [${permittedKeys}]
}`
}

/**
 * Generate dynamic UI schema getter (for conditional fields)
 */
function generateDynamicUISchema(schema: VisualizerSchema): string {
  const funcName = 'get' + toPascalCase(schema.$id) + 'UISchema'
  const configType = toPascalCase(schema.$id) + 'Config'
  const constName = toUpperSnakeCase(schema.$id) + '_UI_SCHEMA'
  
  // Check if schema has conditional fields or runtime enum population
  const hasConditional = Object.values(schema.properties).some(prop => prop.ui?.showIf)
  const needsRuntimeEnums = schema.$id === 'butterchurn'
  
  if (!hasConditional && !needsRuntimeEnums) {
    // No conditional logic or runtime enums needed
    return `export const ${funcName} = () => ${constName}`
  }
  
  // Generate dynamic schema with conditional logic and/or runtime enums
  return `export function ${funcName}(config?: Partial<${configType}>) {
  const baseSchema = JSON.parse(JSON.stringify(${constName}))${needsRuntimeEnums ? `
  
  // Special case: Butterchurn preset enum loaded at runtime
  if (baseSchema.properties.currentPresetName && typeof window !== 'undefined') {
    const presetNames = (window as any).visualiserApi?.getPresetNames?.() || []
    if (presetNames.length > 0) {
      baseSchema.properties.currentPresetName.type = 'autocomplete'
      baseSchema.properties.currentPresetName.enum = presetNames
      baseSchema.properties.currentPresetName.full = true
      baseSchema.properties.currentPresetName.freeSolo = true
    }
  }` : ''}${hasConditional ? `
  
  const visibleProps: any = {}
  
  Object.entries(baseSchema.properties).forEach(([key, prop]: [string, any]) => {
    // Check showIf conditions
    const showIf = ${JSON.stringify(
      Object.fromEntries(
        Object.entries(schema.properties)
          .filter(([_, prop]) => prop.ui?.showIf)
          .map(([key, prop]) => [key, prop.ui!.showIf])
      ),
      null,
      2
    )}[key]
    
    if (!showIf) {
      visibleProps[key] = prop
      return
    }
    
    // Evaluate showIf conditions
    const shouldShow = config && Object.entries(showIf).every(([condKey, condValue]) => 
      config?.[condKey as keyof ${configType}] === condValue
    )
    
    if (shouldShow) {
      visibleProps[key] = prop
    }
  })
  
  return {
    ...baseSchema,
    properties: visibleProps,
    permitted_keys: Object.keys (visibleProps)
  }` : `
  
  return baseSchema`}
}`
}

/**
 * Generate registry entry
 */
function generateRegistryEntry(schema: VisualizerSchema): string {
  const id = schema.$id
  const configType = toPascalCase(id) + 'Config'
  const defaultConst = 'DEFAULT_' + toUpperSnakeCase(id) + '_CONFIG'
  const uiSchemaGetter = 'get' + toPascalCase(id) + 'UISchema'
  
  return `  '${id}': {
    $id: '${id}',
    displayName: '${schema.displayName}',
    configType: '${configType}',
    defaultConfig: ${defaultConst},
    getUISchema: ${uiSchemaGetter},
    metadata: ${JSON.stringify(schema.metadata || {}, null, 4).replace(/\n/g, '\n    ')}
  }`
}

/**
 * Utility: Convert to PascalCase
 */
function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, match => match.replace('_', '').toUpperCase())
}

/**
 * Utility: Convert to camelCase
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/**
 * Utility: Convert to UPPER_SNAKE_CASE
 */
function toUpperSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '')
}

/**
 * Main generator
 */
async function generate() {
  console.log('🔧 Generating schemas...\n')
  
  // Find all schema files
  const schemaFiles = fs.readdirSync(SCHEMAS_DIR)
    .filter((f: string) => f.endsWith('.schema.ts') && f !== 'base.schema.ts')
  
  console.log(`Found ${schemaFiles.length} schema(s): ${schemaFiles.join(', ')}\n`)
  
  // Import all schemas dynamically
  const schemas: VisualizerSchema[] = []
  const schemaImports: string[] = []
  
  for (const file of schemaFiles) {
    const schemaName = file.replace('.schema.ts', '')
    const fullPath = path.join(SCHEMAS_DIR, file)
    const fileUrl = 'file://' + fullPath.replace(/\\/g, '/')
    
    console.log(`  → Importing ${file}`)
    
    try {
      const module = await import(fileUrl)
      
      // Find the schema export (look for any export ending with 'Schema')
      const schemaExportName = Object.keys(module).find(key => key.endsWith('Schema'))
      
      if (schemaExportName) {
        const schema = module[schemaExportName]
        schemas.push(schema)
        schemaImports.push(`import { ${schemaExportName} } from '../schemas/${file.replace('.ts', '')}'`)
        console.log(`    ✓ Loaded ${schema.displayName} (${schema.$id})`)
      } else {
        console.log(`    ✗ No schema export found in module`)
        console.log(`    Available exports:`, Object.keys(module))
      }
    } catch (err: any) {
      console.error(`  ✗ Failed to load ${file}:`, err.message || err)
    }
  }
  
  console.log(`\nSuccessfully loaded ${schemas.length} schema(s)\n`)
  
  // Also load backend-generated schemas if they exist
  const backendSchemasPath = path.join(OUTPUT_DIR, 'webgl/schemas.ts')
  if (fs.existsSync(backendSchemasPath)) {
    console.log('📦 Loading backend-discovered schemas...')
    try {
      const backendModule = await import('file://' + backendSchemasPath.replace(/\\/g, '/'))
      const backendSchemas = backendModule.VISUALISER_SCHEMAS
      if (backendSchemas) {
        const backendSchemaList = Object.values(backendSchemas) as VisualizerSchema[]
        schemas.push(...backendSchemaList)
        console.log(`    ✓ Loaded ${backendSchemaList.length} backend schema(s)`)
      }
    } catch (err: any) {
      console.error(`    ✗ Failed to load backend schemas:`, err.message || err)
    }
  }

  // Generate outputs
  let typesOutput = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from schemas by generate-schemas.ts
 * Run: pnpm generate
 */

`
  
  let uiSchemasOutput = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated UI schemas for BladeSchemaForm
 * Run: pnpm generate
 */

`
  
  let registryOutput = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Visualizer Registry
 * Run: pnpm generate
 */

export interface RegistryEntry<T = any> {
  $id: string
  displayName: string
  configType: string
  defaultConfig: T
  getUISchema: (config?: Partial<T>) => any
  metadata: Record<string, any>
}

export interface VisualizerRegistry {
  [key: string]: RegistryEntry
}

`
  
  // Generate for each schema
  for (const schema of schemas) {
    typesOutput += generateInterface(schema) + '\n\n'
    typesOutput += generateDefaults(schema) + '\n\n'
    
    uiSchemasOutput += generateUISchema(schema) + '\n\n'
    uiSchemasOutput += generateDynamicUISchema(schema) + '\n\n'
  }
  
  // Generate registry
  registryOutput += `export const VISUALIZER_REGISTRY: VisualizerRegistry = {\n`
  registryOutput += schemas.map(s => generateRegistryEntry(s)).join(',\n\n')
  registryOutput += `\n}\n\n`
  
  // Export convenience getters
  registryOutput += `/**
 * Get config for a visualizer
 */
export function getVisualizerConfig<T = any>(id: string): T {
  return VISUALIZER_REGISTRY[id]?.defaultConfig
}

/**
 * Get UI schema for a visualizer
 */
export function getVisualizerUISchema(id: string, config?: any) {
  return VISUALIZER_REGISTRY[id]?.getUISchema(config)
}

/**
 * Get all visualizer IDs
 */
export function getVisualizerIds(): string[] {
  return Object.keys(VISUALIZER_REGISTRY)
}

/**
 * Visualizer option for Autocomplete with category metadata
 */
export interface VisualizerOption {
  id: string
  displayName: string
  category: string
}

/**
 * All visualizers as flat array (for Autocomplete groupBy)
 * Static const array - computed at build time
 */
export const ALL_VISUALIZERS: VisualizerOption[] = [
${schemas.map(s => `  { id: '${s.$id}', displayName: '${s.displayName}', category: '${s.metadata?.category || 'Other'}' }`).join(',\n')}
]
`
  
  // Import types and defaults into UI schemas
  const typeImports = schemas.map(s => {
    const configType = toPascalCase(s.$id) + 'Config'
    const defaultConst = 'DEFAULT_' + toUpperSnakeCase(s.$id) + '_CONFIG'
    return `${configType}, ${defaultConst}`
  }).join(', ')
  
  uiSchemasOutput = `import { ${typeImports} } from './types'\n\n` + uiSchemasOutput
  
  // Import everything into registry
  const registryTypeImports = schemas.map(s => toPascalCase(s.$id) + 'Config').join(', ')
  const registryDefaultImports = schemas.map(s => 
    'DEFAULT_' + toUpperSnakeCase(s.$id) + '_CONFIG'
  ).join(', ')
  const registryUIImports = schemas.map(s => 
    'get' + toPascalCase(s.$id) + 'UISchema'
  ).join(', ')
  
  registryOutput = `import { ${registryTypeImports} } from './types'\nimport { ${registryDefaultImports} } from './types'\nimport { ${registryUIImports} } from './ui-schemas'\n\n` + registryOutput
  
  // Write files
  fs.writeFileSync(path.join(OUTPUT_DIR, 'types.ts'), typesOutput)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ui-schemas.ts'), uiSchemasOutput)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'registry.ts'), registryOutput)
  
  // Create index file
  const indexOutput = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Main export for generated schemas
 */

export * from './types'
export * from './ui-schemas'
export * from './registry'
`
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexOutput)
  
  console.log(`\n✅ Generated ${schemas.length} schema(s) to src/_generated/\n`)
  console.log('Files created:')
  console.log('  - types.ts')
  console.log('  - ui-schemas.ts')
  console.log('  - registry.ts')
  console.log('  - index.ts')
}

// Run generator
generate().catch(console.error)
