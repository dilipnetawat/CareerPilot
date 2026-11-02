import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Briefcase,
  AlertCircle,
  Loader2,
  Key,
} from 'lucide-react';
import { ResumeUpload } from './ResumeUpload';

interface AnalysisFormProps {
  onSubmit: (file: File, targetRole: string, jobDescription: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ROLE_SUGGESTIONS = [
  'Senior Full-Stack Engineer',
  'Frontend Developer (React/TS)',
  'Backend Engineer (Python/FastAPI)',
  'AI / ML Engineer',
  'Cloud / DevOps Specialist',
];

const LOADING_STAGES = [
  'Extracting resume text via PyMuPDF...',
  'Evaluating qualifications against job description...',
  'Analyzing skills and gaps with Gemini AI...',
  'Synthesizing personalized 4-week roadmap & projects...',
];

export const AnalysisForm: React.FC<AnalysisFormProps> = ({
  onSubmit,
  loading,
  error,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [stageIndex, setStageIndex] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  // Cycle through loading stage messages to give user real-time feedback
  useEffect(() => {
    if (!loading) {
      setStageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!file) {
      setLocalError('Please upload your resume in PDF format.');
      return;
    }

    if (!targetRole.trim() || targetRole.trim().length < 2) {
      setLocalError('Please enter a target job role.');
      return;
    }

    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setLocalError('Please paste a job description (at least 20 characters) for accurate skill matching.');
      return;
    }

    try {
      await onSubmit(file, targetRole.trim(), jobDescription.trim());
    } catch {
      // Error handled at parent state
    }
  };

  const isKeyError = error && error.toLowerCase().includes('gemini api key');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Intro Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/30 p-8 text-center relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Core AI Career Intelligence</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Evaluate Your Fit. Bridge Your Gaps.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Upload your PDF resume and target job description. CareerPilot AI extracts your experience,
          identifies critical skill gaps, and generates a personalized 4-week upskilling roadmap.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Step 1: Upload Resume */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2 flex items-center space-x-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold">1</span>
            <span>Upload Resume (PDF)</span>
          </label>
          <ResumeUpload
            file={file}
            onFileSelect={setFile}
            disabled={loading}
          />
        </div>

        {/* Step 2: Target Role */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2 flex items-center space-x-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold">2</span>
            <span>Target Job Role</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Briefcase className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={loading}
              placeholder="e.g. Senior Full-Stack Engineer, AI Engineer, Cloud Architect..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Quick role suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-slate-500">Quick fill:</span>
            {ROLE_SUGGESTIONS.map((role) => (
              <button
                key={role}
                type="button"
                disabled={loading}
                onClick={() => setTargetRole(role)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Job Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-white flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold">3</span>
              <span>Paste Job Description</span>
            </label>
            <span className="text-xs text-slate-500">
              {jobDescription.length} characters
            </span>
          </div>
          <div className="relative">
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={loading}
              placeholder="Paste the genuine job requirements, responsibilities, and qualifications from the target job posting..."
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 leading-relaxed"
            />
          </div>
        </div>

        {/* Error Banners */}
        {(localError || error) && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Analysis Notice</span>
              <p className="text-xs text-rose-300 leading-relaxed">
                {localError || error}
              </p>
              {isKeyError && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                  <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white block">To configure your Gemini API Key:</span>
                    <p className="text-slate-400 mt-0.5">
                      Open <code className="text-indigo-400 font-mono">backend/.env</code> and set:
                    </p>
                    <code className="text-emerald-400 font-mono text-[11px] block mt-1">
                      GEMINI_API_KEY="your-google-ai-studio-api-key"
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Progress State */}
        {loading && (
          <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-800/50 space-y-3">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <span className="text-sm font-semibold text-white">
                {LOADING_STAGES[stageIndex]}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${((stageIndex + 1) / LOADING_STAGES.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Gemini is validating your resume text against role requirements and generating structured recommendations.
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all cursor-pointer flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Career Fit...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze My Career Fit</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
