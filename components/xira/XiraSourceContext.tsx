'use client';

import React from 'react';
import { FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

export type MaterialUploadStatus = 'idle' | 'uploading' | 'reading' | 'ready' | 'error';

export interface MaterialContextItem {
  id: string;
  name: string;
  size: number;
  type: string; // 'pdf' | 'docx' | 'txt' | 'image'
  status: MaterialUploadStatus;
  extractedLength?: number;
  rawText?: string;
  errorMessage?: string;
}

export interface XiraSourceContextProps {
  material: MaterialContextItem | null;
  onRemove: () => void;
  className?: string;
}

export const XiraSourceContext: React.FC<XiraSourceContextProps> = ({
  material,
  onRemove,
  className = '',
}) => {
  if (!material) return null;

  const isImage = material.type === 'image' || material.name.match(/\.(png|jpg|jpeg)$/i);

  const getStatusBadge = () => {
    switch (material.status) {
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-md">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading...
          </span>
        );
      case 'reading':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md">
            <Loader2 className="w-3 h-3 animate-spin" />
            Reading...
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3" />
            Ready ({material.extractedLength ? `${Math.round(material.extractedLength / 5)} words` : 'grounded'})
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md">
            <AlertCircle className="w-3 h-3" />
            Could not read
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md transition-all ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
          {isImage ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-[260px]">
              {material.name}
            </span>
            {getStatusBadge()}
          </div>
          {material.status === 'error' && material.errorMessage && (
            <p className="font-sans text-[11px] text-rose-300 truncate mt-0.5">
              {material.errorMessage}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove attached material ${material.name}`}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 outline-none"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default XiraSourceContext;
