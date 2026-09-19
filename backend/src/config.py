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

    Uses BedrockModel by default (or when AWS credentials / Lambda are present).
    For local development when Bedrock access is unavailable, automatically
    falls back to Groq or OpenAI if their API keys are present, as documented
    in the hackathon requirements.
    """
    settings = get_settings()

    # Explicit override via environment variable
    provider = os.environ.get("MODEL_PROVIDER", "").lower()

    if provider == "groq" or (not provider and os.environ.get("GROQ_API_KEY")):
        import boto3
        # If AWS credentials exist and provider wasn't explicitly set to groq, use Bedrock
        has_aws = False
        try:
            has_aws = bool(
                os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
                or boto3.Session().get_credentials()
            )
        except Exception:
            has_aws = False

        if not has_aws or provider == "groq":
            from strands.models.openai import OpenAIModel

            groq_key = os.environ.get("GROQ_API_KEY")
            if groq_key:
                return OpenAIModel(
                    model_id=os.environ.get("GROQ_MODEL_ID", "qwen/qwen3.8-27b"),
                    client_args={
                        "base_url": "https://api.groq.com/openai/v1",
                        "api_key": groq_key,
                    },
                )

    if provider == "openai" or (not provider and os.environ.get("OPENAI_API_KEY")):
        from strands.models.openai import OpenAIModel

        return OpenAIModel(
            model_id=os.environ.get("OPENAI_MODEL_ID", "gpt-4o-mini"),
        )

    # Default: Amazon Bedrock
    from strands.models.bedrock import BedrockModel

    return BedrockModel(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_region,
    )

