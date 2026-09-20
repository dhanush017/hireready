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
- **Fix**: Implemented a retry helper, catching initial schema parse errors and re-prompting with an explicit correction reminder (see section 6 for how this was later centralized).

---

## 6. Multi-Provider Support, Rate Limits & Retry Design

### Provider Switch (Bedrock default, Groq opt-in)
- **What We Learned**: During local development, not every teammate had Bedrock model access enabled, so we added support for Groq (via the OpenAI-compatible `OpenAIModel`) and OpenAI as fallbacks.
- **Mistake & Fix**:
  - **Issue**: The first cut selected Groq implicitly whenever a `GROQ_API_KEY` was present and no AWS credentials were detected. This was fragile and dangerous — a stray environment variable could silently switch the deployed Lambda away from Bedrock.
  - **Fix**: Provider selection is now **explicit-only**. `MODEL_PROVIDER=groq` (or `openai`) is the *only* way to leave Bedrock; the presence of a key alone does nothing. Amazon Bedrock (Nova Lite) is the default, and since the Lambda template never sets `MODEL_PROVIDER`, production always uses Bedrock. `is_groq_provider()` collapsed to a one-line explicit check as a result.

### The Groq Rate-Limit Problem
- **Issue**: Groq enforces an **output-tokens-per-minute (OTPM)** limit. Running the Resume Agent and Job Agent in parallel (as we do on Bedrock via `ThreadPoolExecutor`) spiked output tokens simultaneously and triggered `429` throttling mid-demo.
- **Fix**: In `/api/analyze`, when Groq is the active provider we run the two agents **sequentially with a short pause** between them to spread token usage across the minute window. Bedrock keeps the faster parallel path — it has no equivalent OTPM ceiling for our volume.

### Centralized Retry Helper with a Time Budget
- **What We Learned**: The retry logic had been copy-pasted into three services (`analyze`, `plan`, `interview`). We extracted a single `run_agent_with_retry` into `backend/src/utils/agent_runner.py`.
- **Design**:
  - **Rate-limit / throttle errors** → exponential backoff (`2.5s`, `5s`, …) then retry.
  - **Malformed / schema errors** → exactly one retry with a schema-correction prompt.
  - **Permanent errors** (auth `401/403`, `404`, invalid key) → raised immediately, never retried, so we don't burn the request budget on something that can't succeed.
  - **Total time budget (~20s)** → the whole retry loop is bounded well under the API Gateway 29-second timeout. If a backoff would push past the budget, we stop and return a friendly, non-technical message (*"The AI service is taking longer than expected right now. Please try again in a moment."*) instead of letting the gateway return an opaque `504`.
- **Testing**: `tests/test_agent_runner.py` covers all four behaviors with mocked agents (backoff-then-success, single schema-correction retry, non-retryable short-circuit, and budget enforcement), bringing the suite to 55 tests.

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
