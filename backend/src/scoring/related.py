"""Related-skills map for partial credit.

If a required skill is not directly found on the resume, but a related
skill IS found, the candidate gets partial credit (0.5).

Keys are canonical skill names. Values are lists of canonical skill names
that provide partial credit for the key skill.
"""

# canonical_skill -> list of canonical skills that give partial credit
RELATED_SKILLS: dict[str, list[str]] = {
    "aws": ["s3", "ec2", "lambda", "api gateway", "cloudformation", "iam", "sqs", "sns", "rds"],
    "docker": ["kubernetes", "ci/cd"],
    "kubernetes": ["docker", "ci/cd"],
    "ci/cd": ["jenkins", "github", "gitlab"],
    "react": ["next.js", "javascript", "typescript"],
    "angular": ["typescript", "javascript"],
    "vue": ["javascript", "typescript"],
    "next.js": ["react", "javascript", "typescript"],
    "node.js": ["javascript", "express", "typescript"],
    "express": ["node.js", "javascript"],
    "django": ["python", "flask"],
    "flask": ["python", "django"],
    "fastapi": ["python", "flask"],
    "spring": ["java"],
    "machine learning": ["deep learning", "data science", "python", "tensorflow", "pytorch", "scikit-learn"],
    "deep learning": ["machine learning", "tensorflow", "pytorch"],
    "data science": ["machine learning", "python", "pandas", "numpy"],
    "natural language processing": ["machine learning", "deep learning", "python"],
    "computer vision": ["machine learning", "deep learning", "python"],
    "tensorflow": ["pytorch", "machine learning", "deep learning"],
    "pytorch": ["tensorflow", "machine learning", "deep learning"],
    "sql": ["nosql"],
    "nosql": ["sql"],
    "linux": ["docker", "git"],
    "terraform": ["cloudformation", "aws", "ansible"],
    "ansible": ["terraform"],
    "data structures and algorithms": ["c++", "java", "python"],
    "rest api": ["fastapi", "express", "flask", "django", "spring"],
    "graphql": ["rest api"],
    "gcp": ["aws", "azure"],
    "azure": ["aws", "gcp"],
    "python": ["django", "flask", "fastapi"],
    "javascript": ["typescript", "react", "node.js", "angular", "vue"],
    "typescript": ["javascript"],
    "java": ["spring", "kotlin"],
    "c++": ["c"],
    "c": ["c++"],
}


def get_related_skills(canonical_skill: str) -> list[str]:
    """Return list of canonical skills that give partial credit for the given skill."""
    return RELATED_SKILLS.get(canonical_skill.lower().strip(), [])
