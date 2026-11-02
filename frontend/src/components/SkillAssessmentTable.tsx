import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  FileCheck,
  Info,
} from 'lucide-react';
import type { SkillAssessmentItem, SkillStatus } from '../types';

interface SkillAssessmentTableProps {
  demonstrated: SkillAssessmentItem[];
  partiallyDemonstrated: SkillAssessmentItem[];
  notEvidenced: SkillAssessmentItem[];
}

export const SkillAssessmentTable: React.FC<SkillAssessmentTableProps> = ({
  demonstrated,
  partiallyDemonstrated,
  notEvidenced,
}) => {
  const [filter, setFilter] = useState<'all' | SkillStatus>('all');

  const allSkills: SkillAssessmentItem[] = [
    ...demonstrated,
    ...partiallyDemonstrated,
    ...notEvidenced,
  ];

  const filteredSkills = allSkills.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status: SkillStatus) => {
    switch (status) {
      case 'demonstrated':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Demonstrated</span>
          </span>
        );
      case 'partially_demonstrated':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Partially Demonstrated</span>
          </span>
        );
      case 'not_evidenced':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 border border-slate-600 text-slate-300">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Not Evidenced in Resume</span>
          </span>
        );
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'critical':
        return (
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Critical
          </span>
        );
      case 'important':
        return (
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Important
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Nice to Have
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Target Skill Alignment</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Breakdown of key role skills compared against verified resume text
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({allSkills.length})
          </button>
          <button
            onClick={() => setFilter('demonstrated')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'demonstrated'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Demonstrated ({demonstrated.length})
          </button>
          <button
            onClick={() => setFilter('partially_demonstrated')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'partially_demonstrated'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Partial ({partiallyDemonstrated.length})
          </button>
          <button
            onClick={() => setFilter('not_evidenced')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'not_evidenced'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Not Evidenced ({notEvidenced.length})
          </button>
        </div>
      </div>

      {/* Clarification banner */}
      <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Important distinction:</strong> Skills categorized under{' '}
          <em className="text-indigo-300">"Not Evidenced in Resume"</em> were simply omitted or not clearly mentioned in your
          uploaded resume document. This does <strong>not</strong> assume that you lack this skill in real life.
        </p>
      </div>

      {/* Skills list cards */}
      <div className="space-y-3">
        {filteredSkills.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            No skills found for this filter.
          </div>
        ) : (
          filteredSkills.map((item, idx) => (
            <div
              key={`${item.skill_name}-${idx}`}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/60">
                <div className="flex items-center space-x-2.5">
                  <h4 className="text-sm font-semibold text-white tracking-wide">
                    {item.skill_name}
                  </h4>
                  {getImportanceBadge(item.importance)}
                </div>
                <div>{getStatusBadge(item.status)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2">
                {/* Supporting evidence */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/70">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-medium mb-1">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Resume Evidence</span>
                  </div>
                  <p className="text-slate-300 italic">
                    "{item.supporting_evidence || 'Not evidenced in resume text.'}"
                  </p>
                </div>

                {/* Recommended improvement */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/70">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-medium mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Improvement Advice</span>
                  </div>
                  <p className="text-slate-300">
                    {item.recommended_improvement}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
