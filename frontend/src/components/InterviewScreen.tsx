import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  ArrowLeft,
  Award,
} from 'lucide-react';
import type {
  AnalysisResult,
  InterviewFeedback,
  InterviewQuestion,
} from '../types';
import { submitInterviewAnswer } from '../api/client';
import { ErrorBanner } from './ErrorBanner';

interface InterviewScreenProps {
  questions: InterviewQuestion[];
  analysis: AnalysisResult;
  onBackToResults: () => void;
}

export const InterviewScreen: React.FC<InterviewScreenProps> = ({
  questions,
  analysis,
  onBackToResults,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [feedbackList, setFeedbackList] = useState<Record<number, InterviewFeedback>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentFeedback = feedbackList[currentQuestion?.id];

  const categoryBadge = {
    resume: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    technical: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    dsa: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    project: 'bg-accent-500/15 text-accent-300 border-accent-500/30',
    behavioral: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  }[currentQuestion?.category] || 'bg-slate-800 text-slate-300 border-slate-700';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const feedback = await submitInterviewAnswer({
        question: currentQuestion.question,
        category: currentQuestion.category,
        student_answer: studentAnswer.trim(),
        analysis,
      });

      setFeedbackList((prev) => ({
        ...prev,
        [currentQuestion.id]: feedback,
      }));
    } catch (err: any) {
      setError(err?.message || 'Failed to submit your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      const nextQ = questions[currentIndex + 1];
      if (feedbackList[nextQ.id]) {
        // If already answered, keep previous answer or clear
      } else {
        setStudentAnswer('');
      }
    }
  };

  const isCompletedAll = questions.length > 0 && Object.keys(feedbackList).length === questions.length;
  const averageScore =
    Object.values(feedbackList).reduce((sum, f) => sum + f.score, 0) /
    (Object.values(feedbackList).length || 1);

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800">
          <p className="text-slate-300">No interview questions loaded.</p>
          <button
            onClick={onBackToResults}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs"
          >
            Return to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <button
          onClick={onBackToResults}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Question Card */}
      <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800 mb-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${categoryBadge}`}
          >
            {currentQuestion.category} Question
          </span>
        </div>

        <h3 className="text-xl font-bold text-white leading-snug mb-3">
          {currentQuestion.question}
        </h3>

        {currentQuestion.context && (
          <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <strong className="text-slate-300">Why this is asked: </strong>
            {currentQuestion.context}
          </p>
        )}
      </div>

      {/* If feedback exists for current question, show feedback; else show answer input */}
      {currentFeedback ? (
        <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-brand-500/30 mb-6 space-y-6 animate-in fade-in duration-300">
          {/* Score & Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <h4 className="text-lg font-bold text-white">AI Coach Feedback</h4>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300 font-extrabold text-sm">
              <Award className="w-4 h-4" />
              <span>Score: {currentFeedback.score} / 10</span>
            </div>
          </div>

          {/* Strengths */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>What You Did Well</span>
            </h5>
            <ul className="space-y-1.5">
              {currentFeedback.strengths.map((str, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 flex items-start gap-2"
                >
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Areas For Improvement</span>
            </h5>
            <ul className="space-y-1.5">
              {currentFeedback.improvements.map((imp, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2"
                >
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improved Answer */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-brand-300 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-brand-400" />
              <span>Model Exemplar Answer</span>
            </h5>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 font-mono">
              {currentFeedback.improved_answer}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                // Allow re-answering
                setFeedbackList((prev) => {
                  const updated = { ...prev };
                  delete updated[currentQuestion.id];
                  return updated;
                });
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Redo Question</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onBackToResults}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish Practice Round</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Answer Input Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
              <label htmlFor="answer-input" className="font-semibold text-slate-200">
                Your Answer:
              </label>
              <span>Type your best response as you would in a real interview</span>
            </div>
            <textarea
              id="answer-input"
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              placeholder="Explain your approach, technical details, or reasoning clearly..."
              className="w-full min-h-[160px] bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>{studentAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>{studentAnswer.trim() ? '✓ Ready to submit' : 'Answer required'}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!studentAnswer.trim() || isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-lg ${
                studentAnswer.trim() && !isSubmitting
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-brand-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating with AI Coach...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Answer & Get Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Completion Summary if all answered */}
      {isCompletedAll && (
        <div className="mt-8 p-6 glass-panel rounded-2xl border border-emerald-500/40 text-center bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 animate-in zoom-in-95 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-extrabold text-white mb-1">
            Interview Round Complete!
          </h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto mb-4">
            You completed all 5 targeted practice questions. Average score:{' '}
            <strong className="text-emerald-400">{averageScore.toFixed(1)} / 10</strong>.
          </p>
          <button
            onClick={onBackToResults}
            className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Review Analysis & Roadmap
          </button>
        </div>
      )}
    </div>
  );
};
