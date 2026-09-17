'use client';

/**
 * Dedicated route for Experience #4: 3D Human Heart Anatomy Explorer
 * Route: /experience/heart
 *
 * Demonstrates the reusability of the unified Experience Engine:
 * - Direct standalone interactive launch
 * - Real-time 3D anatomical model with pulsation & raycast structure inspection
 * - 12-step unidirectional cardiovascular blood flow circuit
 * - Contextual challenges & misconception coaching via Xira
 * - Emits canonical ExperienceResult evidence to Learner Model
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartExperienceContainer } from '@/components/experience/HeartExperienceContainer';
import { ExperienceResult, LearnerModelAdapter } from '@/lib/experience';
import { ExperienceReflectionCard } from '@/components/experience/ExperienceReflectionCard';
import { processAdaptiveExperienceLoop, AdaptiveExperienceLoopResult } from '@/lib/intelligence';

export default function HeartExperiencePage() {
  const router = useRouter();
  const [completedResult, setCompletedResult] = useState<ExperienceResult | null>(null);
  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveExperienceLoopResult | null>(null);

  const handleComplete = (result: ExperienceResult) => {
    // Record evidence in canonical store
    LearnerModelAdapter.recordExperienceOutcome({
      conceptId: result.conceptId,
      conceptName: result.conceptName,
      isSuccess: result.completed ?? true,
      accuracy: 1.0,
      trialsCount: result.attempts,
      confidence: 'known',
      timeSpentSeconds: result.timeSpentSeconds,
      timestamp: Date.now(),
    });

    const loopResult = processAdaptiveExperienceLoop(result);
    setAdaptiveResult(loopResult);
    setCompletedResult(result);
  };

  return (
    <div className="py-2 px-3 sm:px-6">
      {completedResult ? (
        <div className="py-8">
          <ExperienceReflectionCard
            result={completedResult}
            onContinue={(targetRoute) => router.push(targetRoute || '/home')}
            nextActionTitle={adaptiveResult?.nextQuest?.buttonLabel || "Continue to Cardiovascular Physiology"}
            nextActionReason={adaptiveResult?.reason || "Solid understanding of cardiac chambers and valves demonstrated."}
            adaptiveResult={adaptiveResult}
          />
        </div>
      ) : (
        <HeartExperienceContainer
          onComplete={handleComplete}
          backHref="/home"
        />
      )}
    </div>
  );
}
