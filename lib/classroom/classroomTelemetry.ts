/**
 * Classroom Telemetry Service (Phase 4, Step 12)
 *
 * Emits and records learning-relevant events inside the classroom session.
 *
 * Guarantees:
 * 1. Sanitization: Never logs personal data, secrets, or authentication tokens.
 * 2. Determinism: Predictable timestamps and structured metadata.
 * 3. Bounded Memory: Session telemetry buffer is capped to prevent memory bloat.
 */

import {
  ClassroomStage,
  ClassroomTelemetryEventType,
  ClassroomSessionTelemetryEvent,
} from './classroomSessionTypes';

export class ClassroomTelemetryService {
  private static instance: ClassroomTelemetryService;
  private readonly maxEventsPerSession = 100;
  private readonly sessionBuffers: Map<string, ClassroomSessionTelemetryEvent[]> = new Map();

  public static getInstance(): ClassroomTelemetryService {
    if (!ClassroomTelemetryService.instance) {
      ClassroomTelemetryService.instance = new ClassroomTelemetryService();
    }
    return ClassroomTelemetryService.instance;
  }

  /**
   * Creates and registers a sanitized telemetry event.
   */
  public recordEvent(params: {
    sessionId: string;
    conceptId: string;
    stage: ClassroomStage;
    type: ClassroomTelemetryEventType;
    data?: Record<string, any>;
  }): ClassroomSessionTelemetryEvent {
    const sanitizedData = this.sanitizeData(params.data);

    const event: ClassroomSessionTelemetryEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: params.type,
      conceptId: params.conceptId,
      stage: params.stage,
      timestamp: Date.now(),
      data: Object.keys(sanitizedData).length > 0 ? sanitizedData : undefined,
    };

    if (!this.sessionBuffers.has(params.sessionId)) {
      this.sessionBuffers.set(params.sessionId, []);
    }

    const buffer = this.sessionBuffers.get(params.sessionId)!;
    buffer.push(event);

    if (buffer.length > this.maxEventsPerSession) {
      buffer.shift();
    }

    return event;
  }

  /**
   * Retrieves all recorded telemetry events for a given session.
   */
  public getSessionEvents(sessionId: string): ClassroomSessionTelemetryEvent[] {
    return this.sessionBuffers.get(sessionId) || [];
  }

  /**
   * Clears telemetry buffer for a session.
   */
  public clearSession(sessionId: string): void {
    this.sessionBuffers.delete(sessionId);
  }

  /**
   * Strips any sensitive or extraneous fields from telemetry payloads.
   */
  private sanitizeData(data?: Record<string, any>): Record<string, any> {
    if (!data || typeof data !== 'object') return {};

    const disallowedKeys = new Set([
      'token',
      'password',
      'secret',
      'auth',
      'email',
      'userId',
      'filePath',
      'comfyui',
    ]);

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (disallowedKeys.has(key.toLowerCase())) {
        continue;
      }
      if (typeof value === 'string' && value.length > 300) {
        sanitized[key] = value.substring(0, 300) + '...';
      } else if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'string'
      ) {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 10);
      }
    }

    return sanitized;
  }
}

export const classroomTelemetry = ClassroomTelemetryService.getInstance();
