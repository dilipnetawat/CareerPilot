import type {
  HealthStatus,
  AnalysisRecord,
  AnalysisListItem,
  InterviewSessionDetail,
  InterviewSessionListItem,
  InterviewQuestion,
  RoadmapProgressResponse,
  AdaptivePlanResponse,
  RoadmapRevisionListItem,
  JobApplication,
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationStatusType,
  ApplicationAnalytics,
  UserProfile,
  AuthResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Token Management
export function getAuthToken(): string | null {
  return localStorage.getItem('careerpilot_access_token');
}

export function setAuthSession(token: string, user: UserProfile): void {
  localStorage.setItem('careerpilot_access_token', token);
  localStorage.setItem('careerpilot_demo_session', 'true');
  localStorage.setItem('careerpilot_demo_user', user.full_name);
  localStorage.setItem('careerpilot_user_profile', JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem('careerpilot_access_token');
  localStorage.removeItem('careerpilot_demo_session');
  localStorage.removeItem('careerpilot_demo_user');
  localStorage.removeItem('careerpilot_user_profile');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auth API Services
export async function signupUser(email: string, password: string, fullName: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });

  if (!response.ok) {
    let detail = 'Registration failed';
    try {
      const err = await response.json();
      if (err?.detail) detail = err.detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  const data: AuthResponse = await response.json();
  setAuthSession(data.access_token, data.user);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let detail = 'Authentication failed';
    try {
      const err = await response.json();
      if (err?.detail) detail = err.detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  const data: AuthResponse = await response.json();
  setAuthSession(data.access_token, data.user);
  return data;
}

export async function demoLoginUser(): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    let detail = 'Failed to initiate evaluation demo session.';
    try {
      const err = await response.json();
      if (err?.detail) detail = err.detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  const data: AuthResponse = await response.json();
  setAuthSession(data.access_token, data.user);
  return data;
}

export async function fetchMe(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch authenticated user profile');
  }

  return response.json();
}

// Health API
export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Resume Analysis Services
export async function analyzeCareerFit(
  file: File,
  targetRole: string,
  jobDescription: string
): Promise<AnalysisRecord> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_role', targetRole);
  formData.append('job_description', jobDescription);

  const response = await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Analysis failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchAnalysisById(id: string): Promise<AnalysisRecord> {
  const response = await fetch(`${API_BASE_URL}/api/analysis/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch report ${id}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchRecentAnalyses(): Promise<AnalysisListItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/analysis`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recent analyses: ${response.statusText}`);
  }

  return response.json();
}

// AI Mock Interview API Services
export async function startInterview(analysisId: string): Promise<InterviewSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ analysis_id: analysisId }),
  });

  if (!response.ok) {
    let errorDetail = `Failed to start interview (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchInterviews(): Promise<InterviewSessionListItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/interviews`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch interviews: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchInterviewById(sessionId: string): Promise<InterviewSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to load interview ${sessionId}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function submitInterviewAnswer(
  sessionId: string,
  questionId: string,
  userAnswer: string
): Promise<InterviewQuestion> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/${sessionId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      question_id: questionId,
      user_answer: userAnswer,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Failed to evaluate answer (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function completeInterview(sessionId: string): Promise<InterviewSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/${sessionId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to complete interview (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// Adaptive Learning Progress Services
export async function fetchRoadmapProgress(analysisId: string): Promise<RoadmapProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/api/roadmap/${analysisId}/progress`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch roadmap progress (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function toggleRoadmapTask(
  analysisId: string,
  weekNumber: number,
  taskIndex: number,
  isCompleted: boolean
): Promise<RoadmapProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/api/roadmap/${analysisId}/toggle-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      week_number: weekNumber,
      task_index: taskIndex,
      is_completed: isCompleted,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Failed to update task completion (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function updateAdaptivePlan(analysisId: string): Promise<AdaptivePlanResponse> {
  const response = await fetch(`${API_BASE_URL}/api/roadmap/${analysisId}/update-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to update learning plan (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchRoadmapRevisions(analysisId: string): Promise<RoadmapRevisionListItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/roadmap/${analysisId}/revisions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load roadmap revisions: ${response.statusText}`);
  }

  return response.json();
}

// Job Application Tracker & Analytics Services
export async function fetchApplications(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<JobApplication[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/api/applications${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job applications: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchApplicationById(id: string): Promise<JobApplication> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch application ${id}: ${response.statusText}`);
  }

  return response.json();
}

export async function createApplication(input: CreateApplicationInput): Promise<JobApplication> {
  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorDetail = `Failed to create application (${response.status})`;
    try {
      const err = await response.json();
      if (err?.detail) errorDetail = err.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function updateApplication(
  id: string,
  input: UpdateApplicationInput
): Promise<JobApplication> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorDetail = `Failed to update application (${response.status})`;
    try {
      const err = await response.json();
      if (err?.detail) errorDetail = err.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatusType,
  responseDate?: string
): Promise<JobApplication> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      status,
      response_date: responseDate,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Failed to update status (${response.status})`;
    try {
      const err = await response.json();
      if (err?.detail) errorDetail = err.detail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete application (${response.status})`);
  }
}

export async function fetchApplicationAnalytics(): Promise<ApplicationAnalytics> {
  const response = await fetch(`${API_BASE_URL}/api/applications/analytics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load application analytics: ${response.statusText}`);
  }

  return response.json();
}

export { API_BASE_URL };
