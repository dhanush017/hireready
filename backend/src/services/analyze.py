"""Analyze service: orchestrates resume parsing, job parsing, and scoring."""

from __future__ import annotations

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from ..agents.factory import get_resume_agent, get_job_agent
from ..schemas.analyze import (
    AnalysisResult,
    AnalyzeRequest,
    GapDetail,
    JobRequirements,
    ResumeProfile,
    SkillMatch,
)
from ..scoring.engine import calculate_score, match_skills
from ..utils.pdf import PDFExtractionError, extract_text_from_base64
from ..utils.validation import (
    ValidationError,
    validate_and_truncate_text,
    validate_resume_input,
)

logger = logging.getLogger(__name__)


def _run_agent_with_retry(agent, prompt: str, output_model, agent_name: str):
    """Run a Strands agent with structured output and one retry on failure."""
    try:
        result = agent.structured_output(
            prompt=prompt,
            output_model=output_model,
        )
        return result
    except Exception as first_error:
        logger.warning(f"{agent_name} first attempt failed: {first_error}")
        try:
            correction_prompt = (
                f"{prompt}\n\n"
                f"IMPORTANT: Your previous response was invalid. "
                f"Error: {first_error}. "
                f"Please respond with valid JSON matching the required schema exactly."
            )
            result = agent.structured_output(
                prompt=correction_prompt,
                output_model=output_model,
            )
            return result
        except Exception as second_error:
            logger.error(f"{agent_name} retry also failed: {second_error}")
            raise ValueError(
                f"{agent_name} could not produce valid output after retry. "
                f"Error: {second_error}"
            )


def _generate_gap_details(
    partial: list[SkillMatch],
    missing: list[SkillMatch],
    job_title: str | None,
) -> list[GapDetail]:
    """Generate gap details for partial and missing skills."""
    gaps: list[GapDetail] = []
    role_context = f" for {job_title}" if job_title else ""

    for skill_match in missing:
        priority = "high" if skill_match.weight == 2.0 else "medium"
        gaps.append(
            GapDetail(
                skill=skill_match.skill,
                status="missing",
                why_it_matters=f"{skill_match.skill} is {'required' if skill_match.weight == 2.0 else 'preferred'}{role_context}",
                evidence=skill_match.evidence,
                how_to_fix=f"Learn {skill_match.skill} through tutorials, courses, or hands-on projects",
                priority=priority,
            )
        )

    for skill_match in partial:
        gaps.append(
            GapDetail(
                skill=skill_match.skill,
                status="partial",
                why_it_matters=f"{skill_match.skill} is {'required' if skill_match.weight == 2.0 else 'preferred'}{role_context}",
                evidence=skill_match.evidence,
                how_to_fix=f"Build on your {skill_match.matched_by} experience to learn {skill_match.skill} specifically",
                priority="medium",
            )
        )

    # Sort by priority: high first
    priority_order = {"high": 0, "medium": 1, "low": 2}
    gaps.sort(key=lambda g: priority_order.get(g.priority, 2))

    return gaps


def run_analysis(request: AnalyzeRequest) -> AnalysisResult:
    """Run the full analysis pipeline.

    Steps:
    1. Validate inputs
    2. Extract PDF text if needed
    3. Run Resume Agent and Job Agent (in parallel)
    4. Run deterministic skill matcher
    5. Generate gap details
    6. Return structured result
    """
    # 1. Validate inputs
    validate_resume_input(request.resume_text, request.resume_base64)

    # 2. Extract resume text
    resume_text = request.resume_text
    if request.resume_base64:
        resume_text = extract_text_from_base64(request.resume_base64)

    resume_text, resume_warning = validate_and_truncate_text(
        resume_text, field_name="Resume"
    )
    jd_text, jd_warning = validate_and_truncate_text(
        request.job_description, field_name="Job description"
    )

    # 3. Run agents in parallel
    resume_agent = get_resume_agent()
    job_agent = get_job_agent()

    resume_prompt = f"Extract structured information from this resume:\n\n{resume_text}"
    job_prompt = f"Extract structured requirements from this job description:\n\n{jd_text}"

    resume_profile = None
    job_requirements = None
    errors = []

    with ThreadPoolExecutor(max_workers=2) as executor:
        future_resume = executor.submit(
            _run_agent_with_retry,
            resume_agent, resume_prompt, ResumeProfile, "Resume Agent",
        )
        future_job = executor.submit(
            _run_agent_with_retry,
            job_agent, job_prompt, JobRequirements, "Job Agent",
        )

        for future in as_completed([future_resume, future_job]):
            try:
                result = future.result()
                if isinstance(result, ResumeProfile):
                    resume_profile = result
                elif isinstance(result, JobRequirements):
                    job_requirements = result
            except Exception as e:
                errors.append(str(e))

    if future_resume.done() and not future_resume.exception():
        resume_profile = future_resume.result()
    if future_job.done() and not future_job.exception():
        job_requirements = future_job.result()

    if errors:
        raise ValueError(f"Agent errors: {'; '.join(errors)}")

    if resume_profile is None or job_requirements is None:
        raise ValueError("Failed to parse resume or job description")

    # 4. Run skill matcher
    matched, partial, missing = match_skills(
        required_skills=job_requirements.required_skills,
        preferred_skills=job_requirements.preferred_skills,
        resume_skills=resume_profile.skills,
        resume_text=resume_text,
    )

    # 5. Calculate score
    score, score_explanation = calculate_score(matched, partial, missing)

    # 6. Generate gap details
    gaps = _generate_gap_details(partial, missing, job_requirements.title)

    # Add warnings to explanation if inputs were truncated
    warnings = [w for w in [resume_warning, jd_warning] if w]
    if warnings:
        score_explanation += " Note: " + "; ".join(warnings) + "."

    return AnalysisResult(
        resume_profile=resume_profile,
        job_requirements=job_requirements,
        score=score,
        score_explanation=score_explanation,
        matched_skills=matched,
        partial_skills=partial,
        missing_skills=missing,
        gaps=gaps,
    )
