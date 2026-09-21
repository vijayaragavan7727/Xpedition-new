'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Brain, BookOpen } from 'lucide-react';
import XiraInput, { StudyMode } from './XiraInput';
import XiraResponse, { StructuredXiraResponse, parseXiraResponseText } from './XiraResponse';
import XiraSourceContext, { MaterialContextItem } from './XiraSourceContext';
import XiraSuggestion from './XiraSuggestion';

export interface XiraStudyWorkspaceProps {
  conceptId?: string;
  conceptName?: string;
  learnerGoal?: string;
  learnerTheta?: number;
  learnerLanguage?: string;
  className?: string;
}

export const XiraStudyWorkspace: React.FC<XiraStudyWorkspaceProps> = ({
  conceptId = 'projectile_motion',
  conceptName = 'Projectile Motion',
  learnerGoal = 'Master Physics & Mechanics',
  learnerTheta = -0.4,
  learnerLanguage = 'english',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [activeMode, setActiveMode] = useState<StudyMode>('EXPLAIN');
  const [isLoading, setIsLoading] = useState(false);
  const [material, setMaterial] = useState<MaterialContextItem | null>(null);
  const [response, setResponse] = useState<StructuredXiraResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // In-flight request cancellation & timeout management
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, []);

  // File attachment handler using existing /api/extract-syllabus
  const handleAttachFile = async (file: File) => {
    const isImage = !!file.name.match(/\.(png|jpg|jpeg)$/i);
    const newMaterial: MaterialContextItem = {
      id: `mat_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: isImage ? 'image' : 'pdf',
      status: 'uploading',
    };

    setMaterial(newMaterial);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      newMaterial.status = 'reading';
      setMaterial({ ...newMaterial });

      const res = await fetch('/api/extract-syllabus', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMaterial({
          ...newMaterial,
          status: 'error',
          errorMessage: data.error || 'Could not extract text from this document.',
        });
        return;
      }

      if (data.warning && !data.text) {
        setMaterial({
          ...newMaterial,
          status: 'error',
          errorMessage: data.warning,
        });
        return;
      }

      setMaterial({
        ...newMaterial,
        status: 'ready',
        rawText: data.text,
        extractedLength: data.extractedLength || data.text.length,
      });
    } catch (err: any) {
      setMaterial({
        ...newMaterial,
        status: 'error',
        errorMessage: 'Network error while reading material.',
      });
    }
  };

  const handleRemoveMaterial = () => {
    setMaterial(null);
  };

  // Submit query to Xira with automatic in-flight cancellation & timeout
  const handleSubmitQuery = useCallback(async (customQuery?: string) => {
    const textToSend = (customQuery || query).trim();
    if (!textToSend) return;

    // 1. Cancel previous in-flight request to prevent stale response overwrite
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    // 2. Set 15-second graceful timeout
    timeoutIdRef.current = setTimeout(() => {
      controller.abort();
      setIsLoading(false);
      setError('Xira is taking longer than expected. Please retry or continue with class.');
    }, 15000);

    // Pre-populate query state if selected via chip
    if (customQuery) {
      setQuery(customQuery);
    }

    try {
      const modePrefix =
        activeMode === 'PRACTICE'
          ? 'Practice exercise: '
          : activeMode === 'QUIZ'
          ? 'Quiz me on: '
          : activeMode === 'HINT'
          ? 'Give me a hint about: '
          : '';

      const fullMessage = `${modePrefix}${textToSend}`;

      const payload: any = {
        message: fullMessage,
        context: {
          scope: 'workspace',
          concept: conceptName,
          goal: learnerGoal,
          theta: learnerTheta,
          language: learnerLanguage,
        },
      };

      // If material is attached and ready, include document context
      if (material && material.status === 'ready' && material.rawText) {
        payload.context.document = {
          id: material.id,
          title: material.name,
          rawText: material.rawText,
        };
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || '';

      const parsed = parseXiraResponseText(
        replyText,
        conceptName,
        material?.status === 'ready' ? material.name : undefined
      );

      setResponse(parsed);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request intentionally aborted by newer request or timeout; do not overwrite
        return;
      }
      console.error('Xira Study Workspace error:', err);
      setError(err.message || 'Xira could not respond right now.');
    } finally {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setIsLoading(false);
    }
  }, [query, activeMode, conceptName, learnerGoal, learnerTheta, learnerLanguage, material]);

  const handleSuggestionSelect = (text: string) => {
    setQuery(text);
    handleSubmitQuery(text);
  };

  const handleTriggerAction = (actionType: 'harder' | 'explain' | 'quiz' | 'practice') => {
    if (actionType === 'harder') {
      handleSubmitQuery(`Ask me an advanced challenging question on ${conceptName}`);
    } else if (actionType === 'explain') {
      handleSubmitQuery(`Explain ${conceptName} from an intuitive alternative angle`);
    } else if (actionType === 'quiz') {
      setActiveMode('QUIZ');
      handleSubmitQuery(`Quiz me on key principles of ${conceptName}`);
    } else if (actionType === 'practice') {
      setActiveMode('PRACTICE');
      handleSubmitQuery(`Give me an active practice problem for ${conceptName}`);
    }
  };

  return (
    <section
      aria-label="Xira Study Workspace"
      className={`rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-[#12172A]/95 via-[#0D1224]/95 to-[#080B17]/95 p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-4 backdrop-blur-xl ${className}`}
    >
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/35 flex items-center justify-center text-indigo-300 shadow-sm">
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-sm sm:text-base text-white tracking-tight">
              Study with Xira
            </h2>
            <span className="font-sans text-[11px] text-slate-400 block">
              Cognitive learning companion &amp; study guide
            </span>
          </div>
        </div>

        {conceptName && (
          <span className="font-mono text-[11px] text-indigo-300 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30">
            Focus: {conceptName}
          </span>
        )}
      </div>

      {/* Material Context Attachment (if active) */}
      {material && (
        <XiraSourceContext material={material} onRemove={handleRemoveMaterial} />
      )}

      {/* Input Area */}
      <XiraInput
        query={query}
        onChangeQuery={setQuery}
        onSubmit={() => handleSubmitQuery()}
        isLoading={isLoading}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onAttachFile={handleAttachFile}
        placeholder={`What are you learning about ${conceptName || 'today'}?`}
      />

      {/* Suggestion Chips (when no response, error, or active loading) */}
      {!response && !error && !isLoading && (
        <XiraSuggestion
          activeConceptName={conceptName}
          onSelect={handleSuggestionSelect}
        />
      )}

      {/* Immediate Progressive Response Shell during active inference */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-indigo-500/25 bg-[#141826]/80 p-5 space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-mono text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Synthesizing with {activeMode} mode...
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">Xira Cognitive Engine</span>
          </div>
          <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
          <div className="h-4 w-1/2 bg-white/[0.04] rounded" />
          <div className="h-10 w-full bg-white/[0.02] rounded-lg border border-white/[0.04]" />
        </div>
      )}

      {/* Response or Error Presentation */}
      {(response || error) && !isLoading && (
        <XiraResponse
          response={response}
          error={error}
          onRetry={() => handleSubmitQuery()}
          onTriggerAction={handleTriggerAction}
        />
      )}
    </section>
  );
};

export default XiraStudyWorkspace;
