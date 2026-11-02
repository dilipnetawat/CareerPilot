export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | string;
  app: string;
  environment: string;
  database: string;
  timestamp: string;
  version: string;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface StrengthItem {
  title: string;
  description: string;
  resume_evidence: string;
}

export type SkillStatus = 'demonstrated' | 'partially_demonstrated' | 'not_evidenced';
export type SkillImportance = 'critical' | 'important' | 'nice_to_have';

export interface SkillAssessmentItem {
  skill_name: string;
  status: SkillStatus;
  importance: SkillImportance;
  supporting_evidence: string;
  recommended_improvement: string;
}

export type SeverityLevel = 'high' | 'medium' | 'low';

export interface SkillGapItem {
  gap_name: string;
  severity: SeverityLevel;
  impact: string;
  explanation: string;
}

export interface RoadmapWeek {
  week_number: number;
  title: string;
  focus: string;
  tasks: string[];
  expected_deliverable: string;
}

export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface PortfolioProject {
  title: string;
  description: string;
  skills_targeted: string[];
  difficulty: ProjectDifficulty;
  suggested_deliverables: string[];
}

export interface CareerAnalysisReport {
  overall_fit_score: number;
  score_rationale: string;
  profile_summary: string;
  key_strengths: StrengthItem[];
  demonstrated_skills: SkillAssessmentItem[];
  partially_demonstrated_skills: SkillAssessmentItem[];
  skills_not_evidenced: SkillAssessmentItem[];
  important_job_requirements: string[];
  prioritized_skill_gaps: SkillGapItem[];
  practical_recommendations: string[];
  four_week_roadmap: RoadmapWeek[];
  portfolio_projects: PortfolioProject[];
  disclaimer: string;
}

export interface AnalysisRecord {
  id: string;
  target_role: string;
  fit_score: number;
  candidate_summary: string;
  created_at: string;
  report: CareerAnalysisReport;
}

export interface AnalysisListItem {
  id: string;
  target_role: string;
  fit_score: number;
  candidate_summary: string;
  created_at: string;
}

// Phase 3: AI Mock Interview Types
export interface RubricBreakdown {
  technical_accuracy: number;
  relevance: number;
  depth_of_explanation: number;
  problem_solving: number;
  communication_clarity: number;
}

export interface InterviewAnswer {
  id: string;
  question_id: string;
  user_answer: string;
  score: number;
  technical_accuracy: number;
  relevance: number;
  depth_of_explanation: number;
  problem_solving: number;
  communication_clarity: number;
  what_was_done_well: string;
  missing_points: string[];
  incorrect_reasoning: string | null;
  improvement_suggestions: string[];
  stronger_answer_example: string;
  disclaimer: string;
  submitted_at: string;
}

export type QuestionCategory = 'technical' | 'practical' | 'behavioral';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface InterviewQuestion {
  id: string;
  question_index: number;
  question_text: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  evaluation_criteria: string;
  expected_indicators: string[];
  answer: InterviewAnswer | null;
}

export interface InterviewSessionDetail {
  id: string;
  analysis_id: string | null;
  target_role: string;
  status: 'in_progress' | 'completed';
  overall_score: number | null;
  summary: string | null;
  strongest_competencies: string[] | null;
  weakest_competencies: string[] | null;
  recommendations: string[] | null;
  created_at: string;
  completed_at: string | null;
  questions: InterviewQuestion[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface InterviewSessionListItem {
  id: string;
  analysis_id: string | null;
  target_role: string;
  status: 'in_progress' | 'completed';
  overall_score: number | null;
  questions_total: number;
  questions_answered: number;
  created_at: string;
  completed_at: string | null;
}

export type AppView =
  | 'landing'
  | 'login'
  | 'overview'
  | 'analysis'
  | 'report'
  | 'roadmap'
  | 'interview_setup'
  | 'interview_workspace'
  | 'interview_report'
  | 'interview_history'
  | 'progress'
  | 'applications'
  | 'applications_analytics'
  | 'status';

// Phase 4: Adaptive Learning Roadmap Progress
export interface TaskProgressItem {
  id: string;
  week_number: number;
  task_index: number;
  task_text: string;
  is_completed: boolean;
  completed_at?: string | null;
}

export interface WeeklyProgressBreakdown {
  week_number: number;
  title: string;
  focus: string;
  total_tasks: number;
  completed_tasks: number;
  percentage: number;
  expected_deliverable: string;
  tasks: TaskProgressItem[];
}

export interface RoadmapProgressResponse {
  analysis_id: string;
  overall_percentage: number;
  total_tasks: number;
  completed_tasks: number;
  weekly_progress: WeeklyProgressBreakdown[];
  revisions_count: number;
}

export interface AdaptivePlanResponse {
  adjusted: boolean;
  reason_for_change: string;
  revision_number: number;
  four_week_roadmap: RoadmapWeek[];
}

export interface RoadmapRevisionListItem {
  id: string;
  analysis_id: string;
  revision_number: number;
  reason_for_change: string;
  created_at: string;
}

// Phase 4: Job Application Tracker & Analytics
export type RoleCategoryType = 'Python' | 'Backend' | 'Frontend' | 'AI/ML' | 'Full Stack' | 'Other';
export type ApplicationStatusType = 'Saved' | 'Applied' | 'Assessment' | 'Interview' | 'Offer' | 'Rejected';

export interface JobApplication {
  id: string;
  company_name: string;
  job_title: string;
  role_category: RoleCategoryType;
  job_description_or_url?: string | null;
  application_date: string;
  status: ApplicationStatusType;
  response_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationInput {
  company_name: string;
  job_title: string;
  role_category: RoleCategoryType;
  job_description_or_url?: string;
  application_date?: string;
  status?: ApplicationStatusType;
  response_date?: string;
  notes?: string;
}

export interface UpdateApplicationInput {
  company_name?: string;
  job_title?: string;
  role_category?: RoleCategoryType;
  job_description_or_url?: string;
  application_date?: string;
  status?: ApplicationStatusType;
  response_date?: string;
  notes?: string;
}

export interface RoleCategoryAnalytics {
  role_category: string;
  total_applications: number;
  responses: number;
  response_rate: number;
  interviews: number;
  offers: number;
}

export interface ApplicationAnalytics {
  total_applications: number;
  response_count: number;
  response_rate: number;
  interview_conversion_rate: number;
  offer_count: number;
  status_distribution: Record<string, number>;
  category_analytics: RoleCategoryAnalytics[];
  has_sufficient_data: boolean;
  insight_summary: string;
}
