import { useState, useEffect, useCallback } from 'react';
import { useHealthCheck } from './hooks/useHealthCheck';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { PublicLandingPage } from './components/landing/PublicLandingPage';
import { LoginView } from './components/auth/LoginView';
import {
  getAuthToken,
  clearAuthSession,
  fetchMe,
  analyzeCareerFit,
  fetchAnalysisById,
  fetchRecentAnalyses,
  startInterview,
  fetchInterviews,
  fetchInterviewById,
  submitInterviewAnswer,
  completeInterview,
} from './services/api';
import type {
  AnalysisRecord,
  AnalysisListItem,
  InterviewSessionDetail,
  InterviewSessionListItem,
  AppView,
  UserProfile,
} from './types';

export function App() {
  const {
    data: health,
    loading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useHealthCheck(20000);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const raw = localStorage.getItem('careerpilot_user_profile');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const hasToken = !!getAuthToken();
    return hasToken ? 'overview' : 'landing';
  });
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'signup'>('login');

  const [activeRecord, setActiveRecord] = useState<AnalysisRecord | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisListItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Mock Interview State
  const [activeInterview, setActiveInterview] = useState<InterviewSessionDetail | null>(null);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSessionListItem[]>([]);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isCompletingInterview, setIsCompletingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // Verify session on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchMe()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          clearAuthSession();
          setCurrentUser(null);
          setCurrentView('landing');
        });
    }
  }, []);

  const loadAnalyses = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const items = await fetchRecentAnalyses();
      setRecentAnalyses(items);
      if (items.length > 0 && !activeRecord) {
        try {
          const firstRecord = await fetchAnalysisById(items[0].id);
          setActiveRecord(firstRecord);
        } catch {
          // Non-blocking
        }
      }
    } catch {
      // Handled silently
    }
  }, [activeRecord]);

  const loadInterviews = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const sessions = await fetchInterviews();
      setInterviewSessions(sessions);
    } catch {
      // Handled silently
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAnalyses();
      loadInterviews();
    }
  }, [currentUser, loadAnalyses, loadInterviews]);

  // Auth Handlers
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentView('overview');
  };

  const handleGetStarted = () => {
    setAuthInitialTab('signup');
    setCurrentView('login');
  };

  const handleSignIn = () => {
    setAuthInitialTab('login');
    setCurrentView('login');
  };

  const handleSignOut = () => {
    clearAuthSession();
    setCurrentUser(null);
    setActiveRecord(null);
    setActiveInterview(null);
    setRecentAnalyses([]);
    setInterviewSessions([]);
    setCurrentView('landing');
  };

  // Career Fit Analysis Handler
  const handleAnalyze = async (
    file: File,
    targetRole: string,
    jobDescription: string
  ) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const record = await analyzeCareerFit(file, targetRole, jobDescription);
      setActiveRecord(record);
      setCurrentView('report');
      await loadAnalyses();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An error occurred during analysis.';
      setAnalysisError(message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectAnalysis = async (id: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const record = await fetchAnalysisById(id);
      setActiveRecord(record);
      setCurrentView('report');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Failed to load analysis with ID ${id}.`;
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mock Interview Handlers
  const handleStartInterview = async (analysisId: string) => {
    setIsStartingInterview(true);
    setInterviewError(null);

    try {
      const session = await startInterview(analysisId);
      setActiveInterview(session);
      setCurrentView('interview_workspace');
      await loadInterviews();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to start interview session.';
      setInterviewError(message);
    } finally {
      setIsStartingInterview(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string, answer: string) => {
    if (!activeInterview) return;
    setIsSubmittingAnswer(true);
    setInterviewError(null);

    try {
      const updatedQuestion = await submitInterviewAnswer(
        activeInterview.id,
        questionId,
        answer
      );
      setActiveInterview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId ? updatedQuestion : q
          ),
        };
      });
      await loadInterviews();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to evaluate answer.';
      setInterviewError(message);
      throw err;
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!activeInterview) return;
    setIsCompletingInterview(true);
    setInterviewError(null);

    try {
      const finalized = await completeInterview(activeInterview.id);
      setActiveInterview(finalized);
      setCurrentView('interview_report');
      await loadInterviews();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to finalize interview.';
      setInterviewError(message);
    } finally {
      setIsCompletingInterview(false);
    }
  };

  const handleSelectInterviewSession = async (sessionId: string) => {
    setInterviewError(null);

    try {
      const session = await fetchInterviewById(sessionId);
      setActiveInterview(session);
      if (session.status === 'completed') {
        setCurrentView('interview_report');
      } else {
        setCurrentView('interview_workspace');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Failed to load interview session ${sessionId}.`;
      setInterviewError(message);
    }
  };

  // 1. Public Landing Page View (Default entry point)
  if (currentView === 'landing') {
    return (
      <PublicLandingPage
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
      />
    );
  }

  // 2. Personal Account Authentication View (Signup & Signin)
  if (currentView === 'login') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setCurrentView('landing')}
        initialTab={authInitialTab}
      />
    );
  }

  // 3. Authenticated Dashboard Workspace
  return (
    <Layout
      currentView={currentView}
      onSelectView={setCurrentView}
      recentAnalyses={recentAnalyses}
      selectedAnalysisId={activeRecord?.id || null}
      onSelectAnalysis={handleSelectAnalysis}
      recentInterviews={interviewSessions}
      selectedInterviewId={activeInterview?.id || null}
      onSelectInterview={handleSelectInterviewSession}
      health={health}
      loading={healthLoading}
      error={healthError}
      candidateName={currentUser?.full_name || 'Candidate'}
      onSignOut={handleSignOut}
    >
      <HomePage
        currentView={currentView}
        onSelectView={setCurrentView}
        activeRecord={activeRecord}
        analyses={recentAnalyses}
        onAnalyze={handleAnalyze}
        onSelectAnalysis={handleSelectAnalysis}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        activeInterview={activeInterview}
        interviewSessions={interviewSessions}
        onStartInterview={handleStartInterview}
        onSubmitAnswer={handleSubmitAnswer}
        onCompleteInterview={handleCompleteInterview}
        onSelectInterviewSession={handleSelectInterviewSession}
        isStartingInterview={isStartingInterview}
        isSubmittingAnswer={isSubmittingAnswer}
        isCompletingInterview={isCompletingInterview}
        interviewError={interviewError}
        health={health}
        healthLoading={healthLoading}
        healthError={healthError}
        onRefreshHealth={refetchHealth}
        candidateName={currentUser?.full_name || 'Candidate'}
      />
    </Layout>
  );
}

export default App;
