/**
 * Xpedition Experience Engine v1 — Unified Orchestration Architecture
 *
 * Public entry point for experience types, simulation physics, telemetry,
 * challenge orchestration, Xira advisor, experience configurations, and the
 * canonical Experience Orchestrator.
 */

export * from './types';
export * from './events';
export * from './validation';
export * from './feedback';
export * from './experienceDefinition';
export * from './experienceOrchestrator';
export * from './experienceRegistry';
export * from './templates';
export * from './xira/experienceObservation';
export * from './devProof/targetInteractionExperience';

// Domain and legacy exports
export * from './simulation/projectilePhysics';
export * from './telemetry/telemetryEmitter';
export * from './challenge/challengeEngine';
export * from './xira/xiraExperienceAdvisor';
export * from './learnerModel/learnerModelAdapter';
export * from './catalog/projectileMotionConfig';
export * from './simulation/spatialMath';
export * from './catalog/objectManipulationConfig';
export * from './domain/moleculeRules';
export * from './catalog/moleculeBuilderConfig';
export * from './domain/heartAnatomyRules';
export * from './catalog/heartAnatomyConfig';
export * from './domain/codeDebuggingRules';
export * from './catalog/codeDebuggingConfig';
export * from './catalog';
export * from './nextExperienceResolver';
export * from './nextQuestResolver';
export * from './universalTopicTypes';
export * from './topicResolver';
export * from './topicExperienceComposer';
export * from './topicAiAssistant';
export * from './scene';
