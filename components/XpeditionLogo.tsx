import React from 'react';

interface XpeditionLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const XpeditionLogo: React.FC<XpeditionLogoProps> = ({ className = '', iconOnly = false }) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 4-leaf clover / propeller X mark */}
      <svg
        className="w-8 h-8 shrink-0 drop-shadow-sm"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Top-Left Leaf */}
        <path
          d="M18 18 C14 8 8 4 5 7 C2 10 6 16 18 18 Z"
          fill="#1B5E43"
        />
        <path
          d="M17 17 C13.5 9 8.5 6 6 8.5 C3.5 11 7 15 17 17 Z"
          fill="#32956D"
          opacity="0.65"
        />
        <path
          d="M15 15 C11 10 8 8 7 9 C6 10 8 13 15 15 Z"
          fill="#47B888"
          opacity="0.45"
        />

        {/* Top-Right Leaf */}
        <path
          d="M18 18 C22 8 28 4 31 7 C34 10 30 16 18 18 Z"
          fill="#16513A"
        />
        <path
          d="M19 17 C22.5 9 27.5 6 30 8.5 C32.5 11 29 15 19 17 Z"
          fill="#2C8862"
          opacity="0.65"
        />
        <path
          d="M21 15 C25 10 28 8 29 9 C30 10 28 13 21 15 Z"
          fill="#47B888"
          opacity="0.45"
        />

        {/* Bottom-Left Leaf */}
        <path
          d="M18 18 C14 28 8 32 5 29 C2 26 6 20 18 18 Z"
          fill="#134733"
        />
        <path
          d="M17 19 C13.5 27 8.5 30 6 27.5 C3.5 25 7 21 17 19 Z"
          fill="#277D5A"
          opacity="0.65"
        />
        <path
          d="M15 21 C11 26 8 28 7 27 C6 26 8 23 15 21 Z"
          fill="#47B888"
          opacity="0.45"
        />

        {/* Bottom-Right Leaf */}
        <path
          d="M18 18 C22 28 28 32 31 29 C34 26 30 20 18 18 Z"
          fill="#1B5E43"
        />
        <path
          d="M19 19 C22.5 27 27.5 30 30 27.5 C32.5 25 29 21 19 19 Z"
          fill="#32956D"
          opacity="0.65"
        />
        <path
          d="M21 21 C25 26 28 28 29 27 C30 26 28 23 21 21 Z"
          fill="#47B888"
          opacity="0.45"
        />

        {/* Center core junction */}
        <circle cx="18" cy="18" r="2.2" fill="#0E3827" />
      </svg>

      {!iconOnly && (
        <span className="font-sans font-extrabold text-xl sm:text-2xl tracking-[0.14em] text-slate-900 leading-none">
          XPEDITION
        </span>
      )}
    </div>
  );
};
