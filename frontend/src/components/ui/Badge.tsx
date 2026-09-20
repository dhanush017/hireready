import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'accent'
  | 'high'
  | 'medium'
  | 'low'
  | 'matched'
  | 'partial'
  | 'missing';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-zinc-900 text-white border-transparent',
    secondary: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    outline: 'bg-transparent text-zinc-700 border-zinc-200',
    accent: 'bg-accent-50 text-accent-800 border-accent-200',
    high: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    medium: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    low: 'bg-zinc-100 text-zinc-600 border-zinc-200 font-medium',
    matched: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
    partial: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    missing: 'bg-rose-50 text-rose-800 border-rose-200 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border tracking-normal select-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
