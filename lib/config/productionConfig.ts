/**
 * Xpedition Production Hardening — Centralized Configuration Loader
 *
 * Provides type-safe access to production configuration, validation of environment
 * variables, and reliable defaults for local development and cloud deployment.
 */

export interface ProductionConfig {
  env: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;

  // Supabase Database & Auth
  supabase: {
    url: string | null;
    anonKey: string | null;
    serviceRoleKey: string | null;
    isConfigured: boolean;
  };

  // ComfyUI & Visual Generation
  comfyUI: {
    baseUrl: string;
    timeoutMs: number;
    circuitBreaker: {
      failureThreshold: number;
      resetTimeoutMs: number;
    };
  };

  // Cache & Session Store
  cache: {
    provider: 'memory' | 'redis';
    redisUrl: string | null;
    defaultTtlSeconds: number;
  };

  // Object & Asset Storage
  storage: {
    provider: 'local' | 'supabase' | 's3';
    bucketName: string;
    localDir: string;
    maxUploadSizeBytes: number;
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    visualGenerationMaxPerMin: number;
    classroomSessionMaxPerMin: number;
    defaultMaxPerMin: number;
  };

  // Observability & Telemetry
  observability: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    traceBufferLimit: number;
    telemetryRedactPII: boolean;
  };
}

let cachedConfig: ProductionConfig | null = null;

export function getProductionConfig(): ProductionConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';
  const isTest = env === 'test';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

  const comfyUIBaseUrl = process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188';
  const comfyUITimeoutMs = parseInt(process.env.COMFYUI_TIMEOUT_MS || '300000', 10);

  const cacheProvider = (process.env.CACHE_PROVIDER as 'memory' | 'redis') || (process.env.REDIS_URL ? 'redis' : 'memory');
  const redisUrl = process.env.REDIS_URL || null;

  const storageProvider = (process.env.STORAGE_PROVIDER as 'local' | 'supabase' | 's3') || 'local';
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'educational-assets';
  const localDir = process.env.LOCAL_ASSET_DIR || 'public/generated-visuals';

  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';
  const visualGenerationMaxPerMin = parseInt(process.env.RATE_LIMIT_VISUAL_GEN || '10', 10);
  const classroomSessionMaxPerMin = parseInt(process.env.RATE_LIMIT_CLASSROOM || '60', 10);
  const defaultMaxPerMin = parseInt(process.env.RATE_LIMIT_DEFAULT || '120', 10);

  const logLevel = (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || (isProduction ? 'info' : 'debug');
  const traceBufferLimit = parseInt(process.env.TRACE_BUFFER_LIMIT || '200', 10);

  cachedConfig = {
    env,
    isProduction,
    isDevelopment,
    isTest,
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
      isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    },
    comfyUI: {
      baseUrl: comfyUIBaseUrl,
      timeoutMs: isNaN(comfyUITimeoutMs) ? 300000 : comfyUITimeoutMs,
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeoutMs: 30000,
      },
    },
    cache: {
      provider: cacheProvider,
      redisUrl,
      defaultTtlSeconds: 3600, // 1 hour
    },
    storage: {
      provider: storageProvider,
      bucketName,
      localDir,
      maxUploadSizeBytes: 25 * 1024 * 1024, // 25MB
    },
    rateLimit: {
      enabled: rateLimitEnabled,
      visualGenerationMaxPerMin: isNaN(visualGenerationMaxPerMin) ? 10 : visualGenerationMaxPerMin,
      classroomSessionMaxPerMin: isNaN(classroomSessionMaxPerMin) ? 60 : classroomSessionMaxPerMin,
      defaultMaxPerMin: isNaN(defaultMaxPerMin) ? 120 : defaultMaxPerMin,
    },
    observability: {
      logLevel,
      traceBufferLimit: isNaN(traceBufferLimit) ? 200 : traceBufferLimit,
      telemetryRedactPII: true,
    },
  };

  return cachedConfig;
}

/**
 * Resets cached config for testing purposes
 */
export function resetProductionConfig(): void {
  cachedConfig = null;
}
