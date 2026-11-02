from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class StrengthItem(BaseModel):
    title: str = Field(description="Name or title of the strength")
    description: str = Field(description="Explanation of how this benefits the target role")
    resume_evidence: str = Field(description="Direct citation or evidence extracted from the resume")


class SkillAssessmentItem(BaseModel):
    skill_name: str = Field(description="Specific technical or professional skill name")
    status: Literal["demonstrated", "partially_demonstrated", "not_evidenced"] = Field(
        description="Candidate's skill status: 'demonstrated' (solid evidence), 'partially_demonstrated' (some exposure), 'not_evidenced' (not mentioned in resume; note: not mentioned != lacks skill)"
    )
    importance: Literal["critical", "important", "nice_to_have"] = Field(
        description="Importance of this skill for the target job role"
    )
    supporting_evidence: str = Field(
        description="Evidence quote or summary from resume, or 'Not evidenced in resume'"
    )
    recommended_improvement: str = Field(
        description="Actionable advice to build, practice, or demonstrate this skill"
    )


class SkillGapItem(BaseModel):
    gap_name: str = Field(description="Title of the prioritized skill gap")
    severity: Literal["high", "medium", "low"] = Field(description="Severity/urgency level of this gap")
    impact: str = Field(description="Impact of this gap on interview performance or job readiness")
    explanation: str = Field(description="Detailed explanation and guidance on why this gap matters")


class RoadmapWeek(BaseModel):
    week_number: int = Field(description="Week number 1, 2, 3, or 4")
    title: str = Field(description="Weekly focus theme")
    focus: str = Field(description="Primary objective for the week")
    tasks: List[str] = Field(description="3-5 concrete, actionable learning and practice tasks")
    expected_deliverable: str = Field(description="Tangible deliverable or artifact to produce this week")


class PortfolioProject(BaseModel):
    title: str = Field(description="Compelling project title tailored to target role")
    description: str = Field(description="Real-world project description demonstrating target skills")
    skills_targeted: List[str] = Field(description="Target skills addressed by this project")
    difficulty: Literal["Beginner", "Intermediate", "Advanced"] = Field(description="Project complexity level")
    suggested_deliverables: List[str] = Field(description="Specific repository/demo artifacts to include in portfolio")


class CareerAnalysisResponse(BaseModel):
    overall_fit_score: int = Field(
        ge=0,
        le=100,
        description="Estimated career fit score from 0 to 100 based on resume match with job description"
    )
    score_rationale: str = Field(
        description="Brief justification for the score, clearly identified as an AI estimate"
    )
    profile_summary: str = Field(
        description="Concise professional summary of the candidate's current background"
    )
    key_strengths: List[StrengthItem] = Field(
        description="Top strengths supported by resume evidence"
    )
    demonstrated_skills: List[SkillAssessmentItem] = Field(
        description="Skills clearly demonstrated in the candidate's resume"
    )
    partially_demonstrated_skills: List[SkillAssessmentItem] = Field(
        description="Skills with partial or tangential exposure in the resume"
    )
    skills_not_evidenced: List[SkillAssessmentItem] = Field(
        description="Skills from job requirements not evidenced in the resume (noting this does not imply candidate lacks it, only that resume doesn't show it)"
    )
    important_job_requirements: List[str] = Field(
        description="Key core requirements and qualifications demanded by the job description"
    )
    prioritized_skill_gaps: List[SkillGapItem] = Field(
        description="Prioritized skill gaps that should be addressed first"
    )
    practical_recommendations: List[str] = Field(
        description="Actionable immediate steps to improve candidacy (resume tweaks, certifications, talking points)"
    )
    four_week_roadmap: List[RoadmapWeek] = Field(
        description="Structured 4-week step-by-step career upskilling roadmap"
    )
    portfolio_projects: List[PortfolioProject] = Field(
        description="Exactly 3 high-impact portfolio projects designed to bridge identified skill gaps"
    )
    disclaimer: str = Field(
        default="The overall career fit score is an AI-generated estimate to guide learning and resume optimization. It should be treated as guidance rather than an absolute hiring decision."
    )


class AnalysisRecordResponse(BaseModel):
    id: str
    target_role: str
    fit_score: int
    candidate_summary: str
    created_at: str
    report: CareerAnalysisResponse


class AnalysisListItem(BaseModel):
    id: str
    target_role: str
    fit_score: int
    candidate_summary: str
    created_at: str
