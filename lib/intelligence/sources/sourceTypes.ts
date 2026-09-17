/**
 * Xpedition Source Intelligence Engine v1 — Core Source & License Contracts
 *
 * Defines license-aware educational sources, attribution metadata, and knowledge bundle types.
 */

export type SourceLicenseType =
  | 'CC0'
  | 'CC-BY'
  | 'CC-BY-SA'
  | 'CC-BY-NC'
  | 'CC-BY-NC-SA'
  | 'PublicDomain'
  | 'MIT'
  | 'FairUseReference'
  | 'RestrictedAllRightsReserved'
  | 'Unknown';

export interface SourceLicenseDetails {
  license: SourceLicenseType;
  commercialUseAllowed: boolean;
  derivativeWorksAllowed: boolean;
  attributionRequired: boolean;
  shareAlikeRequired: boolean;
  usageGuideline: string;
}

export type EducationalSourceCategory =
  | 'open_textbook'
  | 'open_courseware'
  | 'university'
  | 'scientific_government'
  | 'official_docs'
  | 'academic_reference'
  | 'peer_reviewed'
  | 'general_reference';

export interface EducationalSource {
  id: string;
  title: string;
  publisher: string;
  author?: string;
  url: string;
  category: EducationalSourceCategory;
  license: SourceLicenseType;
  licenseDetails: SourceLicenseDetails;
  authorityScore: number; // 0.0 to 1.0 (e.g. NASA, MIT OCW, OpenStax = 0.95+)
  relevanceScore: number; // 0.0 to 1.0
  overallScore: number;   // Combined authority + relevance + license clarity
  retrievalDate: string;  // ISO timestamp
  excerpt?: string;       // Verified snippet (fair-use / excerpt only)
  topics: string[];       // Associated syllabus/topic keywords
  verifiedOpenAccess: boolean;
}

export interface LearningEntity {
  id: string;
  name: string;
  role: 'input' | 'process' | 'output' | 'controller' | 'environment' | 'field' | 'indicator';
  semanticDescription: string;
  physicalVisualType: 'sphere' | 'box' | 'cylinder' | 'capsule' | 'arrow' | 'plane' | 'particle' | 'orbit';
  color?: string;
  connectsTo?: string[];
  attributes?: Record<string, any>;
}

export interface LearningRelationship {
  sourceEntityId: string;
  targetEntityId: string;
  type: 'flowsTo' | 'causes' | 'dependsOn' | 'contains' | 'transformsInto' | 'resists' | 'opposes';
  description: string;
  formula?: string;
}

export interface LearningProcessStep {
  stepIndex: number;
  name: string;
  description: string;
  inputEntityIds: string[];
  outputEntityIds: string[];
  governingPrinciple: string;
}

export interface SourceMisconception {
  commonMistake: string;
  scientificTruth: string;
  remediationGuidance: string;
  sourceAttribution?: string;
}

export interface LearningKnowledgeBundle {
  bundleId: string;
  topic: string;
  normalizedTopic: string;
  subject: string;
  domain: string;
  sources: EducationalSource[];
  primarySourceTitle?: string;
  primarySourcePublisher?: string;
  concepts: Array<{
    id: string;
    name: string;
    definition: string;
    sourceId?: string;
  }>;
  principles: Array<{
    id: string;
    statement: string;
    explanation: string;
    formula?: string;
    sourceId?: string;
  }>;
  entities: LearningEntity[];
  relationships: LearningRelationship[];
  processSteps: LearningProcessStep[];
  misconceptions: SourceMisconception[];
  learningObjectives: string[];
  suggestedManipulableVariables: Array<{
    name: string;
    label: string;
    unit?: string;
    min: number;
    max: number;
    defaultValue: number;
    step?: number;
    educationalImpact: string;
  }>;
  confidence: number;
  isSourceBacked: boolean;
  createdAt: number;
}
