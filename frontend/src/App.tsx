import React, { useState, useEffect } from 'react';
import { Zap, WifiOff, Sun, Moon } from 'lucide-react';
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

  // Remember the last analysis payload so the error banner's Retry can re-run it.
  const [lastPayload, setLastPayload] = useState<Parameters<typeof handleStartAnalysis>[0] | null>(null);

  const recheckHealth = () => {
    setBackendHealth('checking');
    checkHealth()
      .then(() => setBackendHealth('healthy'))
      .catch(() => setBackendHealth('unreachable'));
  };

  // Theme: initialize from the class the pre-mount script already applied.
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      try {
        localStorage.setItem('theme', next);
      } catch {
        /* storage may be unavailable; theme still applies for this session */
      }
      return next;
    });
  };

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
    recheckHealth();
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
    setLastPayload(payload);
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
      // err.message is already a friendly, mapped string from the API client.
      setErrorMessage(
        err?.message || 'Something went wrong. Please try again.'
      );
      // A network failure also means the health chip is stale — recheck it.
      if (err?.kind === 'network') recheckHealth();
      setScreen('input');
    }
  };

  const handleRetry = () => {
    if (lastPayload) handleStartAnalysis(lastPayload);
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={handleReset}
          >
            <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-white">
              <Zap className="w-4.5 h-4.5 fill-white" strokeWidth={0} />
            </div>
            <span className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 tracking-tight">
              HireReady <span className="text-accent-600 dark:text-accent-400">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Backend warning — shown ONLY when the health check fails */}
            {backendHealth === 'unreachable' && (
              <button
                onClick={recheckHealth}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[12px] font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
                title="Backend unreachable — click to recheck"
              >
                <WifiOff className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Backend offline — retry</span>
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5" strokeWidth={1.75} />
              ) : (
                <Moon className="w-4.5 h-4.5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {errorMessage && screen !== 'interview' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              onRetry={
                screen === 'input' && lastPayload ? handleRetry : undefined
              }
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
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-6 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">HireReady AI</span>
            {' · '}Deterministic scoring on AWS Bedrock (Nova Lite) + Strands Agents
          </span>
          <span>Scores are estimates from resume evidence, not hiring predictions.</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
