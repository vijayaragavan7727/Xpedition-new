'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

export interface KaTeXRendererProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({
  math,
  block = true,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      // Fallback clean text if TeX parsing encounters an unexpected token
      return null;
    }
  }, [math, block]);

  if (!html) {
    return (
      <span className={`font-mono text-sm tracking-wide ${className}`}>
        {math}
      </span>
    );
  }

  return (
    <span
      className={`katex-render-container select-text ${block ? 'block my-1 text-center' : 'inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default KaTeXRenderer;
