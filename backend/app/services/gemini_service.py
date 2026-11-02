import json
import logging
from typing import List, Type, TypeVar
from fastapi import HTTPException
from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel, Field

from app.config import settings
from app.schemas.analysis import CareerAnalysisResponse, RoadmapWeek
from app.schemas.interview import (
    AnswerEvaluationResponse,
    FinalInterviewSummary,
    GeneratedQuestionItem,
    InterviewQuestionsPayload,
)

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class GeminiAdaptiveRoadmapOutput(BaseModel):
    adjusted: bool = Field(description="True if future tasks were refined, False if current plan remains optimal")
    reason_for_change: str = Field(description="Explanation of why future tasks were adjusted or maintained")
    four_week_roadmap: List[RoadmapWeek] = Field(description="Full 4-week roadmap strictly preserving completed tasks verbatim")

# System Prompts
CAREER_ANALYSIS_SYSTEM_PROMPT = """You are a senior career intelligence architect and technical hiring evaluator for CareerPilot AI.
Your objective is to provide a comprehensive, objective, and deeply actionable career fit and skill-gap analysis
comparing a candidate's extracted resume against a target job role and specific job description.

STRICT EVALUATION PRINCIPLES:
1. EVIDENCE-BASED ASSESSMENT:
   - Base your evaluation solely on the facts, experience, technologies, and achievements documented in the resume.
   - NEVER hallucinate or invent qualifications, metrics, certifications, past companies, or skills.
   - For every key strength, quote or cite concrete evidence from the resume text.

2. DISTINCTION ON MISSING SKILLS:
   - If a job requirement is not mentioned in the resume, categorize it under 'skills_not_evidenced'.
   - NEVER equate "not evidenced in resume" with "candidate lacks this skill in real life". Explicitly state that it is not documented in the resume, and provide advice on how to verify or present it.

3. CAREER FIT SCORE:
   - Provide an integer score from 0 to 100 reflecting how thoroughly the current resume aligns with the target role and requirements.
   - Clearly identify this score as an AI estimate to guide resume optimization and upskilling, not an absolute hiring verdict.

4. STRUCTURED SKILL CATEGORIZATION:
   - 'demonstrated_skills': Core skills required by the role that are clearly evidenced with practical projects, work history, or measurable outcomes.
   - 'partially_demonstrated_skills': Skills mentioned casually, with basic exposure or tangential usage without deep evidence.
   - 'skills_not_evidenced': Important role requirements where the resume has no verifiable mention.

5. ACTIONABLE UPSKILLING & ROADMAP:
   - Prioritize critical skill gaps by severity (high, medium, low) and impact.
   - Provide a realistic, personalized 4-week step-by-step roadmap (Weeks 1 through 4) with clear themes, 3-5 concrete tasks per week, and a tangible deliverable for each week.
   - Recommend exactly 3 practical portfolio projects tailored to the identified skill gaps to demonstrate hands-on mastery.
"""

INTERVIEW_GEN_SYSTEM_PROMPT = """You are an elite principal technical recruiter and interview designer for CareerPilot AI.
Your objective is to generate exactly 5 realistic, high-impact interview questions for a candidate based on their Career Analysis Report.

INTERVIEW DESIGN RULES:
1. TARGETED QUESTIONS: Tailor each question specifically to the target role, verified candidate strengths, and especially their identified skill gaps.
2. QUESTION MIX:
   - Must include a balanced mix of:
     * 'technical' (system architecture, core frameworks, coding trade-offs)
     * 'practical' (debugging real incidents, production scenarios, operational trade-offs)
     * 'behavioral' (collaboration, handling technical disagreements, delivering under deadlines)
3. EXPLICIT EVALUATION CRITERIA: For each question, formulate clear evaluation criteria and list 3-5 specific expected indicators/concepts that distinguish a senior candidate from a novice.
4. REAL-WORLD REALISM: Do not ask superficial trivia or textbook definitions. Formulate scenario-based, problem-solving, and experiential questions.
5. COUNT: Output exactly 5 questions in the 'questions' array.
"""

EVALUATION_SYSTEM_PROMPT = """You are a rigorous, objective hiring evaluator and technical interview assessor for CareerPilot AI.
Your task is to evaluate a candidate's written interview answer against a rigorous 100-point rubric.

RUBRIC SCORING DIMENSIONS:
1. Technical Accuracy (0-25 points): Correctness of facts, tools, protocols, algorithms, and architectural patterns. Deduct heavily for incorrect technical assertions.
2. Relevance (0-20 points): Directly addresses the question prompt without filler, evasion, or irrelevant tangents.
3. Depth of Explanation (0-20 points): Demonstrates deep understanding of trade-offs, edge cases, scalability, and underlying mechanics.
4. Problem Solving (0-20 points): Structured reasoning, logical decomposition, and practical real-world feasibility.
5. Communication Clarity (0-15 points): Professional articulation, clear structure, and unambiguous terminology.

CRITICAL EVALUATION PRINCIPLES:
- DO NOT reward answers merely for being verbose. Quality, precision, and depth matter far more than word count.
- If the candidate makes factual mistakes, flawed assumptions, or incorrect reasoning, detail them in 'incorrect_reasoning'.
- Enumerate specific 'missing_points' that an expert answer would include.
- Provide a concrete 'stronger_answer_example' illustrating how a top-tier candidate would answer the prompt.
- The 'overall_score' must equal the exact sum of the 5 rubric scores (technical_accuracy + relevance + depth_of_explanation + problem_solving + communication_clarity).
- Clearly disclose that scores are AI-generated estimates to guide preparation.
"""

SUMMARY_SYSTEM_PROMPT = """You are an executive hiring lead synthesizing an overall interview performance evaluation for CareerPilot AI.
Analyze the candidate's answers and individual evaluations across all questions in the mock interview.
Synthesize:
1. Overall score: A realistic 0-100 score reflecting average performance.
2. Strongest 2-3 competencies demonstrated across the interview.
3. Weakest 2-3 competencies needing targeted preparation.
4. Comprehensive, encouraging, yet honest performance feedback.
5. 3-5 actionable recommendations to prepare for real-world interviews.
"""

ADAPTIVE_ROADMAP_SYSTEM_PROMPT = """You are an adaptive curriculum architect and senior career development coach for CareerPilot AI.
Your objective is to evaluate a candidate's actual learning progress, completed roadmap tasks, incomplete tasks,
and mock interview evaluation findings, to determine if targeted adjustments to future roadmap tasks are warranted.

STRICT ADAPTIVE RULES:
1. PRESERVE COMPLETED TASKS VERBATIM:
   - NEVER modify, reword, or delete tasks the user has already completed. Completed tasks are verified historical effort and must stay in their original weeks.
2. PRESERVE ORIGINAL SKILL GAPS:
   - Modifications to future incomplete weeks must remain aligned with the role and original skill gaps.
3. DATA-DRIVEN ADJUSTMENTS:
   - If mock interview feedback reveals specific weaknesses (e.g. failing Kubernetes or connection pooling), strategically tailor future incomplete weeks (especially weeks 3 and 4) to address those proven weaknesses with concrete practice.
   - If progress is minimal or there are no new signals, leave the plan unchanged and clearly set adjusted=false with an explanatory reason.
4. EXPLICIT EXPLANATION:
   - Set 'reason_for_change' to clearly explain to the student why future tasks were updated and how it targets their verified weaknesses.
5. OUTPUT STRUCTURE:
   - Output all 4 weeks in 'four_week_roadmap'. Completed tasks must be included verbatim.
"""


def get_gemini_client() -> genai.Client:
    """Return an initialized Google GenAI Client or raise 503 if API key is missing."""
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Gemini API key is not configured. Please set GEMINI_API_KEY in your "
                "backend/.env file to perform career analyses and interviews."
            ),
        )
    return genai.Client(api_key=api_key)


def _call_gemini_structured(
    system_instruction: str, prompt: str, schema: Type[T]
) -> T:
    """Generic helper executing Gemini structured JSON completion with model fallback."""
    client = get_gemini_client()

    candidate_models = [settings.GEMINI_MODEL]
    for fallback in ["gemini-3-flash-preview", "gemini-flash-latest"]:
        if fallback not in candidate_models:
            candidate_models.append(fallback)

    last_error: Exception | None = None

    for model_name in candidate_models:
        try:
            logger.info(f"Invoking Gemini model: {model_name}")
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.2,
            )

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )

            if not response.text:
                raise ValueError("Gemini returned an empty response.")

            parsed_data = json.loads(response.text)
            return schema.model_validate(parsed_data)

        except APIError as api_err:
            last_error = api_err
            err_str = str(api_err).lower()
            if any(k in err_str for k in ["404", "not found", "unsupported", "503", "unavailable", "high demand"]):
                logger.warning(f"Model {model_name} unavailable or high demand, trying next candidate model...")
                continue
            if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API rate limit or quota exceeded. Please wait a moment and try again.",
                )
            raise HTTPException(
                status_code=502,
                detail=f"Gemini API error: {str(api_err)}",
            )
        except json.JSONDecodeError as json_err:
            logger.error(f"Failed to parse Gemini JSON output: {json_err}")
            raise HTTPException(
                status_code=502,
                detail="Received invalid JSON response format from Gemini.",
            )
        except Exception as exc:
            last_error = exc
            err_msg = str(exc).lower()
            if any(k in err_msg for k in ["not found", "unavailable", "high demand", "503"]):
                logger.warning(f"Model {model_name} transient error ({err_msg[:60]}), trying next model...")
                continue
            raise HTTPException(
                status_code=502,
                detail=f"AI model completion failed: {str(exc)}",
            )

    raise HTTPException(
        status_code=502,
        detail=f"Failed to execute AI request across all candidate models. Last error: {str(last_error)}",
    )


# 1. Career Analysis
def build_analysis_prompt(resume_text: str, target_role: str, job_description: str) -> str:
    return f"""Please perform an in-depth career fit and skill gap analysis for the following candidate:

TARGET ROLE:
{target_role.strip()}

JOB DESCRIPTION:
{job_description.strip()}

CANDIDATE RESUME TEXT:
{resume_text.strip()}

Remember to follow the system instructions strictly, provide validated structured output,
cite direct resume evidence, avoid inventing details, and provide a 4-week roadmap and 3 portfolio projects.
"""


def analyze_career_fit(
    resume_text: str, target_role: str, job_description: str
) -> CareerAnalysisResponse:
    prompt = build_analysis_prompt(resume_text, target_role, job_description)
    return _call_gemini_structured(CAREER_ANALYSIS_SYSTEM_PROMPT, prompt, CareerAnalysisResponse)


# 2. Mock Interview Question Generation
def generate_interview_questions(
    target_role: str, report_data: dict
) -> List[GeneratedQuestionItem]:
    """Generates exactly 5 targeted interview questions from a career analysis report."""
    demonstrated = [s.get("skill_name") for s in report_data.get("demonstrated_skills", [])]
    partial = [s.get("skill_name") for s in report_data.get("partially_demonstrated_skills", [])]
    not_evidenced = [s.get("skill_name") for s in report_data.get("skills_not_evidenced", [])]
    skill_gaps = [g.get("gap_name") for g in report_data.get("prioritized_skill_gaps", [])]
    summary = report_data.get("profile_summary", "")

    prompt = f"""Generate an AI Mock Interview consisting of exactly 5 role-specific questions for:

TARGET ROLE: {target_role}

CANDIDATE PROFILE SUMMARY:
{summary}

DEMONSTRATED SKILLS (Candidate is strong here):
{', '.join(demonstrated) if demonstrated else 'None specified'}

PARTIALLY DEMONSTRATED SKILLS:
{', '.join(partial) if partial else 'None specified'}

SKILLS NOT EVIDENCED IN RESUME:
{', '.join(not_evidenced) if not_evidenced else 'None specified'}

PRIORITIZED SKILL GAPS:
{', '.join(skill_gaps) if skill_gaps else 'None specified'}

REQUIREMENTS:
- Generate exactly 5 questions mixing 'technical', 'practical', and 'behavioral'.
- Target both candidate strengths and identified skill gaps to test real-world readiness.
- Include specific evaluation criteria and expected indicators for each question.
"""
    result: InterviewQuestionsPayload = _call_gemini_structured(
        INTERVIEW_GEN_SYSTEM_PROMPT, prompt, InterviewQuestionsPayload
    )
    return result.questions[:5]


# 3. Mock Interview Answer Evaluation
def evaluate_interview_answer(
    question_text: str,
    category: str,
    difficulty: str,
    evaluation_criteria: str,
    expected_indicators: List[str],
    user_answer: str,
    target_role: str,
) -> AnswerEvaluationResponse:
    """Evaluates a candidate's answer using the strict 100-point rubric."""
    prompt = f"""TARGET ROLE: {target_role}

INTERVIEW QUESTION ({category.upper()}, DIFFICULTY: {difficulty}):
{question_text}

EVALUATION CRITERIA:
{evaluation_criteria}

EXPECTED ANSWER INDICATORS:
{chr(10).join(f"- {ind}" for ind in expected_indicators)}

CANDIDATE SUBMITTED ANSWER:
{user_answer}

Please evaluate this answer strictly against the 100-point rubric:
- Technical accuracy (0-25)
- Relevance (0-20)
- Depth of explanation (0-20)
- Problem-solving (0-20)
- Communication clarity (0-15)
Total score must equal sum of dimensions.
Provide what was done well, missing points, incorrect reasoning if any, improvement suggestions, and a stronger answer example.
"""
    return _call_gemini_structured(
        EVALUATION_SYSTEM_PROMPT, prompt, AnswerEvaluationResponse
    )


# 4. Final Interview Summary Synthesis
def synthesize_interview_final_report(
    target_role: str, questions_with_answers: List[dict]
) -> FinalInterviewSummary:
    """Synthesizes the overall interview performance, competencies, and recommendations."""
    qa_texts = []
    for idx, item in enumerate(questions_with_answers, 1):
        q = item.get("question", "")
        cat = item.get("category", "")
        score = item.get("score", 0)
        user_ans = item.get("user_answer", "")
        well = item.get("what_was_done_well", "")
        missing = item.get("missing_points", [])
        qa_texts.append(
            f"Question {idx} [{cat}] (Score: {score}/100):\n"
            f"Prompt: {q}\n"
            f"Answer: {user_ans}\n"
            f"Strengths: {well}\n"
            f"Gaps: {', '.join(missing) if missing else 'None'}\n"
        )

    prompt = f"""TARGET ROLE: {target_role}

MOCK INTERVIEW PERFORMANCE TRANSCRIPT:
{chr(10).join(qa_texts)}

Synthesize the final interview report:
- Calculate the average score (0-100).
- Identify top 2-3 strongest competencies.
- Identify top 2-3 weakest competencies.
- Provide comprehensive overall feedback.
- Give 3-5 concrete recommendations for upcoming real-world interviews.
"""
    return _call_gemini_structured(
        SUMMARY_SYSTEM_PROMPT, prompt, FinalInterviewSummary
    )


# 5. Adaptive Learning Roadmap Adjustment
def adapt_learning_roadmap(
    target_role: str,
    original_gaps: List[dict],
    completed_tasks: List[str],
    incomplete_tasks: List[str],
    interview_findings: List[dict],
    current_roadmap: List[dict],
) -> GeminiAdaptiveRoadmapOutput:
    """Evaluates candidate progress and interview results to adapt future roadmap tasks."""
    gaps_str = "\n".join(f"- {g.get('gap_name', '')}: {g.get('impact', '')}" for g in original_gaps)
    completed_str = "\n".join(f"[COMPLETED] {t}" for t in completed_tasks) if completed_tasks else "None completed yet"
    incomplete_str = "\n".join(f"[PENDING] {t}" for t in incomplete_tasks)

    interview_str = "No mock interview evaluation records available."
    if interview_findings:
        parts = []
        for i_item in interview_findings:
            parts.append(
                f"- Question: {i_item.get('question', '')}\n"
                f"  Score: {i_item.get('score', 0)}/100\n"
                f"  Missing Points: {', '.join(i_item.get('missing_points', []))}\n"
                f"  Improvement Advice: {', '.join(i_item.get('improvement_suggestions', []))}"
            )
        interview_str = "\n".join(parts)

    roadmap_str = json.dumps(current_roadmap, indent=2)

    prompt = f"""TARGET ROLE: {target_role}

ORIGINAL IDENTIFIED SKILL GAPS:
{gaps_str}

ACTUAL USER PROGRESS:
Completed Tasks (MUST BE PRESERVED VERBATIM IN OUTPUT):
{completed_str}

Pending Incomplete Tasks:
{incomplete_str}

RECENT MOCK INTERVIEW EVALUATION FINDINGS:
{interview_str}

CURRENT 4-WEEK ROADMAP STRUCTURE:
{roadmap_str}

INSTRUCTIONS:
1. Determine whether an adjustment to future incomplete weeks is warranted based on real user progress and mock interview findings.
2. If progress is insufficient or no new weaknesses are identified, keep the plan unchanged (adjusted=false).
3. If adjusting, preserve all completed tasks verbatim. Enhance future weeks (weeks 3 and 4) to directly drill the proven interview gaps.
4. Provide a clear, encouraging 'reason_for_change' explaining the curriculum adjustments to the candidate.
"""
    return _call_gemini_structured(
        ADAPTIVE_ROADMAP_SYSTEM_PROMPT, prompt, GeminiAdaptiveRoadmapOutput
    )
