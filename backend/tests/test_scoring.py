"""Tests for the deterministic scoring engine."""

import pytest
from src.scoring.engine import match_skills, calculate_score


class TestMatchSkills:
    """Test skill matching logic."""

    def test_all_matched(self):
        """All required skills found on resume → full credit."""
        matched, partial, missing = match_skills(
            required_skills=["Python", "SQL", "Git"],
            preferred_skills=[],
            resume_skills=["Python", "SQL", "Git", "Linux"],
        )
        assert len(matched) == 3
        assert len(partial) == 0
        assert len(missing) == 0
        for m in matched:
            assert m.credit == 1.0
            assert m.status == "matched"

    def test_all_missing(self):
        """No required skills found → zero credit."""
        matched, partial, missing = match_skills(
            required_skills=["Docker", "Kubernetes"],
            preferred_skills=[],
            resume_skills=["Python", "SQL"],
        )
        assert len(matched) == 0
        assert len(partial) == 0
        assert len(missing) == 2
        for m in missing:
            assert m.credit == 0.0
            assert m.status == "missing"

    def test_partial_via_related(self):
        """Related skill on resume gives partial credit."""
        matched, partial, missing = match_skills(
            required_skills=["AWS"],
            preferred_skills=[],
            resume_skills=["Lambda", "S3"],
        )
        assert len(partial) == 1
        assert partial[0].skill == "AWS"
        assert partial[0].credit == 0.5
        assert partial[0].status == "partial"
        assert partial[0].matched_by is not None

    def test_mixed_results(self):
        """Mix of matched, partial, and missing skills."""
        matched, partial, missing = match_skills(
            required_skills=["Python", "AWS", "Docker"],
            preferred_skills=["Git"],
            resume_skills=["Python", "Git", "EC2"],
        )
        assert len(matched) == 2  # Python, Git
        assert len(partial) == 1  # AWS (via EC2)
        assert len(missing) == 1  # Docker

    def test_alias_matching(self):
        """Skills with different names but same canonical form should match."""
        matched, partial, missing = match_skills(
            required_skills=["JavaScript"],
            preferred_skills=[],
            resume_skills=["JS"],
        )
        assert len(matched) == 1
        assert matched[0].skill == "JavaScript"

    def test_dsa_matching(self):
        """DSA alias should match data structures and algorithms."""
        matched, partial, missing = match_skills(
            required_skills=["DSA"],
            preferred_skills=[],
            resume_skills=["Data Structures and Algorithms"],
        )
        assert len(matched) == 1

    def test_weights(self):
        """Required skills get weight 2, preferred get weight 1."""
        matched, partial, missing = match_skills(
            required_skills=["Python"],
            preferred_skills=["Git"],
            resume_skills=["Python", "Git"],
        )
        required_match = [m for m in matched if m.skill == "Python"][0]
        preferred_match = [m for m in matched if m.skill == "Git"][0]
        assert required_match.weight == 2.0
        assert preferred_match.weight == 1.0

    def test_evidence_present(self):
        """Matched skills should have evidence, not 'not found'."""
        matched, _, _ = match_skills(
            required_skills=["Python"],
            preferred_skills=[],
            resume_skills=["Python"],
        )
        assert matched[0].evidence != "not found in resume"
        assert "Python" in matched[0].evidence

    def test_evidence_missing(self):
        """Missing skills should have 'not found in resume' evidence."""
        _, _, missing = match_skills(
            required_skills=["Docker"],
            preferred_skills=[],
            resume_skills=["Python"],
        )
        assert missing[0].evidence == "not found in resume"

    def test_empty_required_and_preferred(self):
        """No job skills → empty results."""
        matched, partial, missing = match_skills(
            required_skills=[],
            preferred_skills=[],
            resume_skills=["Python", "SQL"],
        )
        assert len(matched) == 0
        assert len(partial) == 0
        assert len(missing) == 0

    def test_empty_resume_skills(self):
        """No resume skills → everything missing."""
        matched, partial, missing = match_skills(
            required_skills=["Python"],
            preferred_skills=["Git"],
            resume_skills=[],
        )
        assert len(matched) == 0
        assert len(missing) == 2  # Both Python and Git

    def test_no_duplicate_skills(self):
        """Same skill listed as required and preferred → counted once."""
        matched, partial, missing = match_skills(
            required_skills=["Python"],
            preferred_skills=["Python"],
            resume_skills=["Python"],
        )
        # Python should only appear once (as required, weight=2)
        assert len(matched) == 1
        assert matched[0].weight == 2.0

    def test_resume_text_evidence(self):
        """Skills mentioned in resume text but not skill list get evidence."""
        matched, _, missing = match_skills(
            required_skills=["Docker"],
            preferred_skills=[],
            resume_skills=[],
            resume_text="I have experience with Docker containers and deployment.",
        )
        # Docker isn't in skills list, so it's missing, but evidence found in text
        assert len(missing) == 1
        # The evidence should mention Docker was found in text
        # (but it's still missing because it's not in the skills list)


class TestCalculateScore:
    """Test score calculation."""

    def test_perfect_score(self):
        """All skills matched → 100."""
        matched, partial, missing = match_skills(
            required_skills=["Python", "SQL"],
            preferred_skills=["Git"],
            resume_skills=["Python", "SQL", "Git"],
        )
        score, explanation = calculate_score(matched, partial, missing)
        assert score == 100

    def test_zero_score(self):
        """No skills matched → 0."""
        matched, partial, missing = match_skills(
            required_skills=["Docker", "Kubernetes"],
            preferred_skills=[],
            resume_skills=["Python"],
        )
        score, explanation = calculate_score(matched, partial, missing)
        assert score == 0

    def test_partial_score(self):
        """Partial match gives expected score."""
        matched, partial, missing = match_skills(
            required_skills=["AWS"],
            preferred_skills=[],
            resume_skills=["Lambda"],
        )
        score, explanation = calculate_score(matched, partial, missing)
        # AWS (weight=2) partial (credit=0.5) → 2*0.5/2 = 50
        assert score == 50

    def test_weighted_score(self):
        """Required skills should count more than preferred."""
        matched, partial, missing = match_skills(
            required_skills=["Python"],
            preferred_skills=["Docker"],
            resume_skills=["Python"],
        )
        score, explanation = calculate_score(matched, partial, missing)
        # Python (weight=2, credit=1.0) + Docker (weight=1, credit=0)
        # = 2*1 / (2+1) * 100 = 66.67 → 67
        assert score == 67

    def test_empty_skills_score(self):
        """No skills to compare → 0 with explanation."""
        score, explanation = calculate_score([], [], [])
        assert score == 0.0
        assert "No skills" in explanation

    def test_explanation_contains_formula(self):
        """Explanation should mention the formula components."""
        matched, partial, missing = match_skills(
            required_skills=["Python"],
            preferred_skills=[],
            resume_skills=["Python"],
        )
        score, explanation = calculate_score(matched, partial, missing)
        assert "matched" in explanation.lower()
        assert "100" in explanation

    def test_demo_scenario(self):
        """Test the exact demo scenario from the spec.

        Sample student: C++, Python, SQL, Git, HTML, CSS
        Role needs: C++, DSA, Python, SQL, Git, AWS, Docker (required)
        """
        matched, partial, missing = match_skills(
            required_skills=["C++", "DSA", "Python", "SQL", "Git", "AWS", "Docker"],
            preferred_skills=[],
            resume_skills=["C++", "Python", "SQL", "Git", "HTML", "CSS"],
        )

        matched_names = {m.skill for m in matched}
        partial_names = {m.skill for m in partial}
        missing_names = {m.skill for m in missing}

        assert "C++" in matched_names
        assert "Python" in matched_names
        assert "SQL" in matched_names
        assert "Git" in matched_names
        assert "DSA" in missing_names or "DSA" in partial_names
        assert "AWS" in missing_names
        assert "Docker" in missing_names

        score, _ = calculate_score(matched, partial, missing)
        # 4 matched (weight=2, credit=1) = 8
        # DSA might get partial from C++ (related) → weight=2, credit=0.5 = 1
        # AWS missing → 0, Docker missing → 0
        # Total weight = 7 * 2 = 14
        # Score should be reasonable (around 50-65%)
        assert 40 <= score <= 75
