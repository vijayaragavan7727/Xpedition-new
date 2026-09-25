import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EducationalAsset, VisualType } from './types';
import { InvalidAssetError, AssetNotFoundError } from './errors';
import { getStorageBackend, IAssetStorageBackend, LocalStorageBackend } from '../storage/storageBackend';

export interface SaveAssetParams {
  conceptId: string;
  visualType: VisualType;
  workflowId: string;
  workflowVersion: string;
  modelFamily: string;
  model: string;
  modelLicense: string;
  prompt: string;
  negativePrompt?: string;
  promptHash: string;
  cacheKey: string;
  width: number;
  height: number;
  seed: number;
  imageBuffer: Buffer;
  mimeType?: string;
}

export interface IAssetStore {
  saveAsset(params: SaveAssetParams): Promise<EducationalAsset>;
  getAsset(assetId: string): Promise<EducationalAsset | null>;
  findByCacheKey(cacheKey: string): Promise<EducationalAsset | null>;
  resolveExistingAsset(query: {
    conceptId: string;
    visualType?: VisualType;
    promptHash?: string;
  }): Promise<EducationalAsset | null>;
  listAssets(conceptId?: string): Promise<EducationalAsset[]>;
}

export class LocalAssetStore implements IAssetStore {
  private static instance: LocalAssetStore;
  private readonly storageDir: string;
  private readonly manifestPath: string;
  private readonly storageBackend: IAssetStorageBackend;
  private readonly assetIndex: Map<string, EducationalAsset> = new Map();
  private readonly cacheKeyIndex: Map<string, string> = new Map(); // cacheKey -> assetId

  constructor(customStorageDir?: string, customBackend?: IAssetStorageBackend) {
    this.storageDir =
      customStorageDir ||
      path.join(process.cwd(), 'public', 'generated-visuals');

    this.storageBackend = customBackend || (customStorageDir ? new LocalStorageBackend(customStorageDir) : getStorageBackend());
    this.manifestPath = path.join(this.storageDir, 'assets-manifest.json');

    this.ensureStorageExists();
    this.loadManifest();
  }

  public static getInstance(): LocalAssetStore {
    if (!LocalAssetStore.instance) {
      LocalAssetStore.instance = new LocalAssetStore();
    }
    return LocalAssetStore.instance;
  }

  private ensureStorageExists(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (err: any) {
      console.warn(`[AssetStore] Warning: Could not create directory ${this.storageDir}:`, err?.message);
    }
  }

  /**
   * Loads existing assets metadata manifest on cold boot
   */
  private loadManifest(): void {
    try {
      if (fs.existsSync(this.manifestPath)) {
        const raw = fs.readFileSync(this.manifestPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed as EducationalAsset[]) {
            const filename = item.publicUrl
              ? path.basename(item.publicUrl)
              : item.filePath
              ? path.basename(item.filePath)
              : '';
            if (filename) {
              item.filePath = path.join(this.storageDir, filename);
            }
            this.assetIndex.set(item.assetId, item);
            if (item.cacheKey) {
              this.cacheKeyIndex.set(item.cacheKey, item.assetId);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[AssetStore] Warning: Failed to parse existing manifest:', err?.message);
    }
  }

  /**
   * Persists the in-memory asset manifest to disk
   */
  private persistManifest(): void {
    try {
      const list = Array.from(this.assetIndex.values()).map((asset) => ({
        ...asset,
        filePath: asset.filePath ? `public/generated-visuals/${path.basename(asset.filePath)}` : undefined,
      }));
      fs.writeFileSync(this.manifestPath, JSON.stringify(list, null, 2), 'utf8');
    } catch (err: any) {
      console.warn('[AssetStore] Warning: Failed to persist manifest:', err?.message);
    }
  }

  /**
   * Validates raw image buffer headers and size constraints
   */
  public validateImageBuffer(buffer: Buffer): { mimeType: string } {
    if (!buffer || buffer.length === 0) {
      throw new InvalidAssetError('Image buffer is empty');
    }

    if (buffer.length > 25 * 1024 * 1024) {
      throw new InvalidAssetError(`Image buffer exceeds 25MB maximum limit (${buffer.length} bytes)`);
    }

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    // JPEG signature: FF D8 FF
    const isJpeg =
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;

    if (isPng) {
      return { mimeType: 'image/png' };
    }
    if (isJpeg) {
      return { mimeType: 'image/jpeg' };
    }

    throw new InvalidAssetError('Unsupported image format: Buffer signature does not match PNG or JPEG');
  }

  /**
   * Generates a stable asset ID
   */
  private generateStableAssetId(conceptId: string, cacheKey: string): string {
    const keyHash = crypto.createHash('sha256').update(cacheKey).digest('hex').substring(0, 10);
    const cleanConcept = conceptId.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 16);
    return `ast_${cleanConcept}_${keyHash}`;
  }

  /**
   * Persists a generated asset with metadata indexing
   */
  public async saveAsset(params: SaveAssetParams): Promise<EducationalAsset> {
    const { mimeType } = this.validateImageBuffer(params.imageBuffer);

    // If an asset already exists for this exact cache key, return it without duplicate disk writes
    const existingId = this.cacheKeyIndex.get(params.cacheKey);
    if (existingId) {
      const existing = this.assetIndex.get(existingId);
      if (existing && existing.status === 'ready' && existing.filePath && fs.existsSync(existing.filePath)) {
        return existing;
      }
    }

    const assetId = this.generateStableAssetId(params.conceptId, params.cacheKey);
    const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const filename = `xpedition_${assetId}.${ext}`;
    
    // Upload via storage backend (supports local disk or cloud bucket)
    const uploadResult = await this.storageBackend.upload(filename, params.imageBuffer, mimeType);

    const asset: EducationalAsset = {
      assetId,
      conceptId: params.conceptId,
      visualType: params.visualType,
      workflowId: params.workflowId,
      workflowVersion: params.workflowVersion,
      modelFamily: params.modelFamily,
      promptHash: params.promptHash,
      cacheKey: params.cacheKey,
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      width: params.width,
      height: params.height,
      seed: params.seed,
      source: 'comfyui',
      generatedAt: Date.now(),
      publicUrl: uploadResult.publicUrl,
      mimeType,
      sizeBytes: params.imageBuffer.length,
      provenance: {
        model: params.model,
        modelLicense: params.modelLicense,
        modelFamily: params.modelFamily,
        vramMode: 'cpu',
        source: 'comfyui',
      },
      status: 'ready',
      filePath: uploadResult.storagePath, // Server-side internal path only
    };

    this.assetIndex.set(assetId, asset);
    this.cacheKeyIndex.set(params.cacheKey, assetId);
    this.persistManifest();

    return asset;
  }

  public async getAsset(assetId: string): Promise<EducationalAsset | null> {
    const asset = this.assetIndex.get(assetId);
    if (!asset) return null;
    return asset;
  }

  public async findByCacheKey(cacheKey: string): Promise<EducationalAsset | null> {
    const assetId = this.cacheKeyIndex.get(cacheKey);
    if (!assetId) return null;
    const asset = this.assetIndex.get(assetId);
    if (!asset) return null;

    // Verify physical file still exists
    if (asset.filePath) {
      const exists = await this.storageBackend.exists(asset.filePath);
      if (!exists) {
        return null;
      }
    }

    return asset;
  }

  /**
   * Resolves existing asset by concept and optional prompt hash without generating
   */
  public async resolveExistingAsset(query: {
    conceptId: string;
    visualType?: VisualType;
    promptHash?: string;
  }): Promise<EducationalAsset | null> {
    const normalizedConcept = query.conceptId.trim().toLowerCase();

    for (const asset of this.assetIndex.values()) {
      if (asset.conceptId.toLowerCase() === normalizedConcept && asset.status === 'ready') {
        if (query.visualType && asset.visualType !== query.visualType) {
          continue;
        }
        if (query.promptHash && asset.promptHash !== query.promptHash) {
          continue;
        }
        // Verify storage file
        if (asset.filePath && (await this.storageBackend.exists(asset.filePath))) {
          return asset;
        }
      }
    }

    return null;
  }

  public async listAssets(conceptId?: string): Promise<EducationalAsset[]> {
    const all = Array.from(this.assetIndex.values());
    if (!conceptId) return all;
    return all.filter((a) => a.conceptId.toLowerCase() === conceptId.toLowerCase());
  }

  /**
   * Sanitizes an asset for public browser consumption (strips server disk path)
   */
  public static sanitizeForClient(asset: EducationalAsset): Omit<EducationalAsset, 'filePath'> {
    const { filePath, ...publicSafe } = asset;
    return publicSafe;
  }
}

export const assetStore = LocalAssetStore.getInstance();
