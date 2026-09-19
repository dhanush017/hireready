"""HireReady AI backend configuration.

Single source of truth for model and environment settings.
Swap the model provider here for local development without Bedrock.
"""

import os
from functools import lru_cache


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        self.bedrock_model_id: str = os.environ.get(
            "BEDROCK_MODEL_ID", "amazon.nova-lite-v1:0"
        )
        self.aws_region: str = os.environ.get("AWS_REGION", "us-east-1")
        self.cors_origin: str = os.environ.get("CORS_ORIGIN", "*")
        self.max_resume_bytes: int = 2 * 1024 * 1024  # 2 MB
        self.max_input_chars: int = 15_000  # Truncate long inputs
        self.max_jd_chars: int = 10_000


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def get_model():
    """Create the Strands model provider.

    Uses BedrockModel by default. To use a different provider for local
    development (e.g., when Bedrock access is unavailable), change this
    function only — all agents use whatever this returns.
    """
    from strands.models.bedrock import BedrockModel

    settings = get_settings()
    return BedrockModel(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_region,
    )
