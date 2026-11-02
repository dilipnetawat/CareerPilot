import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Code2,
  ChevronDown,
  ChevronUp,
  Award,
  Info,
} from 'lucide-react';
import type { InterviewAnswer } from '../../types';

interface AnswerEvaluationCardProps {
  answer: InterviewAnswer;
  onNext?: () => void;
  hasNext: boolean;
  onFinish?: () => void;
}

export const AnswerEvaluationCard: React.FC<AnswerEvaluationCardProps> = ({
  answer,
  onNext,
  hasNext,
  onFinish,
}) => {
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
      {/* Header & Total Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              AI Rubric Evaluation
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              100-Point Scale
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Answer Feedback &amp; Score</h3>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center space-x-2 ${getScoreColor(answer.score)}`}>
            <Award className="w-5 h-5" />
            <span className="text-2xl font-black">{answer.score}</span>
            <span className="text-xs font-medium opacity-80">/100</span>
          </div>
        </div>
      </div>

      {/* 5-Dimensional Rubric Breakdown */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Evaluation Rubric Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Technical Accuracy */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Tech Accuracy</span>
              <span className="font-bold text-white">{answer.technical_accuracy}/25</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${(answer.technical_accuracy / 25) * 100}%` }}
              />
            </div>
          </div>

          {/* Relevance */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Relevance</span>
              <span className="font-bold text-white">{answer.relevance}/20</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full"
                style={{ width: `${(answer.relevance / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* Depth of Explanation */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Depth</span>
              <span className="font-bold text-white">{answer.depth_of_explanation}/20</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full"
                style={{ width: `${(answer.depth_of_explanation / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* Problem Solving */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Problem Solving</span>
              <span className="font-bold text-white">{answer.problem_solving}/20</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${(answer.problem_solving / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* Communication Clarity */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Clarity</span>
              <span className="font-bold text-white">{answer.communication_clarity}/15</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${(answer.communication_clarity / 15) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Missing Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What was done well */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>What Was Done Well</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {answer.what_was_done_well}
          </p>
        </div>

        {/* Missing points */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Missing Points &amp; Blindspots</span>
          </div>
          <ul className="space-y-1">
            {answer.missing_points.map((pt, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start space-x-1.5">
                <span className="text-amber-400 font-bold">&bull;</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Incorrect Reasoning if present */}
      {answer.incorrect_reasoning && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-xs text-rose-200 space-y-1">
          <span className="font-bold flex items-center space-x-1.5 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Flawed Premises or Technical Inaccuracies</span>
          </span>
          <p className="text-slate-300 leading-relaxed">
            {answer.incorrect_reasoning}
          </p>
        </div>
      )}

      {/* Actionable Improvement Suggestions */}
      {answer.improvement_suggestions.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
            <Lightbulb className="w-4 h-4" />
            <span>Targeted Improvement Suggestions</span>
          </div>
          <ul className="space-y-1.5">
            {answer.improvement_suggestions.map((sug, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stronger Answer Example (Accordion) */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowModelAnswer(!showModelAnswer)}
          className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Exemplar Answer (How a Senior Candidate Answers)</span>
          </div>
          {showModelAnswer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showModelAnswer && (
          <div className="p-4 pt-0 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/90 whitespace-pre-line">
            {answer.stronger_answer_example}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>{answer.disclaimer}</span>
        </div>

        <div className="flex items-center space-x-3">
          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Next Question &rarr;
            </button>
          )}

          {(!hasNext || onFinish) && onFinish && (
            <button
              onClick={onFinish}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/30"
            >
              Finalize Interview &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
