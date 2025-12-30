/**
 * PresetSystem - Save/load visualization configurations
 *
 * Stores presets in localStorage with support for:
 * - Visualization type
 * - Effect configuration
 * - Post-processing settings
 * - Audio reactor mappings
 */

import type { PostProcessingConfig } from "./usePostProcessing";
import type { ReactorConfig } from "./audioanalyzer/AudioReactor";
import type { WebGLVisualisationType } from "./WebGLVisualiser";

// Extended type that includes special visualizers
export type ExtendedVisualisationType =
  | WebGLVisualisationType
  | "butterchurn"
  | "astrofox";

/**
 * Preset data structure
 */
export interface VisualiserPreset {
  // Metadata
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // Base64 encoded

  // Visualization settings
  visualType: ExtendedVisualisationType;
  effectConfig: Record<string, unknown>;

  // Post-processing
  postProcessing: PostProcessingConfig;

  // Audio reactors
  reactors: Record<string, ReactorConfig>;

  // Audio settings
  audioConfig: {
    sensitivity: number;
    smoothing: number;
    source: "backend" | "mic";
  };

  // Tags for organization
  tags?: string[];
}

/**
 * Preset category for organization
 */
export interface PresetCategory {
  id: string;
  name: string;
  icon?: string;
  presets: string[]; // Preset IDs
}

const STORAGE_KEY = "ledfx_visualiser_presets";
const CATEGORIES_KEY = "ledfx_visualiser_categories";

/**
 * Generate unique ID
 */
function generateId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * PresetManager - Handles preset storage and retrieval
 */
export class PresetManager {
  private presets: Map<string, VisualiserPreset> = new Map();
  private categories: Map<string, PresetCategory> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  /**
   * Load presets from localStorage
   */
  private load(): void {
    try {
      // Load presets
      const presetsJson = localStorage.getItem(STORAGE_KEY);
      if (presetsJson) {
        const presets = JSON.parse(presetsJson) as VisualiserPreset[];
        presets.forEach((preset) => {
          this.presets.set(preset.id, preset);
        });
      }

      // Load categories
      const categoriesJson = localStorage.getItem(CATEGORIES_KEY);
      if (categoriesJson) {
        const categories = JSON.parse(categoriesJson) as PresetCategory[];
        categories.forEach((cat) => {
          this.categories.set(cat.id, cat);
        });
      }

      // Create default category if none exist
      if (this.categories.size === 0) {
        this.categories.set("default", {
          id: "default",
          name: "My Presets",
          presets: [],
        });
        this.categories.set("favorites", {
          id: "favorites",
          name: "Favorites",
          icon: "star",
          presets: [],
        });
        this.saveCategories();
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    }
  }

  /**
   * Save presets to localStorage
   */
  private savePresets(): void {
    try {
      const presets = Array.from(this.presets.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to save presets:", error);
    }
  }

  /**
   * Save categories to localStorage
   */
  private saveCategories(): void {
    try {
      const categories = Array.from(this.categories.values());
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error("Failed to save categories:", error);
    }
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Subscribe to preset changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Create a new preset
   */
  create(
    name: string,
    config: Omit<VisualiserPreset, "id" | "name" | "createdAt" | "updatedAt">,
    categoryId = "default"
  ): VisualiserPreset {
    const now = Date.now();
    const preset: VisualiserPreset = {
      ...config,
      id: generateId(),
      name,
      createdAt: now,
      updatedAt: now,
    };

    this.presets.set(preset.id, preset);

    // Add to category
    const category = this.categories.get(categoryId);
    if (category) {
      category.presets.push(preset.id);
      this.saveCategories();
    }

    this.savePresets();
    return preset;
  }

  /**
   * Update an existing preset
   */
  update(
    id: string,
    updates: Partial<VisualiserPreset>
  ): VisualiserPreset | null {
    const preset = this.presets.get(id);
    if (!preset) return null;

    const updated: VisualiserPreset = {
      ...preset,
      ...updates,
      id: preset.id, // Prevent ID change
      updatedAt: Date.now(),
    };

    this.presets.set(id, updated);
    this.savePresets();
    return updated;
  }

  /**
   * Delete a preset
   */
  delete(id: string): boolean {
    const deleted = this.presets.delete(id);
    if (deleted) {
      // Remove from all categories
      this.categories.forEach((category) => {
        category.presets = category.presets.filter((pid) => pid !== id);
      });
      this.saveCategories();
      this.savePresets();
    }
    return deleted;
  }

  /**
   * Get a preset by ID
   */
  get(id: string): VisualiserPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * Get all presets
   */
  getAll(): VisualiserPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get presets by category
   */
  getByCategory(categoryId: string): VisualiserPreset[] {
    const category = this.categories.get(categoryId);
    if (!category) return [];

    return category.presets
      .map((id) => this.presets.get(id))
      .filter((p): p is VisualiserPreset => p !== undefined);
  }

  /**
   * Get presets by tag
   */
  getByTag(tag: string): VisualiserPreset[] {
    return this.getAll().filter((p) => p.tags?.includes(tag));
  }

  /**
   * Search presets by name
   */
  search(query: string): VisualiserPreset[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get all categories
   */
  getCategories(): PresetCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Add preset to category
   */
  addToCategory(presetId: string, categoryId: string): void {
    const category = this.categories.get(categoryId);
    if (category && !category.presets.includes(presetId)) {
      category.presets.push(presetId);
      this.saveCategories();
      this.notifyListeners();
    }
  }

  /**
   * Remove preset from category
   */
  removeFromCategory(presetId: string, categoryId: string): void {
    const category = this.categories.get(categoryId);
    if (category) {
      category.presets = category.presets.filter((id) => id !== presetId);
      this.saveCategories();
      this.notifyListeners();
    }
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(presetId: string): boolean {
    const favorites = this.categories.get("favorites");
    if (!favorites) return false;

    if (favorites.presets.includes(presetId)) {
      this.removeFromCategory(presetId, "favorites");
      return false;
    } else {
      this.addToCategory(presetId, "favorites");
      return true;
    }
  }

  /**
   * Check if preset is favorite
   */
  isFavorite(presetId: string): boolean {
    const favorites = this.categories.get("favorites");
    return favorites?.presets.includes(presetId) ?? false;
  }

  /**
   * Export presets as JSON
   */
  export(): string {
    const data = {
      version: 1,
      presets: this.getAll(),
      categories: this.getCategories(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import presets from JSON
   */
  import(json: string, overwrite = false): number {
    try {
      const data = JSON.parse(json);
      let imported = 0;

      if (data.presets && Array.isArray(data.presets)) {
        data.presets.forEach((preset: VisualiserPreset) => {
          if (overwrite || !this.presets.has(preset.id)) {
            // Generate new ID for imported presets to avoid conflicts
            const newPreset = {
              ...preset,
              id: generateId(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            this.presets.set(newPreset.id, newPreset);

            // Add to default category
            const defaultCat = this.categories.get("default");
            if (defaultCat) {
              defaultCat.presets.push(newPreset.id);
            }

            imported++;
          }
        });
      }

      this.savePresets();
      this.saveCategories();
      return imported;
    } catch (error) {
      console.error("Failed to import presets:", error);
      return 0;
    }
  }

  /**
   * Get preset count
   */
  get count(): number {
    return this.presets.size;
  }
}

// Singleton instance
let presetManagerInstance: PresetManager | null = null;

/**
 * Get the preset manager instance
 */
export function getPresetManager(): PresetManager {
  if (!presetManagerInstance) {
    presetManagerInstance = new PresetManager();
  }
  return presetManagerInstance;
}

/**
 * Built-in preset templates
 */
export const BUILT_IN_PRESETS: Omit<
  VisualiserPreset,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Default",
    description: "Clean default visualization",
    visualType: "matrix",
    effectConfig: { sensitivity: 1.5 },
    postProcessing: {},
    reactors: {},
    audioConfig: {
      sensitivity: 1.5,
      smoothing: 0.5,
      source: "backend",
    },
    tags: ["default", "clean"],
  },
  {
    name: "High Energy",
    description: "Intense visuals with bloom and glitch",
    visualType: "flame",
    effectConfig: { sensitivity: 2.0 },
    postProcessing: {
      bloom: { enabled: true, threshold: 0.4, intensity: 0.8, radius: 6 },
      glitch: { enabled: true, amount: 0.3, speed: 2.0 },
    },
    reactors: {},
    audioConfig: {
      sensitivity: 2.0,
      smoothing: 0.3,
      source: "backend",
    },
    tags: ["energetic", "intense"],
  },
  {
    name: "Chill",
    description: "Smooth, relaxed visuals",
    visualType: "plasma2d",
    effectConfig: { sensitivity: 1.0 },
    postProcessing: {
      bloom: { enabled: true, threshold: 0.6, intensity: 0.4, radius: 8 },
    },
    reactors: {},
    audioConfig: {
      sensitivity: 1.0,
      smoothing: 0.7,
      source: "backend",
    },
    tags: ["chill", "relaxed", "smooth"],
  },
];

export default PresetManager;
