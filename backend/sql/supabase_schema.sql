-- ==============================================================================
-- CareerPilot AI — Supabase PostgreSQL Production Database Schema
-- Compatible with PostgreSQL 14+, SQLAlchemy 2.0, and Supabase Hosted Databases
-- ==============================================================================

-- 1. System Status Table
CREATE TABLE IF NOT EXISTS system_status (
    id SERIAL PRIMARY KEY,
    component VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 3. Career Analysis Reports Table
CREATE TABLE IF NOT EXISTS analysis_reports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    target_role VARCHAR(255) NOT NULL,
    candidate_summary TEXT NOT NULL,
    fit_score INTEGER NOT NULL,
    report_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_target_role ON analysis_reports(target_role);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created_at ON analysis_reports(created_at);

-- 4. Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    analysis_id VARCHAR(36) REFERENCES analysis_reports(id) ON DELETE SET NULL,
    target_role VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress' NOT NULL,
    overall_score INTEGER,
    summary TEXT,
    strongest_competencies JSONB,
    weakest_competencies JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_analysis_id ON interview_sessions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_target_role ON interview_sessions(target_role);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at);

-- 5. Interview Questions Table
CREATE TABLE IF NOT EXISTS interview_questions (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    evaluation_criteria TEXT NOT NULL,
    expected_indicators JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_session_id ON interview_questions(session_id);

-- 6. Interview Answers Table
CREATE TABLE IF NOT EXISTS interview_answers (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(36) UNIQUE NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    score INTEGER NOT NULL,
    technical_accuracy INTEGER NOT NULL,
    relevance INTEGER NOT NULL,
    depth_of_explanation INTEGER NOT NULL,
    problem_solving INTEGER NOT NULL,
    communication_clarity INTEGER NOT NULL,
    what_was_done_well TEXT NOT NULL,
    missing_points JSONB NOT NULL,
    incorrect_reasoning TEXT,
    improvement_suggestions JSONB NOT NULL,
    stronger_answer_example TEXT NOT NULL,
    disclaimer TEXT DEFAULT 'Score is an AI-generated assessment to guide preparation and practice, not an absolute hiring verdict.' NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_answers_question_id ON interview_answers(question_id);

-- 7. Roadmap Task Progress Table
CREATE TABLE IF NOT EXISTS roadmap_task_progress (
    id VARCHAR(36) PRIMARY KEY,
    analysis_id VARCHAR(36) NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    task_index INTEGER NOT NULL,
    task_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_roadmap_analysis_week_task UNIQUE (analysis_id, week_number, task_index)
);

CREATE INDEX IF NOT EXISTS idx_roadmap_task_progress_analysis_id ON roadmap_task_progress(analysis_id);

-- 8. Roadmap Revisions Table
CREATE TABLE IF NOT EXISTS roadmap_revisions (
    id VARCHAR(36) PRIMARY KEY,
    analysis_id VARCHAR(36) NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    reason_for_change TEXT NOT NULL,
    roadmap_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_revisions_analysis_id ON roadmap_revisions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_revisions_created_at ON roadmap_revisions(created_at);

-- 9. Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    role_category VARCHAR(50) NOT NULL,
    job_description_or_url TEXT,
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status VARCHAR(50) DEFAULT 'Applied' NOT NULL,
    response_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company_name ON job_applications(company_name);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_title ON job_applications(job_title);
CREATE INDEX IF NOT EXISTS idx_job_applications_role_category ON job_applications(role_category);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at);
