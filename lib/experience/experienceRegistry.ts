/**
 * Xpedition Experience Engine v1 — Unified Experience Registry
 *
 * Central directory for registering and resolving canonical ExperienceDefinitions.
 * Avoids large switch statements by utilizing a deterministic registry map.
 */

import { ExperienceDefinition } from './experienceDefinition';
import {
  PROJECTILE_SIMULATION_DEFINITION,
  OBJECT_MANIPULATION_DEFINITION,
  MOLECULE_BUILDER_DEFINITION,
  HEART_ANATOMY_DEFINITION,
  CODE_DEBUGGING_DEFINITION,
} from './catalog/index';

export class ExperienceRegistry {
  private static instance: ExperienceRegistry;
  private registry = new Map<string, ExperienceDefinition<any, any, any>>();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): ExperienceRegistry {
    if (!ExperienceRegistry.instance) {
      ExperienceRegistry.instance = new ExperienceRegistry();
    }
    return ExperienceRegistry.instance;
  }

  /**
   * Reset instance (useful for clean test isolation).
   */
  public static resetInstance(): void {
    ExperienceRegistry.instance = new ExperienceRegistry();
  }

  private registerDefaults(): void {
    this.register('PROJECTILE_SIMULATION', PROJECTILE_SIMULATION_DEFINITION);
    this.register('projectile_motion', PROJECTILE_SIMULATION_DEFINITION);
    this.register('OBJECT_MANIPULATION', OBJECT_MANIPULATION_DEFINITION);
    this.register('spatial_reasoning', OBJECT_MANIPULATION_DEFINITION);
    this.register('MOLECULE_BUILDER', MOLECULE_BUILDER_DEFINITION);
    this.register('molecular_bonding', MOLECULE_BUILDER_DEFINITION);
    this.register('HEART_ANATOMY_EXPLORER', HEART_ANATOMY_DEFINITION);
    this.register('human_heart_anatomy', HEART_ANATOMY_DEFINITION);
    this.register('CODE_DEBUGGING', CODE_DEBUGGING_DEFINITION);
    this.register('python_debugging_basics', CODE_DEBUGGING_DEFINITION);
    this.register('programming_code_lab', CODE_DEBUGGING_DEFINITION);
  }

  /**
   * Register a new or custom experience definition.
   */
  public register(typeOrConcept: string, definition: ExperienceDefinition<any, any, any>): void {
    this.registry.set(typeOrConcept, definition);
    if (definition.type && !this.registry.has(definition.type)) {
      this.registry.set(definition.type, definition);
    }
    if (definition.conceptId && !this.registry.has(definition.conceptId)) {
      this.registry.set(definition.conceptId, definition);
    }
    if (definition.id && !this.registry.has(definition.id)) {
      this.registry.set(definition.id, definition);
    }
  }

  /**
   * Check if an experience is registered for the given type, conceptId, or experienceId.
   */
  public hasExperience(typeOrConcept: string): boolean {
    return this.registry.has(typeOrConcept);
  }

  /**
   * Retrieve an experience definition by type, conceptId, or experienceId.
   */
  public getExperienceDefinition<
    TConfig = Record<string, any>,
    TState = Record<string, any>,
    TEvidence = Record<string, any>
  >(typeOrConcept: string): ExperienceDefinition<TConfig, TState, TEvidence> | undefined {
    return this.registry.get(typeOrConcept) as ExperienceDefinition<TConfig, TState, TEvidence> | undefined;
  }

  /**
   * List all unique experience definitions.
   */
  public listExperienceDefinitions(): ExperienceDefinition[] {
    const unique = new Set<ExperienceDefinition>();
    for (const def of this.registry.values()) {
      unique.add(def);
    }
    return Array.from(unique);
  }
}

// Canonical singleton export
export const experienceRegistry = ExperienceRegistry.getInstance();

// Convenience global getters
export function getExperienceDefinition(typeOrConcept: string): ExperienceDefinition | undefined {
  return experienceRegistry.getExperienceDefinition(typeOrConcept);
}

export function hasExperience(typeOrConcept: string): boolean {
  return experienceRegistry.hasExperience(typeOrConcept);
}

export function listExperienceDefinitions(): ExperienceDefinition[] {
  return experienceRegistry.listExperienceDefinitions();
}
