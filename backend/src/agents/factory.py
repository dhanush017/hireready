"""Strands Agent factory.

Creates Agent instances with the configured model provider and
system prompts. All agents are created through this module so
switching model providers only requires changing config.py.
"""

from __future__ import annotations

import os
from pathlib import Path
from functools import lru_cache

from strands import Agent

from ..config import get_model

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(filename: str) -> str:
    """Load a system prompt from the prompts/ directory."""
    prompt_path = PROMPTS_DIR / filename
    return prompt_path.read_text(encoding="utf-8").strip()


@lru_cache(maxsize=1)
def get_resume_agent() -> Agent:
    """Create the Resume Parser Agent."""
    return Agent(
        model=get_model(),
        system_prompt=_load_prompt("resume_agent.txt"),
    )


@lru_cache(maxsize=1)
def get_job_agent() -> Agent:
    """Create the Job Description Parser Agent."""
    return Agent(
        model=get_model(),
        system_prompt=_load_prompt("job_agent.txt"),
    )


@lru_cache(maxsize=1)
def get_planner_agent() -> Agent:
    """Create the Career Planning Agent."""
    return Agent(
        model=get_model(),
        system_prompt=_load_prompt("planner_agent.txt"),
    )


@lru_cache(maxsize=1)
def get_interview_agent() -> Agent:
    """Create the Interview Coach Agent."""
    return Agent(
        model=get_model(),
        system_prompt=_load_prompt("interview_agent.txt"),
    )
