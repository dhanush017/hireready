"""Shared agent execution utility with rate limit backoff and retry handling.

All retries are bounded by a total wall-clock budget (``TOTAL_TIME_BUDGET_SECONDS``)
so a single request can never approach the API Gateway 29-second timeout. When the
budget is exhausted we stop retrying and raise a clear, user-friendly error.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Type, TypeVar

from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Keep the whole retry loop comfortably under the 29s API Gateway timeout.
TOTAL_TIME_BUDGET_SECONDS: float = 20.0

# Message surfaced to callers when retries are abandoned. Kept generic so it can
# be shown directly to end users without leaking internals.
_BUDGET_MESSAGE = (
    "The AI service is taking longer than expected right now. "
    "Please try again in a moment."
)

# Errors that will never succeed on retry (bad credentials, bad request, etc.).
_NON_RETRYABLE_PHRASES = (
    "401",
    "403",
    "unauthorized",
    "forbidden",
    "access denied",
    "accessdenied",
    "invalid api key",
    "invalid_api_key",
    "authentication",
    "not found",
    "404",
)


def is_rate_limit_error(error: Exception) -> bool:
    """Check if an error indicates a rate limit or token limit exceeded."""
    err_str = str(error).lower()
    return any(
        phrase in err_str
        for phrase in (
            "429",
            "rate_limit",
            "rate limit",
            "throttled",
            "throttling",
            "tokens per minute",
            "otpm",
            "quota",
            "too many requests",
        )
    )


def is_non_retryable_error(error: Exception) -> bool:
    """Check if an error is permanent and should not be retried.

    Rate-limit errors always take precedence (they are retryable) even if the
    message happens to contain an overlapping phrase.
    """
    if is_rate_limit_error(error):
        return False
    err_str = str(error).lower()
    return any(phrase in err_str for phrase in _NON_RETRYABLE_PHRASES)


def run_agent_with_retry(
    agent: Any,
    prompt: str,
    output_model: Type[T],
    agent_name: str,
    max_retries: int = 2,
    base_delay: float = 2.5,
    time_budget: float = TOTAL_TIME_BUDGET_SECONDS,
) -> T:
    """Run a Strands agent with structured output, retrying on transient failures.

    Retry policy:
      - Rate limit / throttle errors -> exponential backoff, then retry.
      - Malformed / schema errors -> retry once with a schema-correction prompt.
      - Permanent errors (auth, bad request) -> raised immediately, no retry.
    The whole loop is bounded by ``time_budget`` seconds; if a backoff would push
    past the budget we stop and raise a user-friendly error instead of sleeping.

    Args:
        agent: Strands agent instance.
        prompt: Prompt string to send.
        output_model: Pydantic model for structured output.
        agent_name: Human-readable name for logging.
        max_retries: Number of retry attempts (default 2).
        base_delay: Seconds to wait on first rate limit (exponential backoff).
        time_budget: Total wall-clock budget in seconds for all attempts.

    Returns:
        Structured output instance of output_model.

    Raises:
        ValueError: On permanent errors, budget exhaustion, or after all retries.
    """
    current_prompt = prompt
    last_error: Exception | None = None
    start = time.monotonic()

    def _elapsed() -> float:
        return time.monotonic() - start

    for attempt in range(max_retries + 1):
        try:
            return agent.structured_output(output_model, prompt=current_prompt)
        except Exception as err:
            last_error = err

            # Permanent failures: don't waste the budget retrying.
            if is_non_retryable_error(err):
                logger.error(f"{agent_name} hit a non-retryable error: {err}")
                raise ValueError(
                    f"{agent_name} failed with a non-retryable error: {err}"
                ) from err

            # Out of attempts.
            if attempt >= max_retries:
                break

            if is_rate_limit_error(err):
                delay = base_delay * (2 ** attempt)
                # Only sleep if we can afford the backoff AND another attempt.
                if _elapsed() + delay >= time_budget:
                    logger.error(
                        f"{agent_name} rate limited and time budget "
                        f"({time_budget:.0f}s) would be exceeded by backoff; giving up."
                    )
                    raise ValueError(_BUDGET_MESSAGE) from err
                logger.warning(
                    f"{agent_name} hit rate limit ({err}). "
                    f"Backing off for {delay:.1f}s before retry "
                    f"({attempt + 1}/{max_retries})..."
                )
                time.sleep(delay)
                # Keep current_prompt unchanged for rate-limit retries.
            else:
                if _elapsed() >= time_budget:
                    logger.error(
                        f"{agent_name} time budget ({time_budget:.0f}s) exhausted "
                        f"before schema-correction retry; giving up."
                    )
                    raise ValueError(_BUDGET_MESSAGE) from err
                logger.warning(
                    f"{agent_name} attempt {attempt + 1} failed: {err}. "
                    f"Retrying with schema correction prompt..."
                )
                current_prompt = (
                    f"{prompt}\n\n"
                    f"IMPORTANT: Your previous response was invalid. "
                    f"Error: {err}. "
                    f"Please respond with valid JSON matching the required schema exactly."
                )

    logger.error(
        f"{agent_name} all {max_retries + 1} attempts failed: {last_error}"
    )
    raise ValueError(
        f"{agent_name} could not produce valid output after retry. "
        f"Error: {last_error}"
    ) from last_error
