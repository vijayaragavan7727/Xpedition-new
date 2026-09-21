'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClassSessionData, ClassStageId } from '@/lib/class/types';
import { CLASS_STAGE_SEQUENCE, getClassData } from '@/lib/class/classCatalog';
import { ClassHeader } from './ClassHeader';
import { ClassFooter } from './ClassFooter';
import { ClassExperienceRenderer } from './ClassExperienceRenderer';
import { ClassStageOverlay } from './ClassStageOverlay';
import { ClassToolsDrawer, ClassToolType } from './ClassToolsDrawer';
import {
  SkipReason,
  requiresSkipConfirmation,
  createSkipRecord,
  evaluateSkipMasterySafety,
  SkipRecord,
} from '@/lib/class/skipSystem';
import { ClassSkipConfirmModal } from './ClassSkipConfirmModal';

export interface UnifiedClassContainerProps {
  conceptId?: string;
  initialStage?: ClassStageId;
  onClassComplete?: () => void;
  backHref?: string;
  className?: string;
}

export const UnifiedClassContainer: React.FC<UnifiedClassContainerProps> = ({
  conceptId = 'projectile_motion',
  initialStage = 'introduce',
  onClassComplete,
  backHref = '/learn',
  className = '',
}) => {
  const router = useRouter();
  const classData: ClassSessionData = getClassData(conceptId);

  // 1. Stage Lifecycle State
  const [currentStage, setCurrentStage] = useState<ClassStageId>(initialStage);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(
    CLASS_STAGE_SEQUENCE.findIndex((s) => s.id === initialStage) + 1 || 1
  );

  // 2. Interactive Canvas Parameters (Direct manipulation)
  const [angle, setAngle] = useState<number>(45);
  const [velocity, setVelocity] = useState<number>(18);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  // 3. Supporting Tools Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<ClassToolType>('formula');

  // 4. Universal Skip System State
  const [isSkipModalOpen, setIsSkipModalOpen] = useState<boolean>(false);

  // Stage lookup
  const currentStageMeta =
    CLASS_STAGE_SEQUENCE.find((s) => s.id === currentStage) || CLASS_STAGE_SEQUENCE[0];

  // Stage Advancement Handler
  const advanceToStage = useCallback((targetStageId: ClassStageId) => {
    const nextIdx = CLASS_STAGE_SEQUENCE.findIndex((s) => s.id === targetStageId);
    if (nextIdx !== -1) {
      setCurrentStage(targetStageId);
      setActiveStageIndex(nextIdx + 1);
    }
  }, []);

  const handleNextStage = useCallback(() => {
    const currentIndex = CLASS_STAGE_SEQUENCE.findIndex((s) => s.id === currentStage);
    if (currentIndex < CLASS_STAGE_SEQUENCE.length - 1) {
      const nextMeta = CLASS_STAGE_SEQUENCE[currentIndex + 1];
      setCurrentStage(nextMeta.id);
      setActiveStageIndex(currentIndex + 2);
    } else {
      // Completed all stages -> transition to next concept
      if (onClassComplete) {
        onClassComplete();
      } else {
        router.push(`/class?concept=${classData.nextConcept.conceptId}`);
      }
    }
  }, [currentStage, classData, onClassComplete, router]);

  const handlePreviousStage = useCallback(() => {
    const currentIndex = CLASS_STAGE_SEQUENCE.findIndex((s) => s.id === currentStage);
    if (currentIndex > 0) {
      const prevMeta = CLASS_STAGE_SEQUENCE[currentIndex - 1];
      setCurrentStage(prevMeta.id);
      setActiveStageIndex(currentIndex);
    }
  }, [currentStage]);

  // Universal Skip Execution Handler
  const executeSkip = useCallback((reason: SkipReason) => {
    const record: SkipRecord = createSkipRecord(currentStage, classData.conceptId, reason);
    const safety = evaluateSkipMasterySafety(record);

    // Invariant check: ensure zero mastery or BKT credit is ever awarded
    if (safety.masteryAwarded || safety.bktUpdated) {
      console.error('[SkipSystem] INVARIANT VIOLATION: Skip attempted to award mastery');
      return;
    }

    setIsSkipModalOpen(false);
    handleNextStage();
  }, [currentStage, classData.conceptId, handleNextStage]);

  // Initiates skip, checking if confirmation warning modal is required
  const handleInitiateSkip = useCallback(() => {
    if (requiresSkipConfirmation(currentStage)) {
      setIsSkipModalOpen(true);
    } else {
      executeSkip('optional_content');
    }
  }, [currentStage, executeSkip]);

  // Primary Action Button Router depending on active stage
  const handlePrimaryAction = useCallback(() => {
    if (currentStage === 'interact') {
      // Trigger simulation launch on canvas
      setIsLaunching(true);
    } else if (currentStage === 'next_class') {
      // Launch next concept
      router.push(`/class?concept=${classData.nextConcept.conceptId}`);
    } else {
      // Advance to next progressive stage
      handleNextStage();
    }
  }, [currentStage, handleNextStage, classData, router]);

  // Launch complete callback from 3D physics simulator
  const handleLaunchComplete = useCallback(() => {
    setIsLaunching(false);
    // Move to observation stage
    advanceToStage('observe');
  }, [advanceToStage]);

  // Drawer Opener Helpers
  const openTool = (type: ClassToolType) => {
    setActiveTool(type);
    setIsDrawerOpen(true);
  };

  // Determine whether the 3D visual canvas or the overlay takes dominance
  const isCanvasDominant =
    currentStage === 'explore' ||
    currentStage === 'interact' ||
    currentStage === 'mission' ||
    currentStage === 'challenge';

  return (
    <div
      className={`relative w-full min-h-screen bg-[#060B18] text-white flex flex-col justify-between overflow-x-hidden ${className}`}
    >
      {/* 1. Class Header */}
      <ClassHeader
        subject={classData.subject}
        conceptName={classData.conceptName}
        classNumber={classData.classNumber}
        totalClasses={classData.totalClasses}
        currentStage={currentStage}
        stageIndex={activeStageIndex}
        totalStages={CLASS_STAGE_SEQUENCE.length}
        xpReward={classData.xpReward}
        modality={classData.modality}
        onPreviousStage={handlePreviousStage}
        onNextStage={handleNextStage}
        backHref={backHref}
      />

      {/* 2. Main Experience & Stage Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 flex flex-col justify-center relative">
        {/* If canvas-dominant stage, render canvas full-height with minimal overlay */}
        {isCanvasDominant ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="w-full flex-1 max-h-[68vh] min-h-[360px] sm:min-h-[480px]">
              <ClassExperienceRenderer
                conceptId={classData.conceptId}
                modality={classData.modality}
                currentStage={currentStage}
                angle={angle}
                velocity={velocity}
                isLaunching={isLaunching}
                onAngleChange={setAngle}
                onVelocityChange={setVelocity}
                onLaunchComplete={handleLaunchComplete}
              />
            </div>

            {/* Compact contextual Buddy guidance below or floating over canvas */}
            <div className="w-full max-w-lg mx-auto">
              <ClassStageOverlay
                stage={currentStage}
                data={classData}
                angle={angle}
                velocity={velocity}
                isLaunching={isLaunching}
                onFireExperiment={() => setIsLaunching(true)}
                onAdvanceStage={handleNextStage}
              />
            </div>
          </div>
        ) : (
          /* Conceptual / Formative / Review stages: Overlay card with compact 3D canvas backdrop */
          <div className="w-full flex-1 flex flex-col items-center justify-center py-2 sm:py-6">
            <ClassStageOverlay
              stage={currentStage}
              data={classData}
              angle={angle}
              velocity={velocity}
              isLaunching={isLaunching}
              onFireExperiment={() => setIsLaunching(true)}
              onAdvanceStage={handleNextStage}
            />
          </div>
        )}
      </main>

      {/* 3. Class Footer Action Bar */}
      <ClassFooter
        primaryLabel={
          currentStage === 'interact'
            ? isLaunching
              ? 'Launching...'
              : 'Fire Cannon 🎯'
            : currentStageMeta.primaryCta
        }
        onPrimaryAction={handlePrimaryAction}
        isLoading={isLaunching}
        canSkip={currentStageMeta.canSkip}
        skipLabel={currentStageMeta.skipLabel}
        onSkip={handleInitiateSkip}
        onOpenFormula={() => openTool('formula')}
        onOpenNotes={() => openTool('notes')}
        onOpenXira={() => openTool('xira')}
        onOpenProgress={() => openTool('progress')}
      />

      {/* 4. In-Class Supporting Tools Drawer */}
      <ClassToolsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        toolType={activeTool}
        conceptName={classData.conceptName}
        formula={classData.explanation.formula}
        classNumber={classData.classNumber}
        totalClasses={classData.totalClasses}
      />

      {/* 5. Skip Confirmation Modal */}
      <ClassSkipConfirmModal
        isOpen={isSkipModalOpen}
        stage={currentStage}
        conceptName={classData.conceptName}
        onConfirm={(reason) => executeSkip(reason)}
        onCancel={() => setIsSkipModalOpen(false)}
      />
    </div>
  );
};

export default UnifiedClassContainer;
