'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  showSteppers?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange,
  showSteppers = true,
  disabled = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handleDecrement = () => {
    if (disabled) return;
    const nextVal = Math.max(min, value - step);
    onChange(nextVal);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const nextVal = Math.min(max, value + step);
    onChange(nextVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div
      className={`p-3 sm:p-4 rounded-xl bg-[#151B1B] border border-[#263130] shadow-sm select-none transition-colors ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Label and Value readout */}
      <div className="flex items-center justify-between mb-2">
        {label && (
          <span className="font-sans font-semibold text-xs text-[#E5E0D5]">
            {label}
          </span>
        )}
        <div className="flex items-baseline gap-1 font-mono font-bold text-sm text-white">
          <span>{value}</span>
          {unit && <span className="text-[#8E9693] text-xs">{unit}</span>}
        </div>
      </div>

      {/* Stepper Buttons & Range Track */}
      <div className="flex items-center gap-3">
        {showSteppers && (
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            aria-label="Decrease value"
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-[#263130]"
          >
            <Minus className="w-4 h-4" />
          </button>
        )}

        {/* Custom Styled Range Slider */}
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={handleInputChange}
            className="w-full h-2 rounded-lg appearance-none bg-[#263130] cursor-pointer focus:outline-none accent-[#0B7066]"
            style={{
              background: `linear-gradient(to right, #004741 0%, #0B7066 ${percentage}%, #263130 ${percentage}%, #263130 100%)`,
            }}
          />
        </div>

        {showSteppers && (
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            aria-label="Increase value"
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-[#263130]"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Slider;
