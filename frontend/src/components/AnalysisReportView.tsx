import React from 'react';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Printer,
  Sparkles,
  Quote,
} from 'lucide-react';
import type { AnalysisRecord } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { SkillAssessmentTable } from './SkillAssessmentTable';
import { RoadmapTimeline } from './RoadmapTimeline';
import { PortfolioProjects } from './PortfolioProjects';

interface AnalysisReportViewProps {
  record: AnalysisRecord;
  onNewAnalysis: () => void;
}

export const AnalysisReportView: React.FC<AnalysisReportViewProps> = ({
  record,
  onNewAnalysis,
}) => {
  const { report, target_role, created_at } = record;

  const handlePrint = () => {
    window.print();
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Medium Priority
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
            Low Priority
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onNewAnalysis}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Start New Analysis</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Analyzed on {new Date(created_at).toLocaleDateString()}</span>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Target Role & Profile Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/30 p-6 sm:p-8">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Briefcase className="w-4 h-4" />
          <span>Target Evaluation Role</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {target_role}
        </h2>
        <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Candidate Profile Summary
          </span>
          <p className="text-sm text-slate-200 leading-relaxed">
            {report.profile_summary}
          </p>
        </div>
      </div>

      {/* 1. Score Visualization */}
      <ScoreGauge score={report.overall_fit_score} rationale={report.score_rationale} />

      {/* 2. Key Strengths Supported by Resume Evidence */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>Verified Candidate Strengths</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Key capabilities directly evidenced by achievements and experiences in your resume
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.key_strengths.map((str, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <h4 className="text-sm font-semibold text-white">{str.title}</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {str.description}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium mb-1">
                  <Quote className="w-3 h-3 text-indigo-400" />
                  <span>Resume Citation</span>
                </div>
                <p className="text-slate-300 italic text-[11px]">
                  "{str.resume_evidence}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Skill Assessment Table */}
      <SkillAssessmentTable
        demonstrated={report.demonstrated_skills}
        partiallyDemonstrated={report.partially_demonstrated_skills}
        notEvidenced={report.skills_not_evidenced}
      />

      {/* 4. Prioritized Skill Gaps */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-amber-400" />
            <span>Prioritized Skill Gaps</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Specific areas to address to significantly elevate your interview readiness
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.prioritized_skill_gaps.map((gap, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">{gap.gap_name}</h4>
                {getSeverityBadge(gap.severity)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {gap.explanation}
              </p>
              <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200">
                <strong>Impact:</strong> {gap.impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Core Job Requirements & Practical Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requirements */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-base font-bold text-white">Target Job Requirements</h3>
          <ul className="space-y-2">
            {report.important_job_requirements.map((req, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Practical recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-base font-bold text-white">Actionable Next Steps</h3>
          <ul className="space-y-2">
            {report.practical_recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 6. Four-Week Upskilling Roadmap */}
      <RoadmapTimeline weeks={report.four_week_roadmap} analysisId={record.id} />

      {/* 7. Portfolio Projects */}
      <PortfolioProjects projects={report.portfolio_projects} />

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-center text-xs text-slate-400">
        <p>{report.disclaimer}</p>
      </div>
    </div>
  );
};
