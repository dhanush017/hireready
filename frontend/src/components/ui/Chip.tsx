import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export type ChipStatus = 'matched' | 'partial' | 'missing' | 'neutral' | 'accent';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  status?: ChipStatus;
  detail?: string;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  status = 'neutral',
  detail,
  className = '',
  ...props
}) => {
  const styles = {
    matched: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    partial: 'bg-amber-50 text-amber-900 border-amber-200/90',
    missing: 'bg-rose-50 text-rose-800 border-rose-200/90',
    neutral: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    accent: 'bg-accent-50 text-accent-800 border-accent-200',
  }[status];

  const renderIcon = () => {
    switch (status) {
      case 'matched':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2} aria-hidden="true" />;
      case 'partial':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" strokeWidth={2} aria-hidden="true" />;
      case 'missing':
        return <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" strokeWidth={2} aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border tracking-normal ${styles} ${className}`}
      {...props}
    >
      {renderIcon()}
      <span>{label}</span>
      {detail && (
        <span className="text-[11px] opacity-75 font-normal ml-0.5">
          ({detail})
        </span>
      )}
    </span>
  );
};
