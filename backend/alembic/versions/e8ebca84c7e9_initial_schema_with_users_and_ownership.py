"""initial_schema_with_users_and_ownership

Revision ID: e8ebca84c7e9
Revises:
Create Date: 2026-10-31 22:58:09.620763

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e8ebca84c7e9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Deterministic initial schema migration for all nine CareerPilot AI models."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # 1. system_status
    if "system_status" not in existing_tables:
        op.create_table(
            "system_status",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("component", sa.String(length=50), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("component", name="uq_system_status_component"),
        )
        op.create_index("ix_system_status_id", "system_status", ["id"], unique=False)

    # 2. users
    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("hashed_password", sa.String(length=255), nullable=False),
            sa.Column("full_name", sa.String(length=255), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_users_email", "users", ["email"], unique=True)
        op.create_index("ix_users_created_at", "users", ["created_at"], unique=False)

    # 3. analysis_reports
    if "analysis_reports" not in existing_tables:
        op.create_table(
            "analysis_reports",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
            sa.Column("target_role", sa.String(length=255), nullable=False),
            sa.Column("candidate_summary", sa.Text(), nullable=False),
            sa.Column("fit_score", sa.Integer(), nullable=False),
            sa.Column("report_data", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_analysis_reports_user_id", "analysis_reports", ["user_id"], unique=False)
        op.create_index("ix_analysis_reports_target_role", "analysis_reports", ["target_role"], unique=False)
        op.create_index("ix_analysis_reports_created_at", "analysis_reports", ["created_at"], unique=False)
    else:
        cols = [c["name"] for c in inspector.get_columns("analysis_reports")]
        if "user_id" not in cols:
            op.add_column("analysis_reports", sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True))
            op.create_index("ix_analysis_reports_user_id", "analysis_reports", ["user_id"], unique=False)

    # 4. interview_sessions
    if "interview_sessions" not in existing_tables:
        op.create_table(
            "interview_sessions",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
            sa.Column("analysis_id", sa.String(length=36), sa.ForeignKey("analysis_reports.id", ondelete="SET NULL"), nullable=True),
            sa.Column("target_role", sa.String(length=255), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="in_progress"),
            sa.Column("overall_score", sa.Integer(), nullable=True),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("strongest_competencies", sa.JSON(), nullable=True),
            sa.Column("weakest_competencies", sa.JSON(), nullable=True),
            sa.Column("recommendations", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_interview_sessions_user_id", "interview_sessions", ["user_id"], unique=False)
        op.create_index("ix_interview_sessions_analysis_id", "interview_sessions", ["analysis_id"], unique=False)
        op.create_index("ix_interview_sessions_target_role", "interview_sessions", ["target_role"], unique=False)
        op.create_index("ix_interview_sessions_created_at", "interview_sessions", ["created_at"], unique=False)
    else:
        cols = [c["name"] for c in inspector.get_columns("interview_sessions")]
        if "user_id" not in cols:
            op.add_column("interview_sessions", sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True))
            op.create_index("ix_interview_sessions_user_id", "interview_sessions", ["user_id"], unique=False)

    # 5. interview_questions
    if "interview_questions" not in existing_tables:
        op.create_table(
            "interview_questions",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("session_id", sa.String(length=36), sa.ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False),
            sa.Column("question_index", sa.Integer(), nullable=False),
            sa.Column("question_text", sa.Text(), nullable=False),
            sa.Column("category", sa.String(length=50), nullable=False),
            sa.Column("difficulty", sa.String(length=50), nullable=False),
            sa.Column("evaluation_criteria", sa.Text(), nullable=False),
            sa.Column("expected_indicators", sa.JSON(), nullable=False),
        )
        op.create_index("ix_interview_questions_session_id", "interview_questions", ["session_id"], unique=False)

    # 6. interview_answers
    if "interview_answers" not in existing_tables:
        op.create_table(
            "interview_answers",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("question_id", sa.String(length=36), sa.ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_answer", sa.Text(), nullable=False),
            sa.Column("score", sa.Integer(), nullable=False),
            sa.Column("technical_accuracy", sa.Integer(), nullable=False),
            sa.Column("relevance", sa.Integer(), nullable=False),
            sa.Column("depth_of_explanation", sa.Integer(), nullable=False),
            sa.Column("problem_solving", sa.Integer(), nullable=False),
            sa.Column("communication_clarity", sa.Integer(), nullable=False),
            sa.Column("what_was_done_well", sa.Text(), nullable=False),
            sa.Column("missing_points", sa.JSON(), nullable=False),
            sa.Column("incorrect_reasoning", sa.Text(), nullable=True),
            sa.Column("improvement_suggestions", sa.JSON(), nullable=False),
            sa.Column("stronger_answer_example", sa.Text(), nullable=False),
            sa.Column("disclaimer", sa.Text(), nullable=False, server_default="Score is an AI-generated assessment to guide preparation and practice, not an absolute hiring verdict."),
            sa.Column("submitted_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("question_id", name="uq_interview_answers_question_id"),
        )
        op.create_index("ix_interview_answers_question_id", "interview_answers", ["question_id"], unique=True)

    # 7. roadmap_task_progress
    if "roadmap_task_progress" not in existing_tables:
        op.create_table(
            "roadmap_task_progress",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("analysis_id", sa.String(length=36), sa.ForeignKey("analysis_reports.id", ondelete="CASCADE"), nullable=False),
            sa.Column("week_number", sa.Integer(), nullable=False),
            sa.Column("task_index", sa.Integer(), nullable=False),
            sa.Column("task_text", sa.Text(), nullable=False),
            sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.text("0" if conn.dialect.name == "sqlite" else "false")),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("analysis_id", "week_number", "task_index", name="uq_roadmap_analysis_week_task"),
        )
        op.create_index("ix_roadmap_task_progress_analysis_id", "roadmap_task_progress", ["analysis_id"], unique=False)

    # 8. roadmap_revisions
    if "roadmap_revisions" not in existing_tables:
        op.create_table(
            "roadmap_revisions",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("analysis_id", sa.String(length=36), sa.ForeignKey("analysis_reports.id", ondelete="CASCADE"), nullable=False),
            sa.Column("revision_number", sa.Integer(), nullable=False),
            sa.Column("reason_for_change", sa.Text(), nullable=False),
            sa.Column("roadmap_data", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_roadmap_revisions_analysis_id", "roadmap_revisions", ["analysis_id"], unique=False)
        op.create_index("ix_roadmap_revisions_created_at", "roadmap_revisions", ["created_at"], unique=False)

    # 9. job_applications
    if "job_applications" not in existing_tables:
        op.create_table(
            "job_applications",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
            sa.Column("company_name", sa.String(length=255), nullable=False),
            sa.Column("job_title", sa.String(length=255), nullable=False),
            sa.Column("role_category", sa.String(length=50), nullable=False),
            sa.Column("job_description_or_url", sa.Text(), nullable=True),
            sa.Column("application_date", sa.DateTime(), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="Applied"),
            sa.Column("response_date", sa.DateTime(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_job_applications_user_id", "job_applications", ["user_id"], unique=False)
        op.create_index("ix_job_applications_company_name", "job_applications", ["company_name"], unique=False)
        op.create_index("ix_job_applications_job_title", "job_applications", ["job_title"], unique=False)
        op.create_index("ix_job_applications_role_category", "job_applications", ["role_category"], unique=False)
        op.create_index("ix_job_applications_status", "job_applications", ["status"], unique=False)
        op.create_index("ix_job_applications_created_at", "job_applications", ["created_at"], unique=False)
    else:
        cols = [c["name"] for c in inspector.get_columns("job_applications")]
        if "user_id" not in cols:
            op.add_column("job_applications", sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True))
            op.create_index("ix_job_applications_user_id", "job_applications", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema dropping tables in reverse topological dependency order."""
    op.drop_table("job_applications")
    op.drop_table("roadmap_revisions")
    op.drop_table("roadmap_task_progress")
    op.drop_table("interview_answers")
    op.drop_table("interview_questions")
    op.drop_table("interview_sessions")
    op.drop_table("analysis_reports")
    op.drop_table("users")
    op.drop_table("system_status")
