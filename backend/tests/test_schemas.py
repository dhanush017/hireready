"""Tests for Pydantic schema validation."""

import pytest
from src.schemas.analyze import (
    AnalysisResult,
    AnalyzeRequest,
    GapDetail,
    JobRequirements,
    ResumeProfile,
    SkillMatch,
)
from src.schemas.plan import PlanRequest, PlanResult, RecommendedProject, RoadmapItem
from src.schemas.interview import (
    InterviewFeedback,
    InterviewFeedbackRequest,
    InterviewQuestion,
    InterviewQuestionsRequest,
    InterviewQuestionsResult,
)


class TestResumeProfile:
    """Test ResumeProfile schema validation."""

    def test_minimal_profile(self):
        """Profile with only required fields (all have defaults)."""
        profile = ResumeProfile()
        assert profile.name is None
        assert profile.skills == []

    def test_full_profile(self):
        """Profile with all fields populated."""
        profile = ResumeProfile(
            name="John Doe",
            email="john@example.com",
            education=["B.Tech CSE, XYZ University"],
            skills=["Python", "SQL", "Git"],
            experience=["Intern at TechCo"],
            projects=["Built a web scraper"],
            certifications=["AWS Cloud Practitioner"],
            summary="CS student with Python skills",
        )
        assert profile.name == "John Doe"
        assert len(profile.skills) == 3

    def test_null_optional_fields(self):
        """Null values should be accepted for optional fields."""
        profile = ResumeProfile(name=None, email=None, summary=None)
        assert profile.name is None


class TestJobRequirements:
    """Test JobRequirements schema validation."""

    def test_with_skills(self):
        """Job requirements with separated required/preferred skills."""
        req = JobRequirements(
            title="Software Engineer Intern",
            required_skills=["Python", "SQL"],
            preferred_skills=["Docker"],
        )
        assert len(req.required_skills) == 2
        assert len(req.preferred_skills) == 1


class TestSkillMatch:
    """Test SkillMatch schema validation."""

    def test_matched_skill(self):
        """Valid matched skill."""
        match = SkillMatch(
            skill="Python",
            status="matched",
            weight=2.0,
            credit=1.0,
            evidence="Found 'Python' in resume skills",
        )
        assert match.status == "matched"

    def test_missing_skill(self):
        """Valid missing skill."""
        match = SkillMatch(
            skill="Docker",
            status="missing",
            weight=2.0,
            credit=0.0,
            evidence="not found in resume",
        )
        assert match.evidence == "not found in resume"


class TestAnalyzeRequest:
    """Test AnalyzeRequest schema validation."""

    def test_text_resume(self):
        """Request with text resume."""
        req = AnalyzeRequest(
            resume_text="John Doe\nPython, SQL",
            job_description="Looking for Python developer",
        )
        assert req.resume_text is not None
        assert req.resume_base64 is None

    def test_pdf_resume(self):
        """Request with base64 PDF."""
        req = AnalyzeRequest(
            resume_base64="dGVzdA==",
            job_description="Looking for Python developer",
        )
        assert req.resume_base64 is not None


class TestPlanResult:
    """Test PlanResult schema validation."""

    def test_valid_plan(self):
        """Valid plan with roadmap and project."""
        plan = PlanResult(
            roadmap=[
                RoadmapItem(
                    week=1,
                    topic="Learn Docker basics",
                    reason="Required for the role",
                    estimated_effort="5-8 hours",
                    expected_outcome="Can containerize a Python app",
                ),
            ],
            project=RecommendedProject(
                name="Dockerized API",
                why="Covers Docker and deployment skills",
                skills_covered=["Docker", "Python"],
                difficulty="intermediate",
                duration="2 weeks",
                tech_stack=["Docker", "Python", "FastAPI"],
            ),
        )
        assert len(plan.roadmap) == 1
        assert plan.project.name == "Dockerized API"


class TestInterviewSchemas:
    """Test interview-related schemas."""

    def test_question(self):
        """Valid interview question."""
        q = InterviewQuestion(
            id=1,
            category="technical",
            question="Explain how dictionaries work in Python.",
            context="Python is a required skill",
        )
        assert q.category == "technical"

    def test_feedback_score_bounds(self):
        """Score must be 0-10."""
        feedback = InterviewFeedback(
            score=7,
            strengths=["Good explanation"],
            improvements=["Add an example"],
            improved_answer="A better answer...",
        )
        assert feedback.score == 7

    def test_feedback_score_too_high(self):
        """Score > 10 should fail validation."""
        with pytest.raises(Exception):
            InterviewFeedback(
                score=11,
                strengths=["Good"],
                improvements=["Better"],
                improved_answer="Answer",
            )

    def test_feedback_score_negative(self):
        """Negative score should fail validation."""
        with pytest.raises(Exception):
            InterviewFeedback(
                score=-1,
                strengths=["Good"],
                improvements=["Better"],
                improved_answer="Answer",
            )
