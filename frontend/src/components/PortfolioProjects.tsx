import React from 'react';
import { FolderGit2, CheckCircle, Tag } from 'lucide-react';
import type { PortfolioProject, ProjectDifficulty } from '../types';

interface PortfolioProjectsProps {
  projects: PortfolioProject[];
}

export const PortfolioProjects: React.FC<PortfolioProjectsProps> = ({ projects }) => {
  const getDifficultyBadge = (difficulty: ProjectDifficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Beginner
          </span>
        );
      case 'Intermediate':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Intermediate
          </span>
        );
      case 'Advanced':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Advanced
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <FolderGit2 className="w-5 h-5 text-indigo-400" />
          <span>Recommended Portfolio Projects</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Hands-on projects designed to demonstrate mastery over your identified skill gaps
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {projects.map((proj, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between p-5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white leading-snug">
                  {proj.title}
                </h4>
                {getDifficultyBadge(proj.difficulty)}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {proj.description}
              </p>

              {/* Skills targeted */}
              <div className="mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Targeted Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {proj.skills_targeted.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      <Tag className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested deliverables */}
            <div className="pt-3 border-t border-slate-800 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Suggested Deliverables
              </span>
              <ul className="space-y-1">
                {proj.suggested_deliverables.map((item, dIdx) => (
                  <li key={dIdx} className="flex items-start space-x-1.5 text-slate-400 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
