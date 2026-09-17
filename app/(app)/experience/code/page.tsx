'use client';

/**
 * Dedicated route for Experience #5: Programming Code Lab ("Debug by Doing")
 * Route: /experience/code
 *
 * Demonstrates the reusability of the unified Experience Engine:
 * - Direct standalone interactive launch
 * - Constrained deterministic Python loop execution & validation
 * - In-editor code editing, running, and progressive hint system
 * - Contextual Xira debugging guidance
 * - Emits canonical ExperienceResult with codeEvidence to Learner Model
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CodeExperienceContainer } from '@/components/experience/CodeExperienceContainer';
import { ExperienceResult, LearnerModelAdapter } from '@/lib/experience';
import { ExperienceReflectionCard } from '@/components/experience/ExperienceReflectionCard';
import { processAdaptiveExperienceLoop, AdaptiveExperienceLoopResult } from '@/lib/intelligence';

export default function CodeExperiencePage() {
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
            nextActionTitle={adaptiveResult?.nextQuest?.buttonLabel || "Continue to Loop Counters & Conditionals"}
            nextActionReason={adaptiveResult?.reason || "Accumulation vs reassignment bug diagnosed and solved successfully."}
            adaptiveResult={adaptiveResult}
          />
        </div>
      ) : (
        <CodeExperienceContainer
          onComplete={handleComplete}
          backHref="/home"
        />
      )}
    </div>
  );
}
