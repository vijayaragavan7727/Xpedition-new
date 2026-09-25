/**
 * Visual Asset Resolver (Step 9, 15)
 *
 * Integrates with Phase 2 AssetStore infrastructure to resolve
 * existing, verified educational visuals before requesting new generation.
 *
 * CRITICAL SEPARATION OF CONCERNS:
 * The resolver answers: "Do we already have a suitable asset?"
 * It NEVER initiates diffusion generation itself; that responsibility belongs to PromptPlanner + VisualGenerationEngine.
 */

import { IAssetStore } from '../visualGeneration/AssetStore';
import { EducationalAsset } from '../visualGeneration/types';
import { RepresentationType } from './types';

export interface IVisualAssetResolver {
  resolveExistingAsset(
    conceptId: string,
    visualType?: RepresentationType
  ): Promise<EducationalAsset | null>;
  findCandidates(conceptId: string): Promise<EducationalAsset[]>;
}

export class VisualAssetResolver implements IVisualAssetResolver {
  constructor(private readonly assetStore: IAssetStore) {}

  /**
   * Resolves the best available existing asset for a given concept and optional visual type.
   */
  public async resolveExistingAsset(
    conceptId: string,
    visualType?: RepresentationType
  ): Promise<EducationalAsset | null> {
    if (!conceptId) return null;

    // 1. Query asset store by concept and visualType
    const match = await this.assetStore.resolveExistingAsset({
      conceptId,
      visualType: visualType as any,
    });
    if (match && match.status === 'ready') {
      return match;
    }

    // 2. Fallback to any ready asset for the concept if exact visualType not matched
    const candidates = await this.findCandidates(conceptId);
    if (candidates.length > 0) {
      return candidates[0];
    }

    return null;
  }

  /**
   * Returns all active asset candidates associated with the concept.
   */
  public async findCandidates(conceptId: string): Promise<EducationalAsset[]> {
    if (!conceptId) return [];

    const allAssets = await this.assetStore.listAssets(conceptId);
    return allAssets.filter((asset) => asset.status === 'ready');
  }
}
