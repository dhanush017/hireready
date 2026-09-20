import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ArrowRight,
  Check,
  AlertTriangle,
  FileCheck,
  Briefcase,
} from 'lucide-react';
import { DEMO_RESUME, DEMO_JOB_DESCRIPTION } from '../data/demo';

interface InputScreenProps {
  onAnalyze: (payload: {
    resume_text?: string;
    resume_base64?: string;
    job_description: string;
    pdfFileName?: string;
  }) => void;
  isLoading: boolean;
}

const MIN_CHARS = 30;

export const InputScreen: React.FC<InputScreenProps> = ({
  onAnalyze,
  isLoading,
}) => {
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste'>('paste');
  const [resumeText, setResumeText] = useState('');
  const [resumeBase64, setResumeBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

  const handleFileUpload = (file: File) => {
    setFileError(null);
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are supported. Please upload a PDF resume.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File exceeds 2 MB limit. Please upload a smaller PDF or paste text.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.split(',')[1] || result;
      setResumeBase64(base64Content);
      setPdfFileName(file.name);
      setResumeMode('upload');
    };
    reader.onerror = () => {
      setFileError('Failed to read the file. Please try again or paste the text.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDemo = () => {
    setResumeMode('paste');
    setResumeText(DEMO_RESUME);
    setResumeBase64(null);
    setPdfFileName(null);
    setJobDescription(DEMO_JOB_DESCRIPTION);
    setFileError(null);
    setDemoLoaded(true);
    setTimeout(() => setDemoLoaded(false), 2500);
  };

  const resumeReady =
    resumeMode === 'paste' ? resumeText.trim().length >= MIN_CHARS : !!resumeBase64;
  const jdReady = jobDescription.trim().length >= MIN_CHARS;
  const isFormValid = resumeReady && jdReady;

  // Helper text explaining what's still needed when the button is disabled.
  const disabledReason = (() => {
    if (isFormValid) return null;
    const missing: string[] = [];
    if (!resumeReady)
      missing.push(
        resumeMode === 'upload' ? 'upload a PDF resume' : `add your resume (min ${MIN_CHARS} characters)`
      );
    if (!jdReady) missing.push(`add a job description (min ${MIN_CHARS} characters)`);
    return `To continue, ${missing.join(' and ')}.`;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (resumeMode === 'upload') {
      onAnalyze({
        resume_base64: resumeBase64!,
        job_description: jobDescription.trim(),
        pdfFileName: pdfFileName || 'Uploaded Resume.pdf',
      });
    } else {
      onAnalyze({
        resume_text: resumeText.trim(),
        job_description: jobDescription.trim(),
      });
    }
  };

  const textareaClass =
    'w-full flex-1 min-h-[220px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 resize-y leading-relaxed transition-colors';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Compact, left-aligned hero */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
          Your AI Placement <span className="text-accent-600 dark:text-accent-400">Copilot</span>
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base mt-3 max-w-2xl leading-relaxed">
          Add your resume and a target job description to get a transparent match score,
          evidence-backed skill gaps, a 4-week roadmap, and interview practice.
        </p>

        <button
          type="button"
          onClick={handleLoadDemo}
          className={`mt-5 inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
            demoLoaded
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
          }`}
        >
          {demoLoaded ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              <span>Demo loaded — B.Tech CSE sample</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-accent-600 dark:text-accent-400" strokeWidth={2} />
              <span>Load demo (B.Tech CSE vs SWE Intern)</span>
            </>
          )}
        </button>
      </div>

      {/* Single card containing BOTH inputs + the primary action */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
          {/* Section 1: Resume */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-accent-600 dark:text-accent-400" strokeWidth={1.75} />
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Your résumé</h2>
              </div>
              <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setResumeMode('paste')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    resumeMode === 'paste'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Paste text
                </button>
                <button
                  type="button"
                  onClick={() => setResumeMode('upload')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    resumeMode === 'upload'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Upload PDF
                </button>
              </div>
            </div>

            {resumeMode === 'paste' ? (
              <div className="flex flex-col">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your full résumé text here — education, skills, projects, experience..."
                  className={textareaClass}
                />
                <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                  <span className="tabular-nums">{resumeText.length} characters</span>
                  <span>{resumeReady ? '✓ Ready' : `Minimum ${MIN_CHARS} characters`}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept="application/pdf"
                  className="hidden"
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`min-h-[220px] border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30'
                      : resumeBase64
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-950/50'
                  }`}
                >
                  {resumeBase64 ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <FileCheck className="w-6 h-6" strokeWidth={1.75} />
                      </div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {pdfFileName || 'PDF résumé selected'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Click to replace or drag in another file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-accent-50 dark:bg-accent-950/40 flex items-center justify-center text-accent-600 dark:text-accent-400">
                        <UploadCloud className="w-6 h-6" strokeWidth={1.75} />
                      </div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Drop your résumé PDF here or{' '}
                        <span className="text-accent-600 dark:text-accent-400 underline">browse</span>
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Max 2 MB · PDF only</p>
                    </div>
                  )}
                </div>
                {fileError && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 mt-2 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Job description */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4.5 h-4.5 text-accent-600 dark:text-accent-400" strokeWidth={1.75} />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Target job description</h2>
            </div>
            <div className="flex flex-col">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the role title, required skills, preferred qualifications, and responsibilities..."
                className={textareaClass}
              />
              <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                <span className="tabular-nums">{jobDescription.length} characters</span>
                <span>{jdReady ? '✓ Ready' : `Minimum ${MIN_CHARS} characters`}</span>
              </div>
            </div>
          </div>

          {/* Primary action — inside the card, with helper text when disabled */}
          <div className="p-5 sm:p-6 bg-zinc-50/60 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 order-2 sm:order-1" aria-live="polite">
              {disabledReason ?? 'Ready to analyze your match.'}
            </p>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`order-1 sm:order-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
                isFormValid && !isLoading
                  ? 'bg-accent-600 text-white hover:bg-accent-700 cursor-pointer shadow-sm'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              <span>Analyze match &amp; gaps</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
