import type {
  AnalysisResult,
  InterviewFeedback,
  InterviewQuestionsResult,
  PlanResult,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Time budget for a single request; the backend caps its own work near 20s, so
// 30s gives headroom while still failing before the user gives up entirely.
const REQUEST_TIMEOUT_MS = 30_000;

export type ApiErrorKind =
  | 'network' // backend unreachable / offline
  | 'timeout' // request took too long
  | 'invalid' // 400 — user input problem
  | 'server' // 5xx / upstream AI error
  | 'unknown';

export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  detail: string;
  constructor(message: string, status: number, kind: ApiErrorKind, detail = '') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.detail = detail;
  }
}

/** Map an error kind (+ optional server detail) to a friendly, actionable message. */
function friendlyMessage(kind: ApiErrorKind, detail: string): string {
  switch (kind) {
    case 'network':
      return "Can't reach the server. Make sure the backend is running on port 8000, then try again.";
    case 'timeout':
      return 'The server took too long to respond. It may be busy — please try again in a moment.';
    case 'invalid':
      // 400s carry a useful, user-facing detail from the backend.
      return detail || 'Some of your input looks invalid. Please review it and try again.';
    case 'server':
      return 'The server ran into a problem processing your request. Please try again shortly.';
    default:
      return detail || 'Something went wrong. Please try again.';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (err: any) {
    // fetch rejects on network failure or abort (timeout).
    const kind: ApiErrorKind = err?.name === 'AbortError' ? 'timeout' : 'network';
    throw new ApiError(friendlyMessage(kind, ''), 0, kind);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        detail =
          typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      detail = response.statusText || '';
    }
    const kind: ApiErrorKind =
      response.status === 400
        ? 'invalid'
        : response.status >= 500
        ? 'server'
        : 'unknown';
    throw new ApiError(friendlyMessage(kind, detail), response.status, kind, detail);
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  return request('/api/health');
}

export async function analyzeResume(payload: {
  resume_text?: string;
  resume_base64?: string;
  job_description: string;
}): Promise<AnalysisResult> {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generatePlan(analysis: AnalysisResult): Promise<PlanResult> {
  return request('/api/plan', {
    method: 'POST',
    body: JSON.stringify({
      resume_profile: analysis.resume_profile,
      job_requirements: analysis.job_requirements,
      matched_skills: analysis.matched_skills,
      partial_skills: analysis.partial_skills,
      missing_skills: analysis.missing_skills,
      gaps: analysis.gaps,
      score: analysis.score,
    }),
  });
}

export async function getInterviewQuestions(
  analysis: AnalysisResult,
  plan: PlanResult
): Promise<InterviewQuestionsResult> {
  return request('/api/interview/questions', {
    method: 'POST',
    body: JSON.stringify({
      resume_profile: analysis.resume_profile,
      job_requirements: analysis.job_requirements,
      gaps: analysis.gaps,
      roadmap: plan.roadmap,
      project: plan.project,
    }),
  });
}

export async function submitInterviewAnswer(payload: {
  question: string;
  category: string;
  student_answer: string;
  analysis: AnalysisResult;
}): Promise<InterviewFeedback> {
  return request('/api/interview/feedback', {
    method: 'POST',
    body: JSON.stringify({
      question: payload.question,
      category: payload.category,
      student_answer: payload.student_answer,
      resume_profile: payload.analysis.resume_profile,
      job_requirements: payload.analysis.job_requirements,
    }),
  });
}
