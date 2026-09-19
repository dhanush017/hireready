"""FastAPI application handler for AWS Lambda via Mangum.

This is the single entry point for all API endpoints.
"""

from __future__ import annotations

import logging
import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from .config import get_settings
from .schemas.analyze import AnalyzeRequest, AnalysisResult
from .schemas.plan import PlanRequest, PlanResult
from .schemas.interview import (
    InterviewFeedbackRequest,
    InterviewFeedback,
    InterviewQuestionsRequest,
    InterviewQuestionsResult,
)
from .services.analyze import run_analysis
from .services.plan import run_plan
from .services.interview import generate_questions, generate_feedback
from .utils.pdf import PDFExtractionError
from .utils.validation import ValidationError

# Configure logging - do NOT log resume contents
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="HireReady AI",
    description="Your AI Placement Copilot - API",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin] if settings.cors_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "HireReady AI",
        "version": "1.0.0",
    }


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze(request: AnalyzeRequest):
    """Analyze a resume against a job description.

    Extracts structured data from both inputs, runs deterministic
    skill matching, and returns a transparent score with evidence.
    """
    try:
        result = run_analysis(request)
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PDFExtractionError as e:
        raise HTTPException(status_code=400, detail=f"PDF error: {e}")
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"AI processing error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in /analyze: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again.",
        )


@app.post("/api/plan", response_model=PlanResult)
async def plan(request: PlanRequest):
    """Generate a 4-week learning roadmap and project recommendation.

    Takes the analysis result and produces an actionable plan
    focused on closing the candidate's skill gaps.
    """
    try:
        result = run_plan(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"AI processing error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in /plan: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again.",
        )


@app.post("/api/interview/questions", response_model=InterviewQuestionsResult)
async def interview_questions(request: InterviewQuestionsRequest):
    """Generate 5 interview practice questions.

    Questions span resume, technical, DSA, project, and behavioral categories,
    tailored to the candidate's profile and target role.
    """
    try:
        result = generate_questions(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"AI processing error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in /interview/questions: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again.",
        )


@app.post("/api/interview/feedback", response_model=InterviewFeedback)
async def interview_feedback(request: InterviewFeedbackRequest):
    """Provide feedback on a student's interview answer.

    Returns a score, strengths, improvements, and an improved answer.
    """
    try:
        if not request.student_answer or not request.student_answer.strip():
            raise HTTPException(status_code=400, detail="Please provide an answer")
        result = generate_feedback(request)
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"AI processing error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in /interview/feedback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again.",
        )


# Mangum adapter for AWS Lambda
handler = Mangum(app, lifespan="off")
