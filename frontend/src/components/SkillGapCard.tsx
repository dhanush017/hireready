import React from 'react';
import {
  HelpCircle,
  Wrench,
  Search,
} from 'lucide-react';
import type { GapDetail } from '../types';

interface SkillGapCardProps {
  gap: GapDetail;
}

export const SkillGapCard: React.FC<SkillGapCardProps> = ({ gap }) => {
  const isMissing = gap.status === 'missing';

  const priorityStyles = {
    high: {
      badge: 'bg-red-500/10 text-red-400 border-red-500/30',
      border: 'border-red-500/20 hover:border-red-500/40',
      dot: 'bg-red-400',
    },
    medium: {
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      dot: 'bg-amber-400',
    },
    low: {
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      dot: 'bg-blue-400',
    },
  }[gap.priority] || {
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    border: 'border-slate-800 hover:border-slate-700',
    dot: 'bg-slate-400',
  };

  return (
    <div
      className={`glass-panel p-5 rounded-xl border transition-all duration-200 ${priorityStyles.border} relative overflow-hidden`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${priorityStyles.dot}`} />
          <h4 className="text-base font-bold text-white tracking-tight">
            {gap.skill}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
              isMissing
                ? 'bg-red-950/40 text-red-300 border-red-500/30'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
            }`}
          >
            {isMissing ? 'Missing' : 'Partial Credit'}
          </span>
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityStyles.badge}`}
          >
            {gap.priority} Priority
          </span>
        </div>
      </div>

      {/* Content Details */}
      <div className="space-y-2.5 text-xs">
        {/* Why it matters */}
        <div className="flex items-start gap-2 text-slate-300">
          <HelpCircle className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-slate-200">Why it matters: </span>
            <span className="text-slate-400">{gap.why_it_matters}</span>
          </div>
        </div>

        {/* Evidence */}
        <div className="flex items-start gap-2 text-slate-300">
          <Search className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-slate-200">Resume evidence: </span>
            <span
              className={
                gap.evidence.toLowerCase().includes('not found')
                  ? 'text-red-400/90 italic font-mono'
                  : 'text-amber-300/90 font-mono'
              }
            >
              {gap.evidence}
            </span>
          </div>
        </div>

        {/* How to fix */}
        <div className="flex items-start gap-2 text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <Wrench className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-emerald-400">Action plan: </span>
            <span className="text-slate-300">{gap.how_to_fix}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
