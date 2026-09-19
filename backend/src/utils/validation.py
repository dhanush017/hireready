"""Input validation and sanitization utilities."""

from __future__ import annotations

from ..config import get_settings


class ValidationError(Exception):
    """Raised when input validation fails."""
    pass


def validate_and_truncate_text(text: str, max_chars: int | None = None, field_name: str = "input") -> tuple[str, str | None]:
    """Validate and optionally truncate text input.

    Returns (text, warning) where warning is None if no truncation occurred.
    """
    if not text or not text.strip():
        raise ValidationError(f"{field_name} cannot be empty")

    text = text.strip()
    settings = get_settings()
    limit = max_chars or settings.max_input_chars

    warning = None
    if len(text) > limit:
        text = text[:limit]
        warning = f"{field_name} was truncated to {limit} characters"

    return text, warning


def validate_resume_input(resume_text: str | None, resume_base64: str | None) -> None:
    """Validate that exactly one resume input is provided."""
    has_text = resume_text is not None and resume_text.strip() != ""
    has_pdf = resume_base64 is not None and resume_base64.strip() != ""

    if not has_text and not has_pdf:
        raise ValidationError("Please provide either resume text or a PDF file")

    if has_pdf:
        # Basic size check on base64 (rough estimate: base64 is ~4/3 of raw size)
        settings = get_settings()
        estimated_size = len(resume_base64) * 3 // 4
        if estimated_size > settings.max_resume_bytes:
            raise ValidationError(f"PDF file exceeds {settings.max_resume_bytes // (1024*1024)} MB limit")
