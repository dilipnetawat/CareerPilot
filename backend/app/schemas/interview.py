from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator


# Question Generation Schemas
class GeneratedQuestionItem(BaseModel):
    question_text: str = Field(description="Role-specific interview question prompt")
    category: Literal["technical", "practical", "behavioral"] = Field(
        description="Category: 'technical' (system/coding), 'practical' (scenario/debugging), or 'behavioral' (teamwork/leadership)"
    )
    difficulty: Literal["Easy", "Medium", "Hard"] = Field(description="Target difficulty level")
    evaluation_criteria: str = Field(description="Rubric focus and key evaluation criteria for this question")
    expected_indicators: List[str] = Field(description="3-5 specific expected concepts, techniques, or traits in a good answer")


class InterviewQuestionsPayload(BaseModel):
    questions: List[GeneratedQuestionItem] = Field(
        description="Exactly 5 tailored interview questions targeting role requirements and identified skill gaps"
    )


# Answer Evaluation Schemas
class RubricBreakdown(BaseModel):
    technical_accuracy: int = Field(ge=0, le=25, description="Technical correctness & depth of accurate facts (0-25)")
    relevance: int = Field(ge=0, le=20, description="Directly addressing the question without fluff or evasion (0-20)")
    depth_of_explanation: int = Field(ge=0, le=20, description="Explaining why, trade-offs, and edge cases (0-20)")
    problem_solving: int = Field(ge=0, le=20, description="Logical reasoning, design process, and practical resolution (0-20)")
    communication_clarity: int = Field(ge=0, le=15, description="Structure, clarity, and conciseness (0-15)")


class AnswerEvaluationResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100, description="Total score out of 100 (sum of the 5 rubric criteria)")
    rubric: RubricBreakdown = Field(description="Points breakdown across the 5 dimensions")
    what_was_done_well: str = Field(description="Specific strengths of the submitted response")
    missing_points: List[str] = Field(description="Key concepts or critical considerations omitted by candidate")
    incorrect_reasoning: Optional[str] = Field(default=None, description="Any flawed technical logic or incorrect statements, if any")
    improvement_suggestions: List[str] = Field(description="Specific, actionable suggestions to improve the answer")
    stronger_answer_example: str = Field(description="Concrete exemplar answer demonstrating high mastery")
    disclaimer: str = Field(default="Score is an AI-generated assessment to guide preparation and practice, not an absolute hiring verdict.")

    @model_validator(mode="after")
    def compute_and_verify_total(self) -> "AnswerEvaluationResponse":
        expected = (
            self.rubric.technical_accuracy
            + self.rubric.relevance
            + self.rubric.depth_of_explanation
            + self.rubric.problem_solving
            + self.rubric.communication_clarity
        )
        if self.overall_score != expected:
            self.overall_score = expected
        return self


# Final Interview Summary Schema
class FinalInterviewSummary(BaseModel):
    overall_score: int = Field(ge=0, le=100, description="Weighted average score across all questions")
    strongest_competencies: List[str] = Field(description="Top 2-3 competencies demonstrated during the interview")
    weakest_competencies: List[str] = Field(description="Top 2-3 competencies needing the most improvement")
    overall_feedback: str = Field(description="Comprehensive performance evaluation and synthesis")
    actionable_recommendations: List[str] = Field(description="3-5 concrete steps to prepare for actual interviews")


# API Request Models
class StartInterviewRequest(BaseModel):
    analysis_id: str = Field(description="ID of the completed CareerAnalysisReport")


class SubmitAnswerRequest(BaseModel):
    question_id: str = Field(description="UUID of the question being answered")
    user_answer: str = Field(min_length=10, description="Text answer provided by the candidate")


# API Response Models
class InterviewAnswerResponse(BaseModel):
    id: str
    question_id: str
    user_answer: str
    score: int
    technical_accuracy: int
    relevance: int
    depth_of_explanation: int
    problem_solving: int
    communication_clarity: int
    what_was_done_well: str
    missing_points: List[str]
    incorrect_reasoning: Optional[str]
    improvement_suggestions: List[str]
    stronger_answer_example: str
    disclaimer: str
    submitted_at: str


class InterviewQuestionResponse(BaseModel):
    id: str
    question_index: int
    question_text: str
    category: str
    difficulty: str
    evaluation_criteria: str
    expected_indicators: List[str]
    answer: Optional[InterviewAnswerResponse] = None


class InterviewSessionDetailResponse(BaseModel):
    id: str
    analysis_id: Optional[str]
    target_role: str
    status: str
    overall_score: Optional[int]
    summary: Optional[str]
    strongest_competencies: Optional[List[str]]
    weakest_competencies: Optional[List[str]]
    recommendations: Optional[List[str]]
    created_at: str
    completed_at: Optional[str]
    questions: List[InterviewQuestionResponse]


class InterviewSessionListItem(BaseModel):
    id: str
    analysis_id: Optional[str]
    target_role: str
    status: str
    overall_score: Optional[int]
    questions_total: int
    questions_answered: int
    created_at: str
    completed_at: Optional[str]
