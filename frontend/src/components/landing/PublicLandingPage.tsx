import React from 'react';
import {
  Compass,
  ArrowRight,
  FileText,
  Target,
  Calendar,
  MessageSquareCode,
  Briefcase,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Cpu,
  ChevronRight,
  Award,
} from 'lucide-react';

interface PublicLandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onGetStarted,
  onSignIn,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. Sticky Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                CareerPilot <span className="text-indigo-400">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Career Intelligence
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#skill-gap" className="hover:text-white transition-colors">
              Skill Gap Analysis
            </a>
            <a href="#roadmap" className="hover:text-white transition-colors">
              Adaptive Roadmap
            </a>
            <a href="#interview" className="hover:text-white transition-colors">
              Mock Interview
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={onSignIn}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Career Intelligence &amp; Upskilling Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Target Your Next Role with{' '}
            <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Algorithmic Precision
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Extract resume evidence with PyMuPDF, benchmark against genuine job descriptions using Google Gemini,
            track persistent 4-week upskilling roadmaps, and practice with rubric-evaluated AI mock interviews.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Launch Demo Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>Explore Features</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </a>
          </div>

          {/* Product Preview Card */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-8 text-left backdrop-blur-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">careerpilot.ai / live-intelligence</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-indigo-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Backend Live &bull; SQLite Persisted</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Score */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Role Fit Analysis
                  </span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  88<span className="text-indigo-400 text-lg">/100</span>
                </div>
                <p className="text-xs text-slate-300">
                  Target: <strong>Senior Full-Stack Cloud Engineer</strong>. 8 demonstrated skills, 2 critical gaps identified.
                </p>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[88%] rounded-full" />
                </div>
              </div>

              {/* Card 2: 4-Week Roadmap */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Adaptive Roadmap
                  </span>
                  <Calendar className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xs text-indigo-300 font-semibold">
                  Week 1 &bull; Async Concurrency &amp; Redis
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center space-x-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Implement Redis caching layer</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <span className="w-3.5 h-3.5 rounded border border-slate-600 inline-block shrink-0" />
                    <span className="truncate">Benchmark async connection pooling</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  Deliverable: Benchmarked REST microservice
                </div>
              </div>

              {/* Card 3: AI Mock Interview */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Mock Interview Rubric
                  </span>
                  <MessageSquareCode className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xs font-semibold text-purple-300">
                  Standardized 100-Point Scoring
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                  <div>Technical: 25 pts</div>
                  <div>Relevance: 20 pts</div>
                  <div>Depth: 20 pts</div>
                  <div>Problem-Solving: 20 pts</div>
                  <div className="col-span-2">Communication: 15 pts</div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Evaluated with Gemini GenAI SDK
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities Section */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              End-to-End Career Architecture
            </h2>
            <h3 className="text-3xl font-bold text-white">
              Every Tool You Need to Land Your Target Role
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-slate-400">
              CareerPilot AI connects resume extraction, gap analysis, roadmap execution, and mock interview drilling into one unified workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Resume Intelligence &amp; PDF Extraction</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct text parsing using PyMuPDF. Strictly rejects scanned/empty PDFs, enforces a 5MB and 15-page limit, and parses candidate skills without hardcoded heuristics.
              </p>
            </div>

            {/* Feature 2 */}
            <div id="skill-gap" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Evidence-Based Skill-Gap Analysis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini classifies skills into demonstrated, partially demonstrated, and missing categories. Highlights prioritized gaps with real severity ratings and business impact.
              </p>
            </div>

            {/* Feature 3 */}
            <div id="roadmap" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Adaptive 4-Week Career Roadmap</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Task completion tracked persistently in SQLite. As you mark off tasks or complete mock interviews, Gemini adapts upcoming weeks while preserving completed achievements.
              </p>
            </div>

            {/* Feature 4 */}
            <div id="interview" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <MessageSquareCode className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">AI Mock Interview Engine</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates 5 tailored technical, practical, and behavioral questions. Evaluates your answers against an auditable 100-point rubric, providing actionable feedback and exemplar answers.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Job Application Tracker</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log and monitor applications across 6 pipeline stages (Saved, Applied, Assessment, Interview, Offer, Rejected) with notes, response dates, and SQLite persistence.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Application Intelligence &amp; Analytics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates real funnel conversion and track response rates from SQLite records. Includes clear sample size safeguards that advise you when tracking fewer than 5 applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-20 border-t border-slate-900 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Systematic Workflow
            </h2>
            <h3 className="text-3xl font-bold text-white">How CareerPilot AI Operates</h3>
            <p className="mt-3 text-xs sm:text-sm text-slate-400">
              Four concrete steps from raw resume upload to validated technical interview readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h4 className="text-sm font-bold text-white">Upload Resume &amp; Role</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your PDF resume and paste target job requirements. The backend validates file format and extracts clean text.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h4 className="text-sm font-bold text-white">AI Skill Gap Analysis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini inspects resume evidence against job requirements, calculating an estimated fit score and prioritized gaps.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h4 className="text-sm font-bold text-white">Execute 4-Week Roadmap</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Work through weekly tasks and deliverables. Check off items in SQLite and trigger adaptive plan adjustments as you progress.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h4 className="text-sm font-bold text-white">Drill Mock Interviews</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Answer 5 customized technical and scenario questions. Get scored across 5 rubric dimensions with missing point analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Final CTA Section */}
      <section className="py-20 border-t border-slate-900 bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Operational Career Intelligence</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Prepare for Your Target Role?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Access the candidate workspace to run resume analyses, track roadmap progress, and drill mock interviews without complicated setups.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Get Started (Demo Access)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSignIn}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>Sign In to Workspace</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">CareerPilot AI</span>
            <span>&bull;</span>
            <span>Local SaaS Demo Platform</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <span>FastAPI Backend</span>
            <span>&bull;</span>
            <span>React 19 &amp; TypeScript</span>
            <span>&bull;</span>
            <span>SQLite Persistence</span>
            <span>&bull;</span>
            <span>Google GenAI SDK</span>
          </div>

          <div className="text-[11px]">
            &copy; 2026 CareerPilot AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
