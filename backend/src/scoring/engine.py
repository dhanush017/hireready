"""Deterministic scoring engine for resume-to-job matching.

Score formula:
  score = (sum(weight * credit) / sum(weight)) * 100, rounded to nearest integer

Weights: required skill = 2, preferred skill = 1
Credits: matched = 1.0, partial = 0.5, missing = 0.0
"""

from __future__ import annotations

from ..schemas.analyze import SkillMatch
from .aliases import normalize_skill
from .related import get_related_skills


def _find_evidence(skill: str, resume_skills: list[str], resume_text_lower: str) -> str:
    """Find evidence for a skill in the resume.

    Returns a human-readable evidence string. Never invents evidence.
    """
    normalized = normalize_skill(skill)

    # Check if the skill appears directly in the resume skills list
    for rs in resume_skills:
        if normalize_skill(rs) == normalized:
            return f"Found '{rs}' in resume skills"

    # Check if the raw skill name appears in resume text
    if skill.lower() in resume_text_lower:
        return f"Found reference to '{skill}' in resume text"

    return "not found in resume"


def _find_partial_match(
    skill: str,
    resume_skills_normalized: set[str],
    resume_skills_raw: list[str],
) -> tuple[str | None, str]:
    """Check if any related skill provides partial credit.

    Returns (matched_by_skill, evidence) or (None, "not found").
    """
    canonical = normalize_skill(skill)
    related = get_related_skills(canonical)

    for related_skill in related:
        if related_skill in resume_skills_normalized:
            # Find the raw skill name for evidence
            for rs in resume_skills_raw:
                if normalize_skill(rs) == related_skill:
                    return (
                        rs,
                        f"Related skill '{rs}' found in resume (partial credit for '{skill}')",
                    )
            return (related_skill, f"Related skill '{related_skill}' provides partial credit")

    return None, "not found in resume"


def match_skills(
    required_skills: list[str],
    preferred_skills: list[str],
    resume_skills: list[str],
    resume_text: str = "",
) -> tuple[list[SkillMatch], list[SkillMatch], list[SkillMatch]]:
    """Match job skills against resume skills.

    Returns (matched, partial, missing) lists of SkillMatch objects.
    """
    resume_skills_normalized = {normalize_skill(s) for s in resume_skills}
    resume_text_lower = resume_text.lower()

    matched: list[SkillMatch] = []
    partial: list[SkillMatch] = []
    missing: list[SkillMatch] = []

    seen_normalized: set[str] = set()

    def process_skill(skill: str, weight: float) -> None:
        normalized = normalize_skill(skill)

        # Avoid duplicates
        if normalized in seen_normalized:
            return
        seen_normalized.add(normalized)

        # Direct match
        if normalized in resume_skills_normalized:
            evidence = _find_evidence(skill, resume_skills, resume_text_lower)
            matched.append(
                SkillMatch(
                    skill=skill,
                    status="matched",
                    weight=weight,
                    credit=1.0,
                    evidence=evidence,
                    matched_by=None,
                )
            )
            return

        # Partial match via related skills
        matched_by, evidence = _find_partial_match(
            skill, resume_skills_normalized, resume_skills
        )
        if matched_by:
            partial.append(
                SkillMatch(
                    skill=skill,
                    status="partial",
                    weight=weight,
                    credit=0.5,
                    evidence=evidence,
                    matched_by=matched_by,
                )
            )
            return

        # No match
        evidence = _find_evidence(skill, resume_skills, resume_text_lower)
        missing.append(
            SkillMatch(
                skill=skill,
                status="missing",
                weight=weight,
                credit=0.0,
                evidence=evidence,
                matched_by=None,
            )
        )

    for skill in required_skills:
        process_skill(skill, weight=2.0)

    for skill in preferred_skills:
        process_skill(skill, weight=1.0)

    return matched, partial, missing


def calculate_score(
    matched: list[SkillMatch],
    partial: list[SkillMatch],
    missing: list[SkillMatch],
) -> tuple[float, str]:
    """Calculate the match score and generate a plain-language explanation.

    Returns (score, explanation).
    """
    all_skills = matched + partial + missing

    if not all_skills:
        return 0.0, "No skills to compare. The job description may not list specific skill requirements."

    total_weight = sum(s.weight for s in all_skills)
    if total_weight == 0:
        return 0.0, "No weighted skills found."

    weighted_credit = sum(s.weight * s.credit for s in all_skills)
    score = round((weighted_credit / total_weight) * 100)

    # Build explanation
    n_required = sum(1 for s in all_skills if s.weight == 2.0)
    n_preferred = sum(1 for s in all_skills if s.weight == 1.0)
    n_matched = len(matched)
    n_partial = len(partial)
    n_missing = len(missing)

    explanation = (
        f"Score: {score}/100. "
        f"We compared {len(all_skills)} skills from the job description against your resume. "
        f"Required skills (weight 2×) count twice as much as preferred skills (weight 1×). "
        f"Result: {n_matched} matched (full credit), {n_partial} partially matched "
        f"(half credit from related skills), {n_missing} missing (no credit). "
        f"Formula: (sum of weight × credit) / (sum of weights) × 100 = "
        f"{weighted_credit:.1f} / {total_weight:.1f} × 100 = {score}."
    )

    return float(score), explanation
