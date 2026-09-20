import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100 (or max)
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  variant?: 'accent' | 'success' | 'warning' | 'neutral';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 'sm',
  variant = 'accent',
  showLabel = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const variants = {
    accent: 'bg-accent-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    neutral: 'bg-zinc-800',
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs text-zinc-500 mb-1 tabular-nums font-medium">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60 ${heights[height]}`}
      >
        <div
          className={`${heights[height]} ${variants[variant]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
