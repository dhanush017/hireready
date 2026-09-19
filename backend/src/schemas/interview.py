"""Pydantic schemas for the /api/interview/* endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class InterviewQuestion(BaseModel):
    """A single interview question."""

    id: int = Field(description="Question number (1-5)")
    category: str = Field(
        description="resume | technical | dsa | project | behavioral"
    )
    question: str = Field(description="The interview question text")
    context: str = Field(
        description="Brief context about why this question is relevant"
    )


class InterviewQuestionsResult(BaseModel):
    """Response from /api/interview/questions."""

    questions: list[InterviewQuestion] = Field(
        description="5 interview questions across categories"
    )


class InterviewFeedback(BaseModel):
    """Feedback on a student's answer."""

    score: int = Field(ge=0, le=10, description="Score out of 10")
    strengths: list[str] = Field(description="What the student did well")
    improvements: list[str] = Field(description="Areas for improvement")
    improved_answer: str = Field(description="A better version of the answer")


class InterviewQuestionsRequest(BaseModel):
    """Request body for /api/interview/questions."""

    resume_profile: dict = Field(description="Resume profile from analysis")
    job_requirements: dict = Field(description="Job requirements from analysis")
    gaps: list[dict] = Field(default_factory=list)
    roadmap: list[dict] = Field(default_factory=list)
    project: dict = Field(default_factory=dict)


class InterviewFeedbackRequest(BaseModel):
    """Request body for /api/interview/feedback."""

    question: str = Field(description="The interview question")
    category: str = Field(description="Question category")
    student_answer: str = Field(description="The student's answer")
    resume_profile: dict = Field(default_factory=dict)
    job_requirements: dict = Field(default_factory=dict)
