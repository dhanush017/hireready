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
  Zap,
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
      // Remove data:application/pdf;base64, prefix
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      alert('Please provide a job description.');
      return;
    }

    if (resumeMode === 'upload') {
      if (!resumeBase64) {
        alert('Please upload a PDF resume or switch to paste text.');
        return;
      }
      onAnalyze({
        resume_base64: resumeBase64,
        job_description: jobDescription.trim(),
        pdfFileName: pdfFileName || 'Uploaded Resume.pdf',
      });
    } else {
      if (!resumeText.trim()) {
        alert('Please paste your resume text or upload a PDF.');
        return;
      }
      onAnalyze({
        resume_text: resumeText.trim(),
        job_description: jobDescription.trim(),
      });
    }
  };

  const isFormValid =
    (resumeMode === 'paste' ? resumeText.trim().length > 30 : !!resumeBase64) &&
    jobDescription.trim().length > 30;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5 text-brand-400" />
          <span>WeMakeDevs Hackathon · First Commit</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Your AI Placement <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-accent-500">Copilot</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Upload your resume and target internship JD. Get a transparent match score,
          uncover exact skill gaps with evidence, follow a 4-week roadmap, and ace interview prep.
        </p>

        {/* Demo trigger button */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleLoadDemo}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
              demoLoaded
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-brand-500/50 shadow-md'
            }`}
          >
            {demoLoaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Loaded B.Tech CSE Sample Demo!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Load Demo (B.Tech CSE vs SWE Intern)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Resume Input */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <h3 className="font-semibold text-slate-100 text-lg">1. Your Resume</h3>
              </div>
              
              {/* Tab Selector */}
              <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setResumeMode('paste')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    resumeMode === 'paste'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setResumeMode('upload')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    resumeMode === 'upload'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Upload PDF
                </button>
              </div>
            </div>

            {resumeMode === 'paste' ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your full resume text here (education, skills, projects, experience)..."
                  className="w-full flex-1 min-h-[320px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none font-mono leading-relaxed"
                />
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2 px-1">
                  <span>{resumeText.length} characters</span>
                  <span>{resumeText.trim() ? '✓ Ready' : 'Minimum 30 characters'}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
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
                  className={`min-h-[320px] border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-brand-400 bg-brand-500/10'
                      : resumeBase64
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'
                  }`}
                >
                  {resumeBase64 ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                        <FileCheck className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-300">
                          {pdfFileName || 'PDF Resume Selected'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Click to replace or drag in another file
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-lg">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          Drop your resume PDF here or <span className="text-brand-400 underline">browse</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Max file size: 2 MB · PDF format only
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {fileError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 mt-2.5 bg-red-950/40 p-2 rounded-lg border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Job Description */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent-500" />
                <h3 className="font-semibold text-slate-100 text-lg">2. Target Job Description</h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                Internship or Entry Role
              </span>
            </div>

            <div className="flex-1 flex flex-col">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the role title, required skills, preferred qualifications, and responsibilities..."
                className="w-full flex-1 min-h-[320px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none font-mono leading-relaxed"
              />
              <div className="flex justify-between items-center text-xs text-slate-500 mt-2 px-1">
                <span>{jobDescription.length} characters</span>
                <span>{jobDescription.trim() ? '✓ Ready' : 'Minimum 30 characters'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-xl ${
              isFormValid && !isLoading
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <span>Analyze Match & Gap Breakdown</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
