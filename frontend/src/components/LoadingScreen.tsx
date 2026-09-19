import React from 'react';
import { CheckCircle2, Circle, Loader2, Sparkles, Brain, Cpu, ShieldCheck } from 'lucide-react';

export interface LoadingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface LoadingScreenProps {
  currentStepIndex: number;
  steps: LoadingStep[];
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ steps }) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Analyzing Your Placement Readiness
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by AWS Bedrock & Strands Agents
            </p>
          </div>
        </div>

        <div className="space-y-4 my-8">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in-progress';
            const isPending = step.status === 'pending';

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
                  isInProgress
                    ? 'bg-brand-950/40 border-brand-500/40 shadow-lg shadow-brand-500/5'
                    : isCompleted
                    ? 'bg-slate-900/40 border-slate-800 text-slate-300'
                    : 'bg-slate-950/20 border-slate-900 text-slate-600 opacity-60'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in-50 duration-200" />
                  )}
                  {isInProgress && (
                    <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                  )}
                  {isPending && (
                    <Circle className="w-5 h-5 text-slate-700" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-semibold ${
                        isInProgress
                          ? 'text-brand-300'
                          : isCompleted
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      Step {idx + 1}: {step.title}
                    </h4>
                    {isInProgress && (
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse">
                        Processing
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fact banner */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Scoring Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-400" />
            <span>Parallel LLM Extraction</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-500" />
            <span>Evidence-Based Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
};
