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


def is_groq_provider() -> bool:
    """Return True only when Groq is explicitly enabled via MODEL_PROVIDER=groq.

    Groq is never selected implicitly. The deployed Lambda leaves MODEL_PROVIDER
    unset and therefore always uses Amazon Bedrock.
    """
    return os.environ.get("MODEL_PROVIDER", "").lower() == "groq"


def get_model():
    """Create the Strands model provider.

    Amazon Bedrock (Nova Lite) is the default and is what the deployed Lambda
    uses. Alternative providers are opt-in and only activate when MODEL_PROVIDER
    is explicitly set:
      - MODEL_PROVIDER=groq   -> Groq (local development without Bedrock access)
      - MODEL_PROVIDER=openai -> OpenAI
    The mere presence of a GROQ_API_KEY / OPENAI_API_KEY no longer switches
    providers, so a stray key can never override Bedrock in production.
    """
    settings = get_settings()

    provider = os.environ.get("MODEL_PROVIDER", "").lower()

    if provider == "groq":
        from strands.models.openai import OpenAIModel

        groq_key = os.environ.get("GROQ_API_KEY")
        if not groq_key:
            raise ValueError(
                "MODEL_PROVIDER=groq is set but GROQ_API_KEY is missing. "
                "Set GROQ_API_KEY or unset MODEL_PROVIDER to use Amazon Bedrock."
            )
        max_tokens = int(os.environ.get("GROQ_MAX_TOKENS", "800"))
        return OpenAIModel(
            model_id=os.environ.get("GROQ_MODEL_ID", "qwen/qwen3.8-27b"),
            client_args={
                "base_url": "https://api.groq.com/openai/v1",
                "api_key": groq_key,
            },
            params={"max_tokens": max_tokens},
        )

    if provider == "openai":
        from strands.models.openai import OpenAIModel

        return OpenAIModel(
            model_id=os.environ.get("OPENAI_MODEL_ID", "gpt-4o-mini"),
        )

    # Default: Amazon Bedrock (Amazon Nova Lite) — used by the deployed Lambda.
    from strands.models.bedrock import BedrockModel

    return BedrockModel(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_region,
    )

