/**
 * Reads a JSON request body while enforcing a hard byte limit on the actual
 * stream (not just the Content-Length header, which can be absent or wrong).
 */

export type BodyReadResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

export async function readJsonBodyWithLimit(request: Request, maxBytes: number): Promise<BodyReadResult> {
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > maxBytes) return { ok: false, status: 413, error: 'Payload too large' };
  if (!request.body) return { ok: false, status: 400, error: 'Missing request body' };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
      return { ok: false, status: 413, error: 'Payload too large' };
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buffer.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(buffer)) };
  } catch {
    return { ok: false, status: 400, error: 'Malformed JSON payload' };
  }
}
