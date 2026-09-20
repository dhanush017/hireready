"""Plan service: orchestrates the Planner Agent to generate roadmap and project."""

from __future__ import annotations

import logging

from ..agents.factory import get_planner_agent
from ..schemas.plan import PlanRequest, PlanResult
from ..utils.agent_runner import run_agent_with_retry

logger = logging.getLogger(__name__)


def run_plan(request: PlanRequest) -> PlanResult:
    """Generate a 4-week roadmap and project recommendation.

    Args:
        request: Contains the analysis results (skills, gaps, score).

    Returns:
        PlanResult with roadmap items and a recommended project.
    """
    # Build a focused prompt with the analysis context
    gaps_summary = ""
    for gap in request.gaps:
        status = gap.get("status", "unknown")
        skill = gap.get("skill", "unknown")
        priority = gap.get("priority", "medium")
        gaps_summary += f"- {skill} ({status}, priority: {priority})\n"

    if not gaps_summary:
        gaps_summary = "No specific gaps identified.\n"

    matched_summary = ", ".join(
        s.get("skill", "") for s in request.matched_skills
    ) or "None"
    partial_summary = ", ".join(
        s.get("skill", "") for s in request.partial_skills
    ) or "None"
    missing_summary = ", ".join(
        s.get("skill", "") for s in request.missing_skills
    ) or "None"

    job_title = request.job_requirements.get("title", "the target role")

    prompt = f"""Create a 4-week learning roadmap and recommend one project for this candidate.

TARGET ROLE: {job_title}
MATCH SCORE: {request.score}/100

MATCHED SKILLS: {matched_summary}
PARTIALLY MATCHED: {partial_summary}
MISSING SKILLS: {missing_summary}

SKILL GAPS (prioritized):
{gaps_summary}

CANDIDATE BACKGROUND:
- Education: {', '.join(request.resume_profile.get('education', [])) or 'Not specified'}
- Current Skills: {', '.join(request.resume_profile.get('skills', [])) or 'Not specified'}
- Projects: {', '.join(request.resume_profile.get('projects', [])) or 'None listed'}

Focus the roadmap on closing the highest-priority gaps first. The project should use skills the candidate already has while building new ones they need."""

    planner_agent = get_planner_agent()
    result = run_agent_with_retry(
        planner_agent, prompt, PlanResult, "Planner Agent"
    )

    return result
