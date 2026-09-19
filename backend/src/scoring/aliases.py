"""Skill alias normalization map.

Maps common variations and abbreviations to a single canonical form.
All keys and values are lowercase. When comparing skills, normalize both
sides through this map before comparison.
"""

# Canonical form -> list of aliases (all lowercase)
ALIAS_MAP_RAW: dict[str, list[str]] = {
    "python": ["python3", "python 3", "py"],
    "javascript": ["js", "es6", "ecmascript", "vanilla js"],
    "typescript": ["ts"],
    "c++": ["cpp", "c plus plus", "cplusplus"],
    "c#": ["csharp", "c sharp"],
    "c": [],
    "java": [],
    "go": ["golang"],
    "rust": [],
    "ruby": [],
    "php": [],
    "swift": [],
    "kotlin": [],
    "r": ["r language", "r programming"],
    "sql": ["mysql", "postgresql", "postgres", "sqlite", "mssql", "t-sql", "tsql", "plsql", "pl/sql"],
    "nosql": ["mongodb", "mongo", "dynamodb", "cassandra", "couchdb", "firebase"],
    "html": ["html5"],
    "css": ["css3", "cascading style sheets"],
    "react": ["reactjs", "react.js", "react js"],
    "angular": ["angularjs", "angular.js", "angular js"],
    "vue": ["vuejs", "vue.js", "vue js"],
    "svelte": ["sveltekit"],
    "next.js": ["nextjs", "next js", "next"],
    "node.js": ["nodejs", "node js", "node"],
    "express": ["expressjs", "express.js"],
    "django": [],
    "flask": [],
    "fastapi": ["fast api"],
    "spring": ["spring boot", "springboot"],
    "aws": ["amazon web services"],
    "azure": ["microsoft azure"],
    "gcp": ["google cloud", "google cloud platform"],
    "docker": [],
    "kubernetes": ["k8s", "kube"],
    "git": [],
    "github": [],
    "gitlab": [],
    "linux": ["unix", "ubuntu", "debian", "centos", "fedora"],
    "ci/cd": ["cicd", "ci cd", "continuous integration", "continuous deployment"],
    "rest api": ["restful", "rest apis", "restful api", "restful apis"],
    "graphql": ["graph ql"],
    "machine learning": ["ml"],
    "deep learning": ["dl"],
    "artificial intelligence": ["ai"],
    "natural language processing": ["nlp"],
    "computer vision": ["cv"],
    "data structures and algorithms": ["dsa", "data structures", "algorithms", "ds and algo", "ds & algo"],
    "object oriented programming": ["oop", "oops", "object-oriented programming"],
    "data science": [],
    "pandas": [],
    "numpy": [],
    "tensorflow": ["tf"],
    "pytorch": ["torch"],
    "scikit-learn": ["sklearn", "scikit learn"],
    "redis": [],
    "kafka": ["apache kafka"],
    "rabbitmq": ["rabbit mq"],
    "terraform": [],
    "ansible": [],
    "jenkins": [],
    "nginx": [],
    "apache": [],
    "agile": ["scrum", "kanban"],
    "jira": [],
    "figma": [],
    "tailwind": ["tailwindcss", "tailwind css"],
    "bootstrap": [],
    "sass": ["scss"],
    "webpack": [],
    "vite": [],
    "jest": [],
    "pytest": [],
    "selenium": [],
    "cypress": [],
    "power bi": ["powerbi"],
    "tableau": [],
    "excel": ["ms excel", "microsoft excel"],
    "s3": ["amazon s3", "aws s3"],
    "ec2": ["amazon ec2", "aws ec2"],
    "lambda": ["aws lambda", "amazon lambda"],
    "api gateway": ["aws api gateway", "amazon api gateway"],
    "cloudformation": ["aws cloudformation"],
    "iam": ["aws iam"],
    "sqs": ["amazon sqs", "aws sqs"],
    "sns": ["amazon sns", "aws sns"],
    "rds": ["amazon rds", "aws rds"],
}


def _build_lookup() -> dict[str, str]:
    """Build a reverse lookup: alias -> canonical form."""
    lookup: dict[str, str] = {}
    for canonical, aliases in ALIAS_MAP_RAW.items():
        canonical_lower = canonical.lower().strip()
        lookup[canonical_lower] = canonical_lower
        for alias in aliases:
            lookup[alias.lower().strip()] = canonical_lower
    return lookup


ALIAS_LOOKUP: dict[str, str] = _build_lookup()


def normalize_skill(skill: str) -> str:
    """Normalize a skill name to its canonical form.

    Returns the canonical form if found in the alias map,
    otherwise returns the lowercased, stripped input.
    """
    key = skill.lower().strip()
    return ALIAS_LOOKUP.get(key, key)
