"""Pydantic schemas for the /api/plan endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field


class RoadmapItem(BaseModel):
    """A single item in the 4-week roadmap."""

    week: int = Field(description="Week number (1-4)")
    topic: str = Field(description="What to learn or practice")
    reason: str = Field(description="Why this topic matters for the role")
    estimated_effort: str = Field(description="e.g. '5-8 hours'")
    expected_outcome: str = Field(description="What you'll be able to do after this")


class RecommendedProject(BaseModel):
    """One recommended project to build."""

    name: str = Field(description="Project name")
    why: str = Field(description="Why this project helps close skill gaps")
    skills_covered: list[str] = Field(description="Skills this project develops")
    difficulty: str = Field(description="beginner | intermediate | advanced")
    duration: str = Field(description="Estimated time to complete, e.g. '2-3 weeks'")
    tech_stack: list[str] = Field(description="Technologies used in this project")


class PlanResult(BaseModel):
    """Full plan response returned by /api/plan."""

    roadmap: list[RoadmapItem] = Field(description="4-week learning roadmap")
    project: RecommendedProject = Field(description="One recommended project")


class PlanRequest(BaseModel):
    """Request body for /api/plan."""

    resume_profile: dict = Field(description="Resume profile from analysis")
    job_requirements: dict = Field(description="Job requirements from analysis")
    matched_skills: list[dict] = Field(default_factory=list)
    partial_skills: list[dict] = Field(default_factory=list)
    missing_skills: list[dict] = Field(default_factory=list)
    gaps: list[dict] = Field(default_factory=list)
    score: float = Field(description="Match score from analysis")
