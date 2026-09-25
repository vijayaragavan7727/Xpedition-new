/**
 * Xpedition Production Hardening — Asset Storage Backend Abstraction
 *
 * Provides a resilient, pluggable object storage contract. Decouples local filesystem
 * storage from production cloud bucket storage (Supabase Storage / S3 / R2), ensuring
 * seamless deployment without breaking local development.
 */

import fs from 'fs';
import path from 'path';
import { getProductionConfig } from '../config/productionConfig';
import { supabase, isSupabaseConfigured } from '../supabase';

export interface StorageUploadResult {
  publicUrl: string;
  storagePath: string;
  sizeBytes: number;
}

export interface IAssetStorageBackend {
  upload(filename: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult>;
  exists(storagePath: string): Promise<boolean>;
  getBuffer(storagePath: string): Promise<Buffer | null>;
  delete(storagePath: string): Promise<boolean>;
  getPublicUrl(storagePath: string): string;
  getProviderName(): string;
}

/**
 * Local Filesystem Storage Backend (Used for local dev and offline tests)
 */
export class LocalStorageBackend implements IAssetStorageBackend {
  private readonly storageDir: string;
  private readonly publicPrefix: string;

  constructor(customDir?: string, publicPrefix = '/generated-visuals') {
    this.storageDir = customDir || path.join(process.cwd(), 'public', 'generated-visuals');
    this.publicPrefix = publicPrefix;
    this.ensureDirExists();
  }

  private ensureDirExists(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (err: any) {
      console.warn('[LocalStorageBackend] Warning: could not create storage directory:', err?.message);
    }
  }

  public async upload(filename: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    this.ensureDirExists();
    const filePath = path.join(this.storageDir, filename);

    fs.writeFileSync(filePath, buffer);

    return {
      publicUrl: `${this.publicPrefix}/${filename}`,
      storagePath: filePath,
      sizeBytes: buffer.length,
    };
  }

  public async exists(storagePath: string): Promise<boolean> {
    try {
      return fs.existsSync(storagePath);
    } catch {
      return false;
    }
  }

  public async getBuffer(storagePath: string): Promise<Buffer | null> {
    try {
      if (fs.existsSync(storagePath)) {
        return fs.readFileSync(storagePath);
      }
      return null;
    } catch {
      return null;
    }
  }

  public async delete(storagePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public getPublicUrl(storagePath: string): string {
    const filename = path.basename(storagePath);
    return `${this.publicPrefix}/${filename}`;
  }

  public getProviderName(): string {
    return 'local';
  }
}

/**
 * Supabase Cloud Storage Backend with automatic local fallback
 */
export class SupabaseStorageBackend implements IAssetStorageBackend {
  private readonly localFallback: LocalStorageBackend;
  private readonly bucketName: string;

  constructor(bucketName = 'educational-assets') {
    this.bucketName = bucketName;
    this.localFallback = new LocalStorageBackend();
  }

  private isLive(): boolean {
    return isSupabaseConfigured && Boolean(supabase);
  }

  public async upload(filename: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    // If Supabase is unconfigured, fall back directly to local filesystem
    if (!this.isLive()) {
      return this.localFallback.upload(filename, buffer, mimeType);
    }

    try {
      const { data, error } = await supabase!.storage
        .from(this.bucketName)
        .upload(filename, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error || !data) {
        console.warn('[SupabaseStorageBackend] Upload error, falling back to local:', error?.message);
        return this.localFallback.upload(filename, buffer, mimeType);
      }

      const { data: publicUrlData } = supabase!.storage
        .from(this.bucketName)
        .getPublicUrl(filename);

      return {
        publicUrl: publicUrlData.publicUrl,
        storagePath: `${this.bucketName}/${filename}`,
        sizeBytes: buffer.length,
      };
    } catch (err: any) {
      console.warn('[SupabaseStorageBackend] Unexpected upload exception, using fallback:', err?.message);
      return this.localFallback.upload(filename, buffer, mimeType);
    }
  }

  public async exists(storagePath: string): Promise<boolean> {
    if (!this.isLive()) {
      return this.localFallback.exists(storagePath);
    }

    try {
      const filename = path.basename(storagePath);
      const { data, error } = await supabase!.storage
        .from(this.bucketName)
        .list('', { search: filename });

      if (error || !data) {
        return this.localFallback.exists(storagePath);
      }
      return data.some((file) => file.name === filename);
    } catch {
      return this.localFallback.exists(storagePath);
    }
  }

  public async getBuffer(storagePath: string): Promise<Buffer | null> {
    if (!this.isLive()) {
      return this.localFallback.getBuffer(storagePath);
    }

    try {
      const filename = path.basename(storagePath);
      const { data, error } = await supabase!.storage
        .from(this.bucketName)
        .download(filename);

      if (error || !data) {
        return this.localFallback.getBuffer(storagePath);
      }

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return this.localFallback.getBuffer(storagePath);
    }
  }

  public async delete(storagePath: string): Promise<boolean> {
    if (!this.isLive()) {
      return this.localFallback.delete(storagePath);
    }

    try {
      const filename = path.basename(storagePath);
      const { error } = await supabase!.storage
        .from(this.bucketName)
        .remove([filename]);

      return !error;
    } catch {
      return this.localFallback.delete(storagePath);
    }
  }

  public getPublicUrl(storagePath: string): string {
    if (!this.isLive()) {
      return this.localFallback.getPublicUrl(storagePath);
    }
    const filename = path.basename(storagePath);
    const { data } = supabase!.storage.from(this.bucketName).getPublicUrl(filename);
    return data.publicUrl;
  }

  public getProviderName(): string {
    return 'supabase';
  }
}

let defaultStorageBackend: IAssetStorageBackend | null = null;

export function getStorageBackend(): IAssetStorageBackend {
  if (!defaultStorageBackend) {
    const config = getProductionConfig();
    if (config.storage.provider === 'supabase' && config.supabase.isConfigured) {
      defaultStorageBackend = new SupabaseStorageBackend(config.storage.bucketName);
    } else {
      defaultStorageBackend = new LocalStorageBackend();
    }
  }
  return defaultStorageBackend;
}

export function resetStorageBackend(): void {
  defaultStorageBackend = null;
}
