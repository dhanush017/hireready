"""Pydantic schemas for the /api/analyze endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field


# --- Agent Output Schemas (what the LLM must return) ---

class ResumeProfile(BaseModel):
    """Structured profile extracted from a resume by the Resume Agent."""

    name: str | None = Field(None, description="Candidate name")
    email: str | None = Field(None, description="Candidate email")
    education: list[str] = Field(default_factory=list, description="Education entries")
    skills: list[str] = Field(default_factory=list, description="Technical skills found")
    experience: list[str] = Field(
        default_factory=list, description="Work/internship experience summaries"
    )
    projects: list[str] = Field(default_factory=list, description="Project summaries")
    certifications: list[str] = Field(default_factory=list, description="Certifications")
    summary: str | None = Field(None, description="Brief candidate summary")


class JobRequirements(BaseModel):
    """Structured requirements extracted from a job description by the Job Agent."""

    title: str | None = Field(None, description="Job title")
    company: str | None = Field(None, description="Company name")
    required_skills: list[str] = Field(
        default_factory=list, description="Required technical skills"
    )
    preferred_skills: list[str] = Field(
        default_factory=list, description="Preferred/nice-to-have skills"
    )
    responsibilities: list[str] = Field(
        default_factory=list, description="Key responsibilities"
    )
    qualifications: list[str] = Field(
        default_factory=list, description="Education/experience qualifications"
    )


# --- Scoring Engine Output ---

class SkillMatch(BaseModel):
    """A single skill match result."""

    skill: str = Field(description="Normalized skill name")
    status: str = Field(description="matched | partial | missing")
    weight: float = Field(description="Skill weight (2=required, 1=preferred)")
    credit: float = Field(description="Credit awarded (1.0, 0.5, or 0.0)")
    evidence: str = Field(
        description="Evidence from resume, or 'not found in resume'"
    )
    matched_by: str | None = Field(
        None,
        description="If partial, which related skill on the resume provided credit",
    )


class GapDetail(BaseModel):
    """Details about a skill gap for the candidate."""

    skill: str = Field(description="The missing or partially matched skill")
    status: str = Field(description="partial | missing")
    why_it_matters: str = Field(description="Why this skill matters for the role")
    evidence: str = Field(description="What was found (or not) in the resume")
    how_to_fix: str = Field(description="Actionable suggestion to close the gap")
    priority: str = Field(description="high | medium | low")


class AnalysisResult(BaseModel):
    """Full analysis response returned by /api/analyze."""

    resume_profile: ResumeProfile
    job_requirements: JobRequirements
    score: float = Field(description="Match score 0-100, rounded")
    score_explanation: str = Field(
        description="Plain-language explanation of how the score was calculated"
    )
    matched_skills: list[SkillMatch] = Field(default_factory=list)
    partial_skills: list[SkillMatch] = Field(default_factory=list)
    missing_skills: list[SkillMatch] = Field(default_factory=list)
    gaps: list[GapDetail] = Field(default_factory=list)
    disclaimer: str = Field(
        default="This score is an estimate based on resume evidence, not a hiring prediction.",
        description="Disclaimer about score limitations",
    )


# --- Request Schema ---

class AnalyzeRequest(BaseModel):
    """Request body for /api/analyze."""

    resume_text: str | None = Field(
        None, description="Plain text resume content"
    )
    resume_base64: str | None = Field(
        None, description="Base64-encoded PDF resume"
    )
    job_description: str = Field(description="Job description text")
