"""Tests for the skill alias normalization system."""

import pytest
from src.scoring.aliases import normalize_skill


class TestNormalizeSkill:
    """Test skill normalization through the alias map."""

    def test_exact_canonical(self):
        """Canonical names should normalize to themselves."""
        assert normalize_skill("python") == "python"
        assert normalize_skill("javascript") == "javascript"
        assert normalize_skill("docker") == "docker"

    def test_case_insensitive(self):
        """Normalization should be case-insensitive."""
        assert normalize_skill("Python") == "python"
        assert normalize_skill("JAVASCRIPT") == "javascript"
        assert normalize_skill("Docker") == "docker"

    def test_common_aliases(self):
        """Common aliases should resolve to canonical forms."""
        assert normalize_skill("js") == "javascript"
        assert normalize_skill("ts") == "typescript"
        assert normalize_skill("cpp") == "c++"
        assert normalize_skill("py") == "python"
        assert normalize_skill("k8s") == "kubernetes"
        assert normalize_skill("golang") == "go"

    def test_dsa_aliases(self):
        """DSA variations should all normalize to the same canonical form."""
        canonical = "data structures and algorithms"
        assert normalize_skill("DSA") == canonical
        assert normalize_skill("data structures") == canonical
        assert normalize_skill("algorithms") == canonical
        assert normalize_skill("ds and algo") == canonical

    def test_framework_aliases(self):
        """Framework name variations should normalize correctly."""
        assert normalize_skill("reactjs") == "react"
        assert normalize_skill("react.js") == "react"
        assert normalize_skill("nodejs") == "node.js"
        assert normalize_skill("node") == "node.js"
        assert normalize_skill("nextjs") == "next.js"

    def test_sql_aliases(self):
        """SQL variations should normalize to sql."""
        assert normalize_skill("mysql") == "sql"
        assert normalize_skill("postgresql") == "sql"
        assert normalize_skill("postgres") == "sql"
        assert normalize_skill("sqlite") == "sql"

    def test_aws_alias(self):
        """AWS full name should normalize."""
        assert normalize_skill("amazon web services") == "aws"

    def test_unknown_skill(self):
        """Unknown skills should return lowercased input."""
        assert normalize_skill("SomeNewTech") == "somenewtechnology" or normalize_skill("SomeNewTech") == "somenewtech"
        assert normalize_skill("  Blockchain  ") == "blockchain"

    def test_whitespace_handling(self):
        """Leading/trailing whitespace should be stripped."""
        assert normalize_skill("  python  ") == "python"
        assert normalize_skill("\tjavascript\n") == "javascript"

    def test_oop_aliases(self):
        """OOP variations should normalize correctly."""
        canonical = "object oriented programming"
        assert normalize_skill("OOP") == canonical
        assert normalize_skill("OOPS") == canonical

    def test_ml_aliases(self):
        """Machine learning aliases should normalize."""
        assert normalize_skill("ML") == "machine learning"
        assert normalize_skill("DL") == "deep learning"
        assert normalize_skill("NLP") == "natural language processing"

    def test_cicd_aliases(self):
        """CI/CD aliases should normalize."""
        assert normalize_skill("cicd") == "ci/cd"
        assert normalize_skill("continuous integration") == "ci/cd"

    def test_cloud_aliases(self):
        """Cloud provider aliases should normalize."""
        assert normalize_skill("google cloud") == "gcp"
        assert normalize_skill("microsoft azure") == "azure"
