import type {
  ClassroomAction,
  ClassroomActionResult,
  ClassroomIntegrationContext,
  ClassroomProviderStatus,
  ClassroomScene,
  ClassroomSceneRequest,
} from './types';

export interface ClassroomProvider {
  readonly id: ClassroomProviderStatus['id'];
  readonly label: string;
  status(): ClassroomProviderStatus;
  initialize?(context: ClassroomIntegrationContext): Promise<void>;
  generateScene?(request: ClassroomSceneRequest): Promise<ClassroomScene | null>;
  executeAction?(action: ClassroomAction): Promise<ClassroomActionResult>;
  destroy?(): Promise<void>;
}
