import type { SchemaProperty } from '../../schemas/base.schema'
import { VISUALIZER_REGISTRY } from '../_generated'
import { getAllVisualizerTypes, createDisplayNameMap, type VisualisationType } from '../engines/webgl/registry'

const VISUALIZER_TYPES = getAllVisualizerTypes()

/**
 * Converts a string value to the appropriate type based on schema property
 */
const convertValueBySchema = (value: string, property: SchemaProperty): any => {
  switch (property.type) {
    case 'boolean':
      return value === 'true' || value === '1' || value === 'yes'
    
    case 'integer': {
      const parsed = parseInt(value, 10)
      if (isNaN(parsed)) return undefined
      if ('minimum' in property && parsed < property.minimum!) return property.minimum
      if ('maximum' in property && parsed > property.maximum!) return property.maximum
      return parsed
    }
    
    case 'number': {
      const parsed = parseFloat(value)
      if (isNaN(parsed)) return undefined
      if ('minimum' in property && parsed < property.minimum!) return property.minimum
      if ('maximum' in property && parsed > property.maximum!) return property.maximum
      return parsed
    }
    
    case 'string':
      if ('enum' in property && property.enum && !property.enum.includes(value)) {
        return property.default
      }
      return value
    
    case 'array':
      try {
        return JSON.parse(value)
      } catch {
        return value.split(',').map(v => v.trim())
      }
    
    case 'object':
      try {
        return JSON.parse(value)
      } catch {
        return undefined
      }
    
    default:
      return value
  }
}

/**
 * Parses URL query parameters and returns initial config overrides.
 * This is called synchronously during store creation to avoid race conditions.
 */
export function parseQueryParams(): {
  visualType?: VisualisationType
  butterchurnConfig?: Record<string, any>
  autoChange?: boolean
  fxEnabled?: boolean
  showFxPanel?: boolean
  storageName?: string
  [key: string]: any
} {
  // Extract query string - works for both standalone mode and HashRouter embedded mode
  const hash = window.location.hash
  const hashQueryStart = hash.indexOf('?')
  const hashQueryString = hashQueryStart >= 0 ? hash.substring(hashQueryStart) : ''
  const searchQueryString = window.location.search
  
  // Prefer search string (standalone), fallback to hash (embedded)
  const queryString = searchQueryString || hashQueryString
  const params = new URLSearchParams(queryString)
  
  const result: any = {}
  
  // Parse global UI state parameters
  const storageNameParam = params.get('storageName')
  if (storageNameParam) {
    result.storageName = storageNameParam
  }
  const autoChangeParam = params.get('autoChange')
  if (autoChangeParam !== null) {
    result.autoChange = autoChangeParam === 'true' || autoChangeParam === '1' || autoChangeParam === 'yes'
  }
  
  const fxEnabledParam = params.get('fxEnabled')
  if (fxEnabledParam !== null) {
    result.fxEnabled = fxEnabledParam === 'true' || fxEnabledParam === '1' || fxEnabledParam === 'yes'
  }
  
  const showFxPanelParam = params.get('showFxPanel')
  if (showFxPanelParam !== null) {
    result.showFxPanel = showFxPanelParam === 'true' || showFxPanelParam === '1' || showFxPanelParam === 'yes'
  }
  
  const visualParam = params.get('visual')
  
  if (!visualParam) return result
  
  const displayNameMap = createDisplayNameMap()
  const normalizedParam = visualParam.toLowerCase().trim()
  
  // Try display name first, then technical name
  const targetVisualType = displayNameMap[normalizedParam] || 
                    (VISUALIZER_TYPES.includes(normalizedParam as VisualisationType) 
                      ? normalizedParam as VisualisationType 
                      : null)
  
  if (!targetVisualType) return result
  
  // Get schema for this visualizer
  const registryEntry = VISUALIZER_REGISTRY[targetVisualType]
  if (!registryEntry) return result

  const schema = registryEntry.getUISchema()
  const properties = schema.properties || {}
  
  // Build config object from URL params matching schema properties
  const configUpdate: Record<string, any> = {}
  
  params.forEach((value, key) => {
    if (['visual', 'autoChange', 'fxEnabled', 'showFxPanel'].includes(key)) return
    
    // Legacy support
    const propertyKey = key === 'preset' ? 'currentPresetName' : key
    const finalKey = propertyKey === 'presetIndex' ? 'currentPresetIndex' : propertyKey
    
    const property = properties[finalKey]
    if (!property) return
    
    const convertedValue = convertValueBySchema(value, property)
    
    if (convertedValue !== undefined) {
      configUpdate[finalKey] = convertedValue
    }
  })
  
  result.visualType = targetVisualType
  
  // Apply config if we have any updates
  if (Object.keys(configUpdate).length > 0) {
    if (targetVisualType === 'butterchurn') {
      // Butterchurn uses special initialPreset* keys for URL loading
      const butterchurnUpdate: Record<string, any> = {}
      if ('currentPresetName' in configUpdate) {
        butterchurnUpdate.initialPresetName = configUpdate.currentPresetName
        delete configUpdate.currentPresetName
      }
      if ('currentPresetIndex' in configUpdate) {
        butterchurnUpdate.initialPresetIndex = configUpdate.currentPresetIndex
        delete configUpdate.currentPresetIndex
      }
      
      result.butterchurnConfig = { ...butterchurnUpdate, ...configUpdate }
    } else {
      result[`${targetVisualType}Config`] = configUpdate
    }
  }
  
  return result
}
