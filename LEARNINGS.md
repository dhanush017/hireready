# HireReady AI — Engineering Learnings Log 📓
> Documenting architectural insights, SDK challenges, AWS serverless trade-offs, and mistakes & fixes during the hackathon sprint.

---

## 1. AWS Strands Agents SDK & Amazon Bedrock

### What We Learned
- **Strands Agent Abstraction**: The Strands SDK provides a clean pattern separating the model provider (`BedrockModel`), system prompt instructions, and tool calling/structured outputs.
- **Model Selection (Amazon Nova Lite)**:
  - We initially considered Anthropic Claude 3.5 Sonnet on Bedrock, but its per-token cost ($3.00/1M input) and higher latency pose severe risks for a hackathon demo where 30-second API Gateway timeouts loom.
  - Amazon Nova Lite (`amazon.nova-lite-v1:0`) provides blazing fast completion times (< 2.5s for structured profiles) at a fraction of the cost ($0.06/1M input).
- **Single Source of Truth for Model Config**:
  - Centralizing model instantiation in `backend/src/config.py` allows swapping model IDs or switching from Bedrock to local mock providers with one line of code without refactoring agent logic.

### Mistake & Fix
- **Issue**: Strands structured output occasionally failed if the LLM emitted extra markdown backticks or preamble around the JSON payload.
- **Fix**: Implemented `_run_agent_with_retry` in `services/analyze.py`, catching initial schema parse errors and re-prompting with an explicit correction reminder.

---

## 2. Deterministic Scoring vs. LLM "Vibes" Scoring

### What We Learned
- When LLMs are asked to directly provide a match score (e.g., *"Give this resume a score out of 100"*), the result fluctuates randomly between runs (e.g., 65% on one try, 82% on the next) and hallucinated numbers cannot be justified to users.
- **The Hybrid Pattern**:
  1. Let the LLM do what it is best at: unstructured text extraction and semantic understanding (extracting skills, responsibilities, projects into typed Pydantic models).
  2. Hand off structured data to pure, deterministic Python code for matching and scoring.
- **Skill Normalization Map**:
  - Synonyms like `"DSA"`, `"Data Structures & Algorithms"`, and `"Algorithms"` must map to a canonical key before comparison.
- **Related-Skills Partial Credit**:
  - Awarding $0.5$ partial credit when related competencies exist (e.g., SQLite experience gives partial credit for SQL; Docker-Compose gives partial credit for Docker) creates realistic, encouraging scores for students transitioning into industry roles.

---

## 3. Serverless Constraints & API Gateway Latency

### What We Learned
- **The 29-Second Wall**: Amazon API Gateway HTTP APIs enforce a strict 30-second execution timeout. If a Lambda function takes 31 seconds, the gateway returns a `504 Gateway Timeout`.
- **Mitigation Strategy**:
  - **Stateless Endpoint Splitting**: Instead of doing Resume Parsing + Job Parsing + Scoring + Roadmap Generation + 5 Interview Questions in one gigantic 45-second call, we split the workflow into four fast, focused endpoints:
    - `POST /api/analyze` (~4-7s)
    - `POST /api/plan` (~3-5s)
    - `POST /api/interview/questions` (~3-5s)
    - `POST /api/interview/feedback` (~2-4s)
  - **Thread-Pool Parallelism**: In `/api/analyze`, the Resume Agent and Job Agent run concurrently in a `ThreadPoolExecutor`, cutting wall-clock analysis time in half.

---

## 4. Packaging & Runtime Compatibility

### What We Learned
- **Pure Python Dependencies**:
  - Heavy compiled C-extensions (like PyMuPDF or OpenCV) often fail when packaged on Windows and deployed to Amazon Linux Lambda containers.
  - Using `pypdf` (100% pure Python) ensures seamless cross-platform packaging from Windows to AWS Lambda without requiring Docker container compilation.
- **FastAPI + Mangum Adapter**:
  - Mangum bridges standard ASGI HTTP events into AWS Lambda proxy integration seamlessly, allowing local development with standard `uvicorn` and production execution on Lambda with zero code divergence.

---

## 5. Frontend Polish & UX for Hackathon Demos

### What We Learned
- **"One feature that works beats five that almost work"**:
  - Adding a `"Load Demo"` button with realistic student and job description data guarantees that judges and reviewers can immediately test the entire application without hunting for sample PDF resumes.
- **True Transparency Builds Trust**:
  - Showing the exact mathematical formula in plain language and attaching an explicit disclaimer (*"This score is an estimate based on resume evidence, not a hiring prediction"*) distinguishes HireReady AI from deceptive "black-box" ATS calculators.
