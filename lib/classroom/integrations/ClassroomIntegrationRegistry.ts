import { CanvasProvider } from './CanvasProvider';
import { ClassroomProvider } from './ClassroomProvider';
import { LiveGenieProvider } from './LiveGenieProvider';
import { MiroProvider } from './MiroProvider';
import { OpenMAICProvider } from './OpenMAICProvider';
import type { ClassroomIntegrationId, ClassroomProviderStatus } from './types';

export class ClassroomIntegrationRegistry {
  private readonly providers: Map<ClassroomIntegrationId, ClassroomProvider>;

  constructor(providers: ClassroomProvider[] = [
    new OpenMAICProvider(),
    new LiveGenieProvider(),
    new CanvasProvider(),
    new MiroProvider(),
  ]) {
    this.providers = new Map(providers.map((provider) => [provider.id, provider]));
  }

  get(id: ClassroomIntegrationId): ClassroomProvider | undefined {
    return this.providers.get(id);
  }

  all(): ClassroomProvider[] {
    return [...this.providers.values()];
  }

  statuses(): ClassroomProviderStatus[] {
    return this.all().map((provider) => provider.status());
  }
}

export const classroomIntegrationRegistry = new ClassroomIntegrationRegistry();
