import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  Briefcase,
  Loader2,
  ArrowRight,
  Flag,
} from 'lucide-react';
import type { InterviewSessionDetail } from '../../types';
import { AnswerEvaluationCard } from './AnswerEvaluationCard';

interface InterviewWorkspaceProps {
  session: InterviewSessionDetail;
  onSubmitAnswer: (questionId: string, answer: string) => Promise<void>;
  onCompleteInterview: () => Promise<void>;
  onExit: () => void;
  submitting: boolean;
  completing: boolean;
  error: string | null;
}

export const InterviewWorkspace: React.FC<InterviewWorkspaceProps> = ({
  session,
  onSubmitAnswer,
  onCompleteInterview,
  onExit,
  submitting,
  completing,
  error,
}) => {
  // Find first unanswered question or default to 0
  const firstUnanswered = session.questions.findIndex((q) => !q.answer);
  const initialIndex = firstUnanswered !== -1 ? firstUnanswered : 0;
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [answerText, setAnswerText] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const currentQuestion = session.questions[currentIndex];
  const isAnswered = !!currentQuestion?.answer;
  const answeredCount = session.questions.filter((q) => !!q.answer).length;
  const allAnswered = answeredCount === session.questions.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const clean = answerText.trim();
    if (clean.length < 10) {
      setLocalError('Please provide a substantive answer (at least 10 characters) for accurate rubric evaluation.');
      return;
    }

    try {
      await onSubmitAnswer(currentQuestion.id, clean);
      setAnswerText('');
    } catch {
      // Error handled at parent state
    }
  };

  const handleNext = () => {
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswerText('');
      setLocalError(null);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'technical':
        return (
          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Technical
          </span>
        );
      case 'practical':
        return (
          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Practical Scenario
          </span>
        );
      case 'behavioral':
        return (
          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Behavioral
          </span>
        );
      default:
        return null;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onExit}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            &larr; Exit Workspace
          </button>
          <span className="text-slate-700">&bull;</span>
          <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-medium">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="truncate max-w-xs">{session.target_role}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400">
            Progress: <strong className="text-white">{answeredCount}/5</strong> Answered
          </span>

          {answeredCount > 0 && session.status !== 'completed' && (
            <button
              onClick={onCompleteInterview}
              disabled={completing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {completing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Finalizing...</span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>{allAnswered ? 'Complete Interview' : 'Finish Early'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Question Tracker Steps */}
      <div className="grid grid-cols-5 gap-2">
        {session.questions.map((q, idx) => {
          const isSelected = idx === currentIndex;
          const hasAnswer = !!q.answer;
          return (
            <button
              key={q.id}
              onClick={() => {
                setCurrentIndex(idx);
                setAnswerText('');
                setLocalError(null);
              }}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/50'
                  : hasAnswer
                  ? 'bg-slate-900 border-emerald-800/60 hover:border-emerald-600'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold mb-0.5">
                {hasAnswer ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : isSelected ? (
                  <Circle className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/40 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={isSelected ? 'text-white' : 'text-slate-300'}>
                  Q{idx + 1}
                </span>
              </div>
              <div className="text-[10px]">
                {hasAnswer ? (
                  <span className="font-bold text-emerald-400">{q.answer?.score}%</span>
                ) : (
                  <span className="text-slate-500 capitalize">{q.category}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Category & difficulty header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">
              QUESTION {currentIndex + 1} OF 5
            </span>
            <span>&bull;</span>
            {getCategoryBadge(currentQuestion.category)}
            {getDifficultyBadge(currentQuestion.difficulty)}
          </div>

          <div className="text-xs text-slate-400 flex items-center space-x-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Targeting your role requirements</span>
          </div>
        </div>

        {/* Question Prompt */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Evaluation Focus:</span>
            <p className="leading-relaxed">{currentQuestion.evaluation_criteria}</p>
          </div>
        </div>

        {/* If Already Answered: Show submitted answer */}
        {isAnswered && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Your Submitted Answer
              </span>
              <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {currentQuestion.answer?.user_answer}
              </p>
            </div>
          </div>
        )}

        {/* If Not Answered: Answer input form */}
        {!isAnswered && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Your Answer
                </label>
                <span className="text-xs text-slate-500">
                  {answerText.length} characters
                </span>
              </div>
              <textarea
                rows={7}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                disabled={submitting}
                placeholder="Type your response as you would in a real interview. Focus on technical precision, trade-offs, and practical execution..."
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 leading-relaxed font-sans"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 italic">
                * Note: Evaluated on technical accuracy (25), relevance (20), depth (20), problem solving (20), and clarity (15).
              </p>
            </div>

            {(localError || error) && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || answerText.trim().length === 0}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Answer with Gemini 100-Point Rubric...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer for Evaluation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Answer Evaluation Card if current question is answered */}
      {isAnswered && currentQuestion.answer && (
        <AnswerEvaluationCard
          answer={currentQuestion.answer}
          hasNext={currentIndex < session.questions.length - 1}
          onNext={handleNext}
          onFinish={onCompleteInterview}
        />
      )}
    </div>
  );
};
