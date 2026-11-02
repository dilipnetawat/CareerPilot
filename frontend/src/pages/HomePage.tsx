import React from 'react';
import { AnalysisForm } from '../components/AnalysisForm';
import { AnalysisReportView } from '../components/AnalysisReportView';
import { StatusCard } from '../components/StatusCard';
import { InterviewSetup } from '../components/interview/InterviewSetup';
import { InterviewWorkspace } from '../components/interview/InterviewWorkspace';
import { InterviewFinalReport } from '../components/interview/InterviewFinalReport';
import { InterviewHistoryList } from '../components/interview/InterviewHistoryList';
import { ApplicationTracker } from '../components/applications/ApplicationTracker';
import { ApplicationIntelligenceView } from '../components/applications/ApplicationIntelligenceView';
import { OverviewView } from '../components/dashboard/OverviewView';
import { LearningProgressView } from '../components/dashboard/LearningProgressView';
import { RoadmapTimeline } from '../components/RoadmapTimeline';
import { Calendar, FileText } from 'lucide-react';
import type {
  AnalysisRecord,
  AnalysisListItem,
  HealthStatus,
  InterviewSessionDetail,
  InterviewSessionListItem,
  AppView,
} from '../types';

interface HomePageProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  // Analysis props
  activeRecord: AnalysisRecord | null;
  analyses: AnalysisListItem[];
  onAnalyze: (file: File, targetRole: string, jobDescription: string) => Promise<void>;
  onSelectAnalysis: (id: string) => void;
  isAnalyzing: boolean;
  analysisError: string | null;
  // Interview props
  activeInterview: InterviewSessionDetail | null;
  interviewSessions: InterviewSessionListItem[];
  onStartInterview: (analysisId: string) => Promise<void>;
  onSubmitAnswer: (questionId: string, answer: string) => Promise<void>;
  onCompleteInterview: () => Promise<void>;
  onSelectInterviewSession: (sessionId: string) => Promise<void>;
  isStartingInterview: boolean;
  isSubmittingAnswer: boolean;
  isCompletingInterview: boolean;
  interviewError: string | null;
  // Health props
  health: HealthStatus | null;
  healthLoading: boolean;
  healthError: string | null;
  onRefreshHealth: () => void;
  candidateName: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentView,
  onSelectView,
  activeRecord,
  analyses,
  onAnalyze,
  onSelectAnalysis,
  isAnalyzing,
  analysisError,
  activeInterview,
  interviewSessions,
  onStartInterview,
  onSubmitAnswer,
  onCompleteInterview,
  onSelectInterviewSession,
  isStartingInterview,
  isSubmittingAnswer,
  isCompletingInterview,
  interviewError,
  health,
  healthLoading,
  healthError,
  onRefreshHealth,
  candidateName,
}) => {
  // 1. Overview Cockpit
  if (currentView === 'overview') {
    return (
      <OverviewView
        candidateName={candidateName}
        activeRecord={activeRecord}
        analyses={analyses}
        interviews={interviewSessions}
        onSelectView={onSelectView}
        onSelectAnalysis={onSelectAnalysis}
        onSelectInterview={onSelectInterviewSession}
      />
    );
  }

  // 2. Report View
  if (currentView === 'report' && activeRecord) {
    return (
      <AnalysisReportView
        record={activeRecord}
        onNewAnalysis={() => onSelectView('analysis')}
      />
    );
  }

  // 3. Career Roadmap Direct View
  if (currentView === 'roadmap') {
    if (activeRecord) {
      return (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2.5">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <span>4-Week Career Upskilling Roadmap</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active plan for: <strong className="text-white">{activeRecord.target_role}</strong>. Tasks and completion timestamps persist across sessions in SQLite.
            </p>
          </div>
          <RoadmapTimeline
            weeks={activeRecord.report.four_week_roadmap}
            analysisId={activeRecord.id}
          />
        </div>
      );
    }

    if (analyses.length > 0) {
      return (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-xl mx-auto">
          <Calendar className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Select a Saved Career Analysis</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose an existing analysis report to view its personalized 4-week roadmap and track completion in SQLite.
          </p>
          <div className="space-y-2 pt-2 text-left">
            {analyses.slice(0, 3).map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectAnalysis(a.id)}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-xs text-white flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>{a.target_role}</span>
                <span className="text-emerald-400 font-bold">{a.fit_score}%</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto">
        <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-white">No Roadmap Generated</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Upload your resume and paste a target job description to generate your tailored 4-week learning roadmap.
        </p>
        <button
          onClick={() => onSelectView('analysis')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
        >
          Start Resume Analysis
        </button>
      </div>
    );
  }

  // 4. Learning Progress View
  if (currentView === 'progress') {
    return (
      <LearningProgressView
        activeRecord={activeRecord}
        analyses={analyses}
        onSelectAnalysis={onSelectAnalysis}
        onSelectView={onSelectView}
      />
    );
  }

  // 5. AI Mock Interview Workspace (Question by Question)
  if (currentView === 'interview_workspace' && activeInterview) {
    return (
      <InterviewWorkspace
        session={activeInterview}
        onSubmitAnswer={onSubmitAnswer}
        onCompleteInterview={onCompleteInterview}
        onExit={() => onSelectView('interview_history')}
        submitting={isSubmittingAnswer}
        completing={isCompletingInterview}
        error={interviewError}
      />
    );
  }

  // 6. Interview Final Report
  if (currentView === 'interview_report' && activeInterview) {
    return (
      <InterviewFinalReport
        session={activeInterview}
        onReviewQuestions={() => onSelectView('interview_workspace')}
        onNewInterview={() => onSelectView('interview_setup')}
        onViewHistory={() => onSelectView('interview_history')}
      />
    );
  }

  // 7. Interview Setup
  if (currentView === 'interview_setup') {
    return (
      <InterviewSetup
        analyses={analyses}
        onStart={onStartInterview}
        onViewHistory={() => onSelectView('interview_history')}
        loading={isStartingInterview}
        error={interviewError}
      />
    );
  }

  // 8. Interview History List
  if (currentView === 'interview_history') {
    return (
      <InterviewHistoryList
        sessions={interviewSessions}
        onSelectSession={onSelectInterviewSession}
        onNewInterview={() => onSelectView('interview_setup')}
        loading={false}
      />
    );
  }

  // 9. Job Applications Tracker
  if (currentView === 'applications') {
    return (
      <ApplicationTracker
        onNavigateToAnalytics={() => onSelectView('applications_analytics')}
      />
    );
  }

  // 10. Job Application Intelligence & Funnel Analytics
  if (currentView === 'applications_analytics') {
    return (
      <ApplicationIntelligenceView
        onNavigateToTracker={() => onSelectView('applications')}
      />
    );
  }

  // 11. Diagnostics & Status View
  if (currentView === 'status') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-white">System Diagnostics &amp; Status</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verification of local FastAPI service, SQLite persistence layer, and Gemini API integration.
          </p>
        </div>

        <StatusCard
          health={health}
          loading={healthLoading}
          error={healthError}
          onRefresh={onRefreshHealth}
        />
      </div>
    );
  }

  // 12. Default view: Resume Analysis Form
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2.5">
          <FileText className="w-6 h-6 text-indigo-400" />
          <span>Resume &amp; Skill-Gap Analysis</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload your PDF resume and target job requirements to generate an evidence-backed career fit report.
        </p>
      </div>

      <AnalysisForm
        onSubmit={onAnalyze}
        loading={isAnalyzing}
        error={analysisError}
      />
    </div>
  );
};
