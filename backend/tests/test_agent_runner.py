"""Tests for the shared agent runner: retry, backoff, and time-budget behavior."""

from unittest.mock import Mock, patch

import pytest
from pydantic import BaseModel

from src.utils.agent_runner import (
    TOTAL_TIME_BUDGET_SECONDS,
    is_non_retryable_error,
    is_rate_limit_error,
    run_agent_with_retry,
)


class DummyOutput(BaseModel):
    """Minimal structured-output model for tests."""

    value: str = "ok"


def _make_agent(side_effect):
    """Build a mock Strands agent whose structured_output uses side_effect."""
    agent = Mock()
    agent.structured_output = Mock(side_effect=side_effect)
    return agent


class TestErrorClassification:
    def test_rate_limit_phrases_detected(self):
        for msg in ("HTTP 429", "rate limit exceeded", "Throttled", "tokens per minute", "OTPM cap", "quota reached", "Too Many Requests"):
            assert is_rate_limit_error(Exception(msg)), msg

    def test_non_retryable_phrases_detected(self):
        for msg in ("401 Unauthorized", "Access Denied", "invalid api key", "404 not found"):
            assert is_non_retryable_error(Exception(msg)), msg

    def test_rate_limit_takes_precedence_over_non_retryable(self):
        # A message with both signals is treated as retryable.
        err = Exception("429 too many requests - authentication throttled")
        assert is_rate_limit_error(err)
        assert not is_non_retryable_error(err)

    def test_schema_error_is_neither(self):
        err = Exception("validation error: field required")
        assert not is_rate_limit_error(err)
        assert not is_non_retryable_error(err)


class TestRateLimitBackoff:
    def test_backoff_then_success(self):
        """(a) 429/throttle errors trigger exponential backoff, then succeed."""
        expected = DummyOutput(value="done")
        agent = _make_agent([
            Exception("HTTP 429 rate_limit_exceeded"),
            Exception("throttled again"),
            expected,
        ])

        with patch("src.utils.agent_runner.time.sleep") as mock_sleep:
            result = run_agent_with_retry(
                agent, "prompt", DummyOutput, "Test Agent", max_retries=2, base_delay=2.5
            )

        assert result is expected
        assert agent.structured_output.call_count == 3
        # Exponential backoff: 2.5 * 2**0, then 2.5 * 2**1.
        assert [c.args[0] for c in mock_sleep.call_args_list] == [2.5, 5.0]
        # Rate-limit retries keep the original prompt unchanged.
        for call in agent.structured_output.call_args_list:
            assert call.kwargs["prompt"] == "prompt"


class TestSchemaCorrection:
    def test_single_correction_retry_then_error(self):
        """(b) Malformed output gets exactly one schema-correction retry, then a controlled error."""
        agent = _make_agent([
            ValueError("invalid JSON: missing field"),
            ValueError("still invalid JSON"),
        ])

        with patch("src.utils.agent_runner.time.sleep") as mock_sleep:
            with pytest.raises(ValueError) as exc:
                run_agent_with_retry(
                    agent, "base prompt", DummyOutput, "Test Agent", max_retries=1
                )

        # Exactly two attempts: original + one correction retry.
        assert agent.structured_output.call_count == 2
        # No sleeping for schema errors.
        mock_sleep.assert_not_called()
        # Controlled, wrapped error message.
        assert "could not produce valid output after retry" in str(exc.value)
        # The retry used a schema-correction prompt.
        first_prompt = agent.structured_output.call_args_list[0].kwargs["prompt"]
        second_prompt = agent.structured_output.call_args_list[1].kwargs["prompt"]
        assert first_prompt == "base prompt"
        assert "previous response was invalid" in second_prompt


class TestNonRetryable:
    def test_non_retryable_error_not_retried(self):
        """(c) Non-retryable errors are raised immediately without retry."""
        agent = _make_agent([Exception("401 Unauthorized - invalid api key")])

        with patch("src.utils.agent_runner.time.sleep") as mock_sleep:
            with pytest.raises(ValueError) as exc:
                run_agent_with_retry(
                    agent, "prompt", DummyOutput, "Test Agent", max_retries=2
                )

        assert agent.structured_output.call_count == 1
        mock_sleep.assert_not_called()
        assert "non-retryable" in str(exc.value)


class TestTimeBudget:
    def test_default_budget_is_about_20s(self):
        """(d) A ~20s total budget is defined to stay under the API Gateway timeout."""
        assert TOTAL_TIME_BUDGET_SECONDS == pytest.approx(20.0)

    def test_budget_stops_backoff_before_gateway_timeout(self):
        """(d) When a backoff would exceed the budget, we give up with a friendly error and do not sleep."""
        agent = _make_agent([
            Exception("429 rate limit"),
            Exception("429 rate limit"),
            DummyOutput(value="never reached"),
        ])

        # base_delay larger than the budget guarantees the first backoff overflows it.
        with patch("src.utils.agent_runner.time.sleep") as mock_sleep:
            with pytest.raises(ValueError) as exc:
                run_agent_with_retry(
                    agent,
                    "prompt",
                    DummyOutput,
                    "Test Agent",
                    max_retries=3,
                    base_delay=100.0,
                    time_budget=20.0,
                )

        # Only the first attempt ran; the disallowed backoff prevented further calls.
        assert agent.structured_output.call_count == 1
        # We never slept past the budget.
        mock_sleep.assert_not_called()
        # User-friendly, non-technical message.
        msg = str(exc.value)
        assert "taking longer than expected" in msg
        assert "429" not in msg
