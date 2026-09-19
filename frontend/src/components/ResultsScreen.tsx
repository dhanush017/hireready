import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import type { AnalysisResult, PlanResult } from '../types';
import { SkillGapCard } from './SkillGapCard';
import { RoadmapTimeline } from './RoadmapTimeline';

interface ResultsScreenProps {
  analysis: AnalysisResult;
  plan: PlanResult | null;
  onStartInterview: () => void;
  onReset: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  analysis,
  plan,
  onStartInterview,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'roadmap'>('overview');
  const [showFormula, setShowFormula] = useState(false);

  useEffect(() => {
    if (analysis.score >= 60) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore confetti errors if unsupported
      }
    }
  }, [analysis.score]);

  // Color styling based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-sky-400 border-sky-500/40 bg-sky-500/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const scoreClass = getScoreColor(analysis.score);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300">
      {/* Top Bar: Action Buttons & Candidate / Role info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-brand-400 tracking-wider uppercase">
            Analysis Report
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {analysis.resume_profile.name || 'Candidate'} · {analysis.job_requirements.title || 'Role Match'}
          </h2>
          {analysis.job_requirements.company && (
            <p className="text-sm text-slate-400 mt-0.5">
              Target Company: {analysis.job_requirements.company}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
          <button
            onClick={onStartInterview}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-500 to-accent-600 hover:from-brand-400 hover:to-accent-500 text-white shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Practice Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Score Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 mb-8 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Circular Score Badge */}
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div
              className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-xl ${scoreClass}`}
            >
              <span className="text-4xl font-extrabold tracking-tight">
                {Math.round(analysis.score)}%
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider mt-0.5">
                Match Score
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium">
              Transparent, Evidence-Based
            </p>
          </div>

          {/* Explanation & Disclaimers */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  How Your Match Was Computed
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {analysis.score_explanation}
                </p>
              </div>
            </div>

            {/* Formula collapse */}
            <div className="pt-2">
              <button
                onClick={() => setShowFormula(!showFormula)}
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showFormula ? 'Hide Formula Details' : 'View Scoring Formula'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFormula ? 'rotate-180' : ''}`} />
              </button>

              {showFormula && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 text-slate-300 animate-in fade-in duration-200">
                  <p className="font-mono text-brand-300">
                    Score = [ Σ (weight × credit) / Σ (weight) ] × 100
                  </p>
                  <p className="text-slate-400">
                    • <strong>Required skills:</strong> weight = 2.0 | <strong>Preferred skills:</strong> weight = 1.0
                  </p>
                  <p className="text-slate-400">
                    • <strong>Full Match:</strong> credit = 1.0 | <strong>Partial (Related Skill):</strong> credit = 0.5 | <strong>Missing:</strong> credit = 0.0
                  </p>
                </div>
              )}
            </div>

            {/* Mandatory Disclaimer */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
              <ShieldAlert className="w-4 h-4 text-amber-400/80 shrink-0" />
              <span>{analysis.disclaimer}</span>
            </div>
          </div>
        </div>

        {/* Skill Summary Quick Bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800 text-center">
          <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl">
            <span className="text-2xl font-bold text-emerald-400">
              {analysis.matched_skills.length}
            </span>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">Matched Skills</p>
          </div>
          <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
            <span className="text-2xl font-bold text-amber-400">
              {analysis.partial_skills.length}
            </span>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">Partial Credit</p>
          </div>
          <div className="bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
            <span className="text-2xl font-bold text-rose-400">
              {analysis.missing_skills.length}
            </span>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">Missing Gaps</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          All Skills Matrix ({analysis.matched_skills.length + analysis.partial_skills.length + analysis.missing_skills.length})
        </button>
        <button
          onClick={() => setActiveTab('gaps')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'gaps'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Skill Gap Cards ({analysis.gaps.length})
        </button>
        {plan && (
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'roadmap'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            4-Week Roadmap & Project
          </button>
        )}
      </div>

      {/* Tab 1: Skills Matrix */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Matched Skills */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-white text-base">
                Matched Skills ({analysis.matched_skills.length})
              </h4>
            </div>
            {analysis.matched_skills.length === 0 ? (
              <p className="text-xs text-slate-500">No exact matches found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {analysis.matched_skills.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 text-sm">{s.skill}</span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {s.weight === 2 ? 'Required' : 'Preferred'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      <span className="text-slate-500">Found: </span>
                      {s.evidence}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partial Credit Skills */}
          {analysis.partial_skills.length > 0 && (
            <div className="glass-panel p-5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white text-base">
                  Partial Credit Skills ({analysis.partial_skills.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {analysis.partial_skills.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-200 text-sm">{s.skill}</span>
                      <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                        +0.5 credit
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      <span className="text-slate-500">Related experience: </span>
                      {s.matched_by || s.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <h4 className="font-bold text-white text-base">
                Missing Required & Preferred Skills ({analysis.missing_skills.length})
              </h4>
            </div>
            {analysis.missing_skills.length === 0 ? (
              <p className="text-xs text-emerald-400">Incredible! Zero missing skills.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {analysis.missing_skills.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-200 text-sm">{s.skill}</span>
                      <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">
                        {s.weight === 2 ? 'Required' : 'Preferred'}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-400/80 italic">
                      {s.evidence}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Gap Details */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.gaps.map((gap, idx) => (
              <SkillGapCard key={idx} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Roadmap & Project */}
      {activeTab === 'roadmap' && plan && (
        <RoadmapTimeline plan={plan} />
      )}

      {/* Bottom CTA for Interview */}
      <div className="mt-10 p-6 glass-panel rounded-2xl border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-brand-950/40 via-slate-900/60 to-accent-950/40">
        <div>
          <h4 className="text-lg font-bold text-white">
            Ready to test your knowledge?
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Simulate a 5-question technical interview tailored to your resume gaps and this role.
          </p>
        </div>
        <button
          onClick={onStartInterview}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-105 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start Interview Practice Round</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
