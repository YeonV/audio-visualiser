/**
 * Base Schema Types
 * 
 * Foundation types for all visualizer schemas
 */

export type SchemaPropertyType = 
  | 'string' 
  | 'number' 
  | 'integer' 
  | 'boolean' 
  | 'array' 
  | 'object'

export interface UIOptions {
  order?: number
  showIf?: Record<string, any>
  hidden?: boolean
  section?: string
  width?: 'full' | 'half' | 'third'
}

export interface BaseProperty {
  type: SchemaPropertyType
  title: string
  description?: string
  default: any
  step?: number
  ui?: UIOptions
}

export interface StringProperty extends BaseProperty {
  type: 'string'
  format?: 'color' | 'url' | 'email'
  isGradient?: boolean
  enum?: string[]
  minLength?: number
  maxLength?: number
  pattern?: string
}

export interface NumberProperty extends BaseProperty {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  multipleOf?: number
  step?: number
}

export interface BooleanProperty extends BaseProperty {
  type: 'boolean'
}

export interface ArrayProperty extends BaseProperty {
  type: 'array'
  items: SchemaProperty
  minItems?: number
  maxItems?: number
}

export interface ObjectProperty extends BaseProperty {
  type: 'object'
  properties: Record<string, SchemaProperty>
  required?: string[]
}

export type SchemaProperty = 
  | StringProperty 
  | NumberProperty 
  | BooleanProperty 
  | ArrayProperty 
  | ObjectProperty

export interface VisualizerSchema {
  $id: string
  displayName: string
  type: 'object'
  properties: Record<string, SchemaProperty>
  required?: string[]
  metadata?: {
    category?: string
    tags?: string[]
    author?: string
    version?: string
    description?: string
  }
}

/**
 * Helper to create a color property
 */
export const colorProp = (
  title: string,
  defaultValue: string,
  opts?: {
    description?: string
    isGradient?: boolean
    ui?: UIOptions
  }
): StringProperty => ({
  type: 'string',
  format: 'color',
  title,
  default: defaultValue,
  description: opts?.description,
  isGradient: opts?.isGradient,
  ui: opts?.ui
})

/**
 * Helper to create a number property
 */
export const numberProp = (
  title: string,
  defaultValue: number,
  opts?: {
    description?: string
    minimum?: number
    maximum?: number
    step?: number
    ui?: UIOptions
  }
): NumberProperty => ({
  type: 'number',
  title,
  default: defaultValue,
  description: opts?.description,
  minimum: opts?.minimum,
  maximum: opts?.maximum,
  step: opts?.step,
  ui: opts?.ui
})

/**
 * Helper to create an integer property
 */
export const integerProp = (
  title: string,
  defaultValue: number,
  opts?: {
    description?: string
    minimum?: number
    maximum?: number
    step?: number
    ui?: UIOptions
  }
): NumberProperty => ({
  type: 'integer',
  title,
  default: defaultValue,
  description: opts?.description,
  minimum: opts?.minimum,
  maximum: opts?.maximum,
  step: opts?.step,
  ui: opts?.ui
})

/**
 * Helper to create a boolean property
 */
export const booleanProp = (
  title: string,
  defaultValue: boolean,
  opts?: {
    description?: string
    ui?: UIOptions
  }
): BooleanProperty => ({
  type: 'boolean',
  title,
  default: defaultValue,
  description: opts?.description,
  ui: opts?.ui
})

/**
 * Helper to create a string property
 */
export const stringProp = (
  title: string,
  defaultValue: string,
  opts?: {
    description?: string
    enum?: string[]
    minLength?: number
    maxLength?: number
    pattern?: string
    ui?: UIOptions
  }
): StringProperty => ({
  type: 'string',
  title,
  default: defaultValue,
  description: opts?.description,
  enum: opts?.enum,
  minLength: opts?.minLength,
  maxLength: opts?.maxLength,
  pattern: opts?.pattern,
  ui: opts?.ui
})
