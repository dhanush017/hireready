"""Interview service: generates questions and provides answer feedback."""

from __future__ import annotations

import logging

from ..agents.factory import get_interview_agent
from ..schemas.interview import (
    InterviewFeedback,
    InterviewFeedbackRequest,
    InterviewQuestion,
    InterviewQuestionsRequest,
    InterviewQuestionsResult,
)
from ..utils.agent_runner import run_agent_with_retry

logger = logging.getLogger(__name__)


def generate_questions(request: InterviewQuestionsRequest) -> InterviewQuestionsResult:
    """Generate 5 interview practice questions."""
    job_title = request.job_requirements.get("title", "the target role")
    required_skills = ", ".join(
        request.job_requirements.get("required_skills", [])
    ) or "Not specified"

    gaps_summary = ""
    for gap in request.gaps:
        gaps_summary += f"- {gap.get('skill', 'unknown')} ({gap.get('priority', 'medium')} priority)\n"

    candidate_skills = ", ".join(
        request.resume_profile.get("skills", [])
    ) or "Not specified"
    candidate_projects = ", ".join(
        request.resume_profile.get("projects", [])
    ) or "None listed"

    prompt = f"""Generate exactly 5 interview questions for this candidate.

TARGET ROLE: {job_title}
REQUIRED SKILLS: {required_skills}

CANDIDATE SKILLS: {candidate_skills}
CANDIDATE PROJECTS: {candidate_projects}

SKILL GAPS:
{gaps_summary or 'None identified'}

Generate one question per category:
1. resume - About something specific in their background
2. technical - About a required skill for the role
3. dsa - A data structures/algorithms question for intern level
4. project - About a project they could build or have built
5. behavioral - A situational question relevant to the role

Each question should include brief context about why it's relevant."""

    interview_agent = get_interview_agent()
    result = run_agent_with_retry(
        interview_agent, prompt, InterviewQuestionsResult, "Interview Coach"
    )

    return result


def generate_feedback(request: InterviewFeedbackRequest) -> InterviewFeedback:
    """Generate feedback on a student's interview answer."""
    job_title = request.job_requirements.get("title", "the target role") if request.job_requirements else "the target role"

    prompt = f"""Evaluate this interview answer and provide detailed feedback.

ROLE: {job_title}
CATEGORY: {request.category}
QUESTION: {request.question}

STUDENT'S ANSWER:
{request.student_answer}

Provide:
- score (0-10)
- 2-3 specific strengths
- 2-3 specific improvements
- A complete improved answer (under 200 words)"""

    interview_agent = get_interview_agent()
    result = run_agent_with_retry(
        interview_agent, prompt, InterviewFeedback, "Interview Coach"
    )

    return result
