import React, { useState, useEffect } from 'react';
import {
  Zap,
  Cloud,
  Cpu,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import type { AnalysisResult, PlanResult, InterviewQuestion } from './types';
import {
  analyzeResume,
  generatePlan,
  getInterviewQuestions,
  checkHealth,
} from './api/client';
import { InputScreen } from './components/InputScreen';
import { LoadingScreen } from './components/LoadingScreen';
import type { LoadingStep } from './components/LoadingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { InterviewScreen } from './components/InterviewScreen';
import { ErrorBanner } from './components/ErrorBanner';

type AppScreen = 'input' | 'loading' | 'results' | 'interview';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('input');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<'checking' | 'healthy' | 'unreachable'>('checking');

  // Loading steps state reflecting real ongoing calls
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    {
      id: 'extract',
      title: 'Validating & Extracting Inputs',
      description: 'Checking file constraints, extracting text from PDF/text format',
      status: 'pending',
    },
    {
      id: 'agents',
      title: 'Parallel Strands Agent Parsing',
      description: 'Resume Agent & Job Agent executing structured Bedrock inference',
      status: 'pending',
    },
    {
      id: 'scoring',
      title: 'Deterministic Match Scoring',
      description: 'Applying alias map, related-skills partial credit, and formula weights',
      status: 'pending',
    },
    {
      id: 'planning',
      title: 'Generating Roadmap & Capstone Project',
      description: 'Planner Agent constructing 4-week gap-closure curriculum and project',
      status: 'pending',
    },
  ]);

  // Check health on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendHealth('healthy'))
      .catch(() => setBackendHealth('unreachable'));
  }, []);

  const updateStepStatus = (
    id: string,
    status: 'pending' | 'in-progress' | 'completed'
  ) => {
    setLoadingSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const handleStartAnalysis = async (payload: {
    resume_text?: string;
    resume_base64?: string;
    job_description: string;
    pdfFileName?: string;
  }) => {
    setErrorMessage(null);
    setScreen('loading');

    // Reset steps
    setLoadingSteps((prev) =>
      prev.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'in-progress' : 'pending',
      }))
    );

    try {
      // Step 1: Extraction & validation
      updateStepStatus('extract', 'completed');
      updateStepStatus('agents', 'in-progress');

      // Call /api/analyze
      const analysisData = await analyzeResume({
        resume_text: payload.resume_text,
        resume_base64: payload.resume_base64,
        job_description: payload.job_description,
      });

      updateStepStatus('agents', 'completed');
      updateStepStatus('scoring', 'completed');
      updateStepStatus('planning', 'in-progress');

      setAnalysis(analysisData);

      // Step 2: Call /api/plan
      const planData = await generatePlan(analysisData);
      updateStepStatus('planning', 'completed');
      setPlan(planData);

      // Transition to results screen
      setTimeout(() => {
        setScreen('results');
      }, 400);
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Failed to complete analysis. Please ensure your backend is running and reachable.'
      );
      setScreen('input');
    }
  };

  const handleStartInterview = async () => {
    if (!analysis || !plan) return;

    if (questions.length > 0) {
      setScreen('interview');
      return;
    }

    setErrorMessage(null);

    try {
      const qResult = await getInterviewQuestions(analysis, plan);
      setQuestions(qResult.questions);
      setScreen('interview');
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Could not load interview questions. Please try again.'
      );
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setPlan(null);
    setQuestions([]);
    setErrorMessage(null);
    setScreen('input');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  HireReady <span className="text-brand-400">AI</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Your AI Placement Copilot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Health Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth === 'healthy'
                    ? 'bg-emerald-400 animate-pulse'
                    : backendHealth === 'checking'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-400">
                {backendHealth === 'healthy'
                  ? 'AWS Backend Connected'
                  : backendHealth === 'checking'
                  ? 'Connecting...'
                  : 'Backend Standby'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/20">
              <Brain className="w-3.5 h-3.5" />
              <span>Strands Agents</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {errorMessage && screen !== 'interview' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              onRetry={screen === 'input' ? undefined : handleReset}
            />
          </div>
        )}

        {screen === 'input' && (
          <InputScreen onAnalyze={handleStartAnalysis} isLoading={false} />
        )}

        {screen === 'loading' && (
          <LoadingScreen currentStepIndex={0} steps={loadingSteps} />
        )}

        {screen === 'results' && analysis && (
          <ResultsScreen
            analysis={analysis}
            plan={plan}
            onStartInterview={handleStartInterview}
            onReset={handleReset}
          />
        )}

        {screen === 'interview' && analysis && (
          <InterviewScreen
            questions={questions}
            analysis={analysis}
            onBackToResults={() => setScreen('results')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">HireReady AI</span>
            <span>·</span>
            <span>Built for WeMakeDevs "First Commit" Hackathon (Ship It track)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-brand-400" />
              AWS Lambda & Bedrock
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Amazon Nova Lite
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent-400" />
              Strands SDK
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
