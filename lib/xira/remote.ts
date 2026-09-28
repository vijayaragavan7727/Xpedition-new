const DEFAULT_TIMEOUT_MS = 120000;

function getBackendUrl(): string | null {
  const raw = process.env.XIRA_BACKEND_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

async function postJson(path: string, body: unknown): Promise<any | null> {
  const baseUrl = getBackendUrl();
  if (!baseUrl) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(baseUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn(
      '[Xira Remote] request failed:',
      error instanceof Error ? error.message : error,
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callXiraChat(input: {
  message: string;
  context?: Record<string, unknown>;
}): Promise<string | null> {
  const data = await postJson('/chat', input);
  const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
  return reply || null;
}

export async function callXiraLesson(input: {
  conceptId: string;
  conceptName: string;
  conceptSummary: string;
  language: string;
  startingLevel: string;
  masteryPercentage: number;
  isQuickLearn: boolean;
}): Promise<Record<string, unknown> | null> {
  const data = await postJson('/generate-lesson', input);

  if (!data || data.error || !Array.isArray(data.chunks) || !data.checkpoint) {
    return null;
  }

  if (data.chunks.length < 2) return null;

  return {
    chunks: data.chunks,
    checkpoint: data.checkpoint,
    cached: Boolean(data.cached),
  };
}
